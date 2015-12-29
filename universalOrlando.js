var request = require("request");
var crypto = require("crypto");
var moment = require("moment-timezone");
require('moment-range');
var async = require("async");
var random_useragent = require('random-useragent');
var cheerio = require("cheerio");

// keep tabs on our access token to save re-fetching it endlessly
var access_token = null;
var access_token_expires = null;

// timezone of the park (for parsing scraped pages from site)
var orlandoTimezone = "America/New_York";

// some standard headers we'll use throughout this implementation
var standard_headers = {
  'Accept': 'application/json',
  'Accept-Language': 'en-US',
  'X-UNIWebService-AppVersion': '1.2.1',
  'X-UNIWebService-Platform': 'Android',
  'X-UNIWebService-PlatformVersion': '4.4.2',
  'X-UNIWebService-Device': 'samsung SM-N9005',
  'X-UNIWebService-ServiceVersion': '1',
  // TODO - random Android user-agent
  'User-Agent': 'Dalvik/1.6.0 (Linux; U; Android 4.4.2; SM-N9005 Build/KOT49H)',
};

function GetAccessToken(cb) {
  // check if an existing access token is still valid
  if (access_token && access_token_expires && access_token_expires.isAfter(moment())) {
    // return cached access token
    return cb(null, access_token);
  }

  var key = "AndroidMobileApp";
  var secret = "AndroidMobileAppSecretKey182014";

  var date = moment.utc().format("ddd, DD MMM YYYY HH:mm:ss") + " GMT";

  // create signature to get access token
  var signature = crypto.createHmac('sha256', secret).update(key + "\n" + date + "\n").digest('base64');
  // convert trailing equal signs to unicode
  signature = signature.replace(/\=$/, "\u003d");

  var headers = {
    "Date": date,
    "Content-Type": "application/json; charset=UTF-8",
  };
  for (var k in standard_headers) headers[k] = standard_headers[k];

  request({
    method: "POST",
    url: "https://services.universalorlando.com/api",
    headers: headers,
    json: {
      apikey: "AndroidMobileApp",
      signature: signature,
    }
  }, function(err, resp, body) {
    if (err) {
      console.error("Error getting access token from Universal API: " + err);
      return cb("Error getting access token from Universal API");
    }

    if (!body) return cb("No body received from Universal API for access token");

    // store access token and expire date/time
    access_token = body.Token;
    access_token_expires = moment(body.TokenExpirationString, "YYYY-MM-DDTHH:mm:ssZ");

    return cb(null, access_token);
  });
}

var poi_data = null;
var poi_data_expires = null;

function GetPOIData(cb) {
  // returned cached data if we have some valid data still
  if (poi_data && poi_data_expires && poi_data_expires > Date.now()) {
    return cb(null, poi_data);
  }

  // get access token first
  GetAccessToken(function(err, token) {
    if (err) return cb(err);

    var headers = {
      'X-UNIWebService-ApiKey': 'AndroidMobileApp',
      'X-UNIWebService-Token': token
    };
    for (var key in standard_headers) headers[key] = standard_headers[key];

    request({
      url: "https://services.universalorlando.com/api/pointsOfInterest",
      method: "GET",
      headers: headers,
      json: true,
    }, function(err, resp, body) {
      if (err) {
        console.error("Error getting Orlando Univeral wait times: " + err);
        return cb("Error getting Orlando Univeral wait times");
      }

      // save poi data for quick access in the immediate future
      poi_data = body;
      // expire data after 1 minute
      poi_data_expires = Date.now() + (1000 * 60);

      return cb(null, poi_data);
    });
  });
}

/** Park object to do requests */
function OrlandoPark(options) {
  var config = {
    park_id: null,
    // calendar URL settings
    calendar_URL: null,
    calendar_VStarget: null,
    // default timezone (Florida time)
    timezone: "America/New_York",
    // time format to return dates in (see momentjs doc http://momentjs.com/docs/#/displaying/format/)
    //  default is ISO8601 format YYYY-MM-DDTHH:mm:ssZ
    timeFormat: "YYYY-MM-DDTHH:mm:ssZ",
    // format for printing days
    dateFormat: "YYYY-MM-DD",
  };

  this.TakeOptions = function(options) {
    // overwrite config with supplied options if they exist
    if (options) {
      for (var key in options) {
        config[key] = options[key];
      }
    }
  };
  this.TakeOptions(options);

  // generate a random useragent for requests
  var useragent = random_useragent.getRandom();

  this.GetWaitTimes = function(cb) {
    if (!config.park_id) return cb("No park ID specified for Universal Orlando API");

    // get (possibly cached) POI data
    GetPOIData(function(err, poi_data) {
      var rides = [];

      for (var i = 0, ride; ride = poi_data.Rides[i++];) {
        // skip if this ride isn't for our current park
        if (ride.VenueId != config.park_id) continue;

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
          // TODO - get opening and closing time for each ride
          //openingTime: null,
          //closingTime: null,
        });
      }

      return cb(null, rides);
    });
  };

  /** Get schedule */
  this.GetSchedule = function() {
    var cb = arguments[arguments.length - 1];

    // check we've been configured correctly
    if (!config.calendar_URL || !config.calendar_VStarget) {
      return cb("Orlando Park ID calendar " + config.park_id + " not configured.");
    }

    // get today's date in Tokyo time and the ending date for our schedule fetch
    var today = moment().tz(orlandoTimezone);
    var endDay = moment().add(30, 'days').tz(orlandoTimezone);

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

    async.eachSeries(todo, function(calendarMonth, cb) {
      request({
        url: config.calendar_URL,
        headers: {
          "User-Agent": useragent
        },
        method: "POST",
        formData: {
          __EVENTTARGET: config.calendar_VStarget,
          __EVENTARGUMENT: "V" + calendarMonth,
        }
      }, function(err, resp, body) {
        if (err) return cb(err);

        // parse returned HTML
        ParseCalendar(body, function(err, data) {
          if (err) return cb(err);

          // loop through returned dates
          for (var i = 0, date; date = data[i++];) {
            // don't start adding to return object until we find our start date value
            if (!startDateFound && !schedule.length) {
              if (!moment(date.date).isSame(today, "day")) continue;
              startDateFound = true;
            }

            // add to returned schedule
            schedule.push(date);

            if (moment(date.date).isSame(endDay, "date")) {
              // reached desired end date, return
              return cb(null);
            }
          }

          // not reached end date yet, return for next async series to process
          return cb(null);
        });
      });
    }, function(err) {
      if (err) return cb(err);

      return cb(null, schedule);
    });
  }

  // match a time from the web calendar
  var scheduleRegex = "([0-9]{2})\:([0-9]{2}) ([AP]M)";
  // match a month and year from header of web calendar
  var monthRegex = /^\s*[A-Z][a-z]{2,8}\s20[0-9]{2}\s*$/g

  // parse HTML from the Universal website calendar
  function ParseCalendar(body, cb) {
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
          var openingTime = moment.tz(currentDate + month + matches[1] + matches[2] + matches[3], "DMMMM YYYYhhmmA", "America/New_York");
          var closingTime = moment.tz(currentDate + month + matches[4] + matches[5] + matches[6], "DMMMM YYYYhhmmA", "America/New_York");
          // if closing time is before opening time, must have ran past midnight!
          if (closingTime.isBefore(openingTime)) {
            closingTime.add("1", "day");
          }

          dates.push({
            date: openingTime.format(config.dateFormat),
            openingTime: openingTime.format(config.timeFormat),
            closingTime: closingTime.format(config.timeFormat),
            // unaware of any other types of opening times from Universal
            type: "Operating",
          });

          currentDate++;
        }
      }
    });

    return cb(null, dates);
  }

}

module.exports = OrlandoPark;

if (!module.parent) {
  var park = new OrlandoPark({
    park_id: 10000
  });
  park.GetSchedule(function(err, token) {
    if (err) return console.error(err);

    console.log(JSON.stringify(token, null, 2));
  });
}