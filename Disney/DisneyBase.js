// get the base Park class
var Park = require("../parkBase");
// request library
var request = require("request");
// moment library for time formatting
var moment = require("moment-timezone");

// export the Disney base park object
module.exports = DisneyBase;

function DisneyBase(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Generic Disney Park";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://api.wdpro.disney.go.com/facility-service/";

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // generate a random Android useragent
  self.RandomiseUseragent(function(ua) {
    return (ua.osName == "Android");
  });

  // store/cache access token
  //  will be an object with string 'token' and unix timestamp 'expires'
  self._accessToken = null;
  // access token URL requester
  self._accessTokenURL = self._accessTokenURL || "https://authorization.go.com/token";
  self._accessTokenURLBody = self._accessTokenURLBody || "assertion_type=public&client_id=WDPRO-MOBILE.CLIENT-PROD&grant_type=assertion";
  self._accessTokenURLMethod = self._accessTokenURLMethod || "POST";

  // Generic implementation of GetWaitTimes
  //  can be overriden if needed
  this.GetWaitTimes = function(callback) {
    // check the park ID is set
    if (!self.park_id) return self.Error("Park not configured correctly", "Park ID not configured", callback);
    if (!self.park_region) return self.Error("Park not configured correctly", "Park region not configured", callback);

    // fetch wait times from API
    self.FetchURL(self.ContructWaitTimesURL(), {
        data: {
          region: self.park_region,
        },
      },
      function(err, data) {
        if (err) return self.Error("Error fetching wait times", err, callback);
        if (!data) return self.Error("No data returned for wait times", "data is null", callback);
        if (!data.entries) return self.Error("Invalid data returned from API (no entries)", data, callback);

        // build ride array
        var rides = [];
        for (var i = 0; i < data.entries.length; i++) {
          var ride = data.entries[i];

          if (ride.id && ride.name && ride.type && ride.type == "Attraction") {

            var obj = {
              id: self.CleanRideID(ride.id),
              name: ride.name
            };

            // try to find wait time value
            if (ride.waitTime && ride.waitTime && ride.waitTime.postedWaitMinutes) {
              // report the posted wait time if present
              obj.waitTime = ride.waitTime.postedWaitMinutes;
            } else {
              // zero if we cannot find a wait time
              obj.waitTime = 0;
            }

            // work out if the ride is active
            obj.active = (ride.waitTime && ride.waitTime.status == "Operating") ? true : false;

            // work out if we have fastpass
            obj.fastPass = (ride.waitTime.fastPass && ride.waitTime.fastPass.available);

            // add to our return rides array
            rides.push(obj);
          }
        }

        return callback(null, rides);
      });
  };

  // Create the URL for requesting wait times
  this.ContructWaitTimesURL = function() {
    return self.APIBase + "theme-parks/" + self.park_id + "/wait-times";
  };

  // Get park opening times
  this.GetOpeningTimes = function(callback) {
    // get start and end date in park's timezone
    var startDate = moment().tz(self.park_timezone);
    var endDate = moment().add(self.scheduleMaxDates, "days").tz(self.park_timezone);

    self.FetchURL(self.ConstructScheduleURL(startDate, endDate), {
      data: self.ConstructScheduleData(startDate, endDate)
    }, function(err, data) {
      if (err) return self.Error("Error fetching park schedule", err, callback);
      if (!data) return self.Error("No schedule data returned", null, callback);

      // parse/extract schedule data
      self.ParseScheduleData(data, startDate, endDate, function(err, times) {
        if (err) return callback(err);

        return callback(null, times);
      });
    });
  };

  this.ConstructScheduleURL = function(startDate, endDate) {
    return self.APIBase + "schedules/" + self.park_id;
  };

  this.ConstructScheduleData = function(startDate, endDate) {
    return {};
  };

  // default schedule data parser
  //  override for any special park implementations
  this.ParseScheduleData = function(data, startDate, endDate, callback) {
    if (!data.schedules) return self.Error("No schedule data returned", data, callback);

    var times = {};
    // first grab all the "normal" operating hours
    for (var i = 0; i < data.schedules.length; i++) {
      // type, can be "Operating", "Extra Magic Hours" or "Special Ticketed Event" (or potentially anything else)
      if (data.schedules[i].type == "Operating") {
        var day = moment(data.schedules[i].date);
        // skip this entry if it's after the last date we are interested in
        if (day.isAfter(endDate)) continue;
        if (day.isBefore(startDate)) continue;

        // add standard opening times to object
        var dayObj = self.ParseScheduleEntry(data.schedules[i]);
        dayObj.special = [];
        dayObj.date = day.format(self.dateFormat);
        times[dayObj.date] = dayObj;
      }
    }

    // Fetch extra magic hours/ticketed events etc. and add them to existing objects
    for (var i = 0; i < data.schedules.length; i++) {
      if (data.schedules[i].type != "Operating") {
        var day = moment(data.schedules[i].date);
        // skip this entry if it's after the last date we are interested in
        if (day.isAfter(endDate)) continue;
        if (day.isBefore(startDate)) continue;

        var dayFormatted = day.format(self.dateFormat);

        // add non-standard to the standard date objects
        var dayObj = self.ParseScheduleEntry(data.schedules[i]);

        // inject special hours type into object
        dayObj.type = data.schedules[i].type;

        // add onto special hours array for this day
        if (times[dayFormatted]) times[dayFormatted].special.push(dayObj);
      }
    }

    // convert from object into array
    var timeArray = [];
    for (var day in times) {
      timeArray.push(times[day]);
    }

    return callback(null, timeArray);
  };

  this.ParseScheduleEntry = function(entry) {
    // work out opening closing times based on date added to the opening/closing time strings
    var openingTime = moment.tz(entry.date + entry.startTime, "YYYY-MM-DDHH:mm", self.park_timezone);
    var closingTime = moment.tz(entry.date + entry.endTime, "YYYY-MM-DDHH:mm", self.park_timezone);

    // if closing time happens before opening time, must have overspilled into following day
    if (closingTime.isBefore(openingTime)) {
      closingTime.add("1", "day");
    }

    return {
      // format opening and closing times in 'timeFormat' format
      openingTime: openingTime.format(self.timeFormat),
      closingTime: closingTime.format(self.timeFormat),
    };
  };

  self.regexTidyID = /^([^;]+)/;
  // clean up ride IDs returned by API
  this.CleanRideID = function(ride_id) {
    var capture = self.regexTidyID.exec(ride_id);
    if (capture && capture.length > 1) {
      return capture[1];
    }
    return ride_id;
  };

  // Fetch cached/new access token for Disney API methods
  this.GetAccessToken = function(callback) {
    // if we already have an access token, check it is still valid
    if (self._accessToken) {
      // if token has expired...
      if (self._accessToken.expires <= new Date().getTime()) {
        // ... set to null ...
        self.Dbg("Access token has expired, fetching new one");
        self._accessToken = null;
      } else {
        // ... otherwise, return it
        return callback(null, self._accessToken.token);
      }
    }

    // no (valid) cached access token, request a new one!
    self.FetchAccessToken(function(err, token, expires) {
      if (err) return callback(err);

      // cache token for later
      self._accessToken = {
        token: token,
        expires: expires,
      };

      // return access token
      return callback(null, token);
    });
  };

  // Make the network request to create a new access token
  this.FetchAccessToken = function(callback) {
    var reqObj = {
      url: self._accessTokenURL,
      method: self._accessTokenURLMethod,
      headers: {
        "User-Agent": self.useragent,
      },
      body: self._accessTokenURLBody,
    };

    self.Dbg("Fetching", reqObj);

    // request new access token
    request(reqObj,
      function(err, resp, body) {
        if (err) return self.Error("Failed to get access token", err, callback);

        if (resp.statusCode != 200) {
          return self.Error("Unexpected status code for access token response, expected 200", "Got " + resp.statusCode, callback);
        }

        // parse JSON data from response
        var data;
        try {
          data = JSON.parse(body);
        } catch (e) {
          return self.Error("Invalid JSON returned for access token", e, callback);
        }

        if (data && data.access_token && data.expires_in) {
          self.Dbg("Fetched access token " + data.access_token);

          return callback(null, data.access_token, (new Date().getTime()) + ((data.expires_in - 30) * 1000));
        }

        return self.Error("Invalid body response for access token", null, callback);
      }
    );
  };

  // Fetch a WDWjs API URL
  this.FetchURL = function(url, options, callback) {
    // first, get a valid access token
    self.GetAccessToken(function(err, token) {
      if (err) return self.Error("Error getting access token for API URL", err, callback);

      // setup request headers
      var headers = {
        'Authorization': "BEARER " + self._accessToken.token,
        'Accept': 'application/json;apiversion=1',
        'X-Conversation-Id': '~WDPRO-MOBILE.CLIENT-PROD',
        "User-Agent": self.useragent,
      };

      // add/override headers if passed in
      if (options.headers) {
        for (var name in options.headers) headers[name] = options.headers;
      }

      // add stored load balancer instance if we have one saved
      if (self._accessToken.correlation) {
        headers["X-Correlation-Id"] = self._accessToken.correlation;
      }

      // setup options for request lib
      var requestBody = {
        url: url,
        method: options.method || "GET",
        headers: headers,
      };

      // add data to request object (if we have any)
      if (options.data) {
        if (requestBody.method == "GET") {
          requestBody.qs = options.data;
        } else {
          requestBody.data = options.data;
        }
      }

      self.Dbg("Fetching", requestBody);

      // make request
      request(requestBody, function(err, resp, body) {
        // if we get an instance ID from the load balancer, store it
        //  (even if we get an error)
        if (resp && resp.headers && resp.headers["x-correlation-id"]) {
          self._accessToken.correlation = resp.headers["x-correlation-id"];
        }

        if (err) return self.Error("Error making API request", err, callback);

        // attempt to parse the body for JSON Data
        var JSONData = false;
        try {
          JSONData = JSON.parse(body);
        } catch (e) {
          return self.Error("Invalid JSON data returned by API", e, callback);
        }

        return callback(null, JSONData);
      });
    });
  };
}

// sort out prototype inheritance
DisneyBase.prototype = Object.create(Park.prototype);
DisneyBase.prototype.constructor = DisneyBase;