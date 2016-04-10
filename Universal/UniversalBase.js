var Park = require("../parkBase");

var moment = require("moment-timezone");
require('moment-range');
var crypto = require("crypto");
var async = require("async");
var cheerio = require("cheerio");

// export the Universal base park object
module.exports = UniversalBase;

// universal app internal config
var appKey = "AndroidMobileApp";
var appSecret = "AndroidMobileAppSecretKey182014";

// match a time from the web calendar
var scheduleRegex = "([0-9]{2})\:([0-9]{2}) ([AP]M)";
// match a month and year from header of web calendar
var monthRegex = /^\s*[A-Z][a-z]{2,8}\s20[0-9]{2}\s*$/g

function UniversalBase(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Universal Generic Park";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://services.universalorlando.com/api/";

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // generate a random Android useragent
  self.RandomiseUseragent(function(ua) {
    return (ua.osName == "Android");
  });

  // get park wait times
  this.GetWaitTimes = function(callback) {
    if (!self.park_id) return self.Error("No park ID specified for Universal Orlando API", null, callback);

    // get (possibly cached) POI data
    self.GetPOIData(function(err) {
      if (err) return self.Error("Error getting POI data", err, callback);
      if (typeof self.poi_data === 'undefined') return self.Error("Error getting Universal POI Data", null, callback);

      var rides = [];

      for (var i = 0, ride; ride = self.poi_data.Rides[i++];) {
        // skip if this ride isn't for our current park
        if (ride.VenueId != self.park_id) continue;

        // waitTimes assumed key:
        //  -1 seems to mean "closed"
        //  -2 means "delayed", which I guess is a nice way of saying "broken"
        //  -3 and -50 seems to mean planned closure

        var active = true;
        if (ride.WaitTime < 0) {
          active = false;
          ride.WaitTime = 0;
        }

        rides.push({
          id: ride.Id,
          name: ride.MblDisplayName,
          waitTime: ride.WaitTime,
          active: active,
          fastPass: ride.ExpressPassAccepted,
          status: ride.WaitTime == -2 ? "Down" : (active ? "Operating" : "Closed"),
        });
      }

      return callback(null, rides);
    });
  };

  this.GetOpeningTimes = function(callback) {
    // check we've been configured correctly
    if (!self.calendar_URL || !self.calendar_VStarget) return self.Error("Orlando Park ID calendar " + self.park_id + " not configured.", null, callback);

    // get today's date in local time and the ending date for our schedule fetch
    var today = moment().tz(self.park_timezone);
    var endDay = moment().add(self.scheduleMaxDates, 'days').tz(self.park_timezone);

    // So. Orlando's calendar page uses ASPX ViewStates etc, and seems to have an encrpyted view state.
    // Rather than try to interfere with that, I'm just sending POST data directly and letting the server
    //  create us a Viewstate and generally side-stepping that pain.

    // The POST data needs two keys to update the viewstate:
    //  __EVENTTARGET: "UniversalStudiosFloridaCalendar$ECalendar" (or similar)
    //  __EVENTARGUMENT: Z[number of days to start of the month from 2000-01-01]

    var Y2K = moment("2000-01-01", "YYYY-MM-DD");

    // get today's date and the current month
    var requestStart = moment.range(Y2K, moment(today.format("YYYY-MM"), "YYYY-MM")).diff("days");

    // get formatted end date for fetching
    var requestEnd = moment.range(Y2K, moment(endDay.format("YYYY-MM"), "YYYY-MM")).diff("days");

    // get list of month calendars to process (either just this month, or this month and next)
    var todo = [requestStart];
    if (requestEnd != requestStart) {
      todo.push(requestEnd);
    }

    var schedule = [];
    var startDateFound = false;

    async.eachSeries(todo, function(calendarMonth, callback) {
      var requestObj = {
        url: self.calendar_URL,
        method: "POST",
        formData: {
          __EVENTTARGET: self.calendar_VStarget,
          __EVENTARGUMENT: "V" + calendarMonth,
        }
      };

      self.MakeNetworkRequest(requestObj, function(err, resp, body) {
        if (err) return self.Error("Error fetching calendar page", err, callback);

        // parse returned HTML
        self.ParseCalendar(body, function(err, data) {
          if (err) return self.Error("Failed to parse calendar page HTML", err, callback);

          // loop through returned dates
          for (var i = 0, date; date = data[i++];) {
            // don't start adding to return object until we find our start date value
            if (!startDateFound && !schedule.length) {
              if (!moment(date.date).isSameOrAfter(today, "day")) continue;
              startDateFound = true;
            }

            // add to returned schedule
            schedule.push(date);

            if (moment(date.date).isSameOrAfter(endDay, "date")) {
              // reached desired end date, return
              return callback(null);
            }
          }

          // not reached end date yet, return for next async series to process
          return callback(null);
        });
      });
    }, function(err) {
      self.Dbg("FDSAfdsfds");
      if (err) return self.Error("Failed to fetch calendar data", err, callback);
      return callback(null, schedule);
    });
  };

  // parse HTML from the Universal website calendar
  this.ParseCalendar = function(body, callback) {
    // make a parsed HTML object of our HTML body
    var $ = cheerio.load(body);

    var month = null;
    var currentDate = 1;
    var dates = [];

    $("td").each(function(i, el) {
      var str = $(el).text();
      if (!month) {
        // try to match month from calendar header
        if (monthRegex.test(str)) {
          month = str;
        }
      } else {
        // try to match currently sought after date of this month
        var dateRegex = new RegExp("" + currentDate + scheduleRegex + " \- " + scheduleRegex);
        var matches = str.match(dateRegex);
        // if success...
        if (matches) {
          // ... store result and incrememt current date
          var openingTime = moment.tz(currentDate + month + matches[1] + matches[2] + matches[3], "DMMMM YYYYhhmmA", self.park_timezone);
          var closingTime = moment.tz(currentDate + month + matches[4] + matches[5] + matches[6], "DMMMM YYYYhhmmA", self.park_timezone);

          // if closing time is before opening time, must have ran past midnight!
          if (closingTime.isBefore(openingTime)) {
            closingTime.add("1", "day");
          }

          dates.push({
            date: openingTime.format(self.dateFormat),
            openingTime: openingTime.tz(self.timeFormatTimezone).format(self.timeFormat),
            closingTime: closingTime.tz(self.timeFormatTimezone).format(self.timeFormat),
            // unaware of any other types of opening times from Universal
            type: "Operating",
          });

          currentDate++;
        }
      }
    });

    return callback(null, dates);
  };

  // get access token for accessing Universal API
  this.GetAccessToken = function(callback) {
    // check if an existing access token is still valid
    if (self.access_token && self.access_token_expires && self.access_token_expires.isAfter(moment())) {
      // return cached access token
      return callback(null, self.access_token);
    }

    // make sure access token is unset before requesting a new one
    if (self.access_token) self.access_token = null;

    // calculate current date to generate access token signature
    var date = moment.utc().format("ddd, DD MMM YYYY HH:mm:ss") + " GMT";

    // create signature to get access token
    var signature = crypto.createHmac('sha256', appSecret).update(appKey + "\n" + date + "\n").digest('base64');
    // convert trailing equal signs to unicode. because.
    signature = signature.replace(/\=$/, "\u003d");

    // request the access token
    self.MakeRequest(self.APIBase, {
      method: "POST",
      headers: {
        "Date": date
      },
      json: {
        apikey: "AndroidMobileApp",
        signature: signature,
      }
    }, function(err, body) {
      if (err) return self.Error("Failed to get Universal access token", err, callback);
      if (!body) return self.Error("No body received from Universal API for access token", null, callback);

      // store access token and expire date/time
      self.access_token = body.Token;
      self.access_token_expires = moment(body.TokenExpirationString, "YYYY-MM-DDTHH:mm:ssZ");

      return callback(null, self.access_token);
    });
  };

  this.MakeRequest = function(url, options, callback) {
    var headers = {
      "Content-Type": "application/json; charset=UTF-8",
      'Accept': 'application/json',
      'Accept-Language': 'en-US',
    };

    // apply custom headers (if set)
    if (options && options.headers) {
      for (var k in options.headers) {
        headers[k] = options.headers[k];
      }
    }

    // if we have an access token, pass it to the API
    if (self.access_token) {
      headers["X-UNIWebService-ApiKey"] = "AndroidMobileApp";
      headers["X-UNIWebService-Token"] = self.access_token;
    }

    // build request object
    var requestBody = {
      method: (options && options.method) ? options.method : "GET",
      url: url,
      headers: headers,
    };

    // add JSON data if requested
    if (options.json) {
      requestBody.json = options.json;
    }

    // add data to request object (if we have any)
    if (options.data) {
      if (requestBody.method == "GET") {
        requestBody.qs = options.data;
      } else {
        requestBody.data = options.data;
      }
    }

    self.MakeNetworkRequest(requestBody, function(err, resp, body) {
      if (err) return self.Error("Error making Universal API request", err, callback);

      return callback(null, body);
    });
  };

  // get POI data from API
  this.GetPOIData = function(callback) {
    // returned cached data if we have some valid data still
    if (self.poi_data && self.poi_data_expires && self.poi_data_expires > Date.now()) {
      return callback(null, self.poi_data);
    }

    // get access token first
    self.GetAccessToken(function(err, token) {
      if (err) return this.Error("Failed to get access token", err, callback);

      self.MakeRequest(self.APIBase + "pointsOfInterest", {
        json: true
      }, function(err, body) {
        if (err) return self.Error("Failed to get Universal POI data", err, callback);

        // save poi data for quick access in the immediate future
        self.poi_data = body;
        // expire data after 1 minute
        self.poi_data_expires = Date.now() + (1000 * 60);

        return callback(null, self.poi_data);
      });
    });
  };
}