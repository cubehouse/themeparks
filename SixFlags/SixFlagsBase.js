var Park = require("../parkBase");

var moment = require("moment-timezone");

// use one access token for all Six Flags parks
var sixFlagsAccessToken = {
  token: null,
  expires: null,
};

// cache ride names
var sixFlagsRideData = {};

// export the Six Flags base park object
module.exports = SixFlagsBase;

function SixFlagsBase(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Six Flags Generic Park Object";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://api.sixflags.net/";
  self.APIPrefix = self.APIPrefix || "api/v4/";

  // token used to login to API
  self.authToken = self.authToken || "MEExQ0RGNjctMjQ3Ni00Q0IyLUFCM0ItMTk1MTNGMUY3NzQ3Ok10WEVKU0hMUjF5ekNTS3FBSVZvWmt6d2ZDUUFUNEIzTVhIZ20rZVRHU29xSkNBRDRXUHlIUnlYK0drcFZYSHJBNU9ZdUFKRHYxU3p3a3UxWS9sM0Z3PT0=";


  // app uses this user agent for requests
  self.useragent = "Jakarta Commons-HttpClient/3.1";

  // have we fetched this park's ride names yet?
  self.rideNamesFetched = false;

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // Get an access token for making API requests
  this.GetAccessToken = function(callback) {
    // if we already have a valid access token, use that
    if (sixFlagsAccessToken && sixFlagsAccessToken.token && sixFlagsAccessToken.expires.isAfter(moment())) {
      return callback(null, sixFlagsAccessToken.token);
    }

    self.MakeRequest(self.APIBase + "Authentication/identity/connect/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + self.authToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      json: true,
      body: "grant_type=client_credentials&scope=mobileApp",
    }, function(err, result) {
      if (err) return self.Error("Error fetching Six Flags access token", err, callback);
      if (!result.access_token) return self.Error("No access token returned by Six Flags API", result, callback);

      self.Dbg("Got Six Flags access token " + result.access_token);

      // set access token
      sixFlagsAccessToken = {
        token: result.access_token,
        expires: moment().add(result.expires_in, "seconds"),
      };

      // return token
      return callback(null, sixFlagsAccessToken.token);
    });
  };

  // Get this park's ride names
  this.GetRideNames = function(callback) {
    // return ride names object if we have already fetched it
    if (sixFlagsRideData && self.rideNamesFetched) return callback(null, sixFlagsRideData);

    if (!self.park_id) return self.Error("No park ID supplied", null, callback);

    // ensure we have an access token first
    self.GetAccessToken(function(err) {
      if (err) return self.Error("Error fetching Six Flags access token", err, callback);

      self.MakeRequest(self.APIBase + self.APIPrefix + "park/" + self.park_id + "/ride", {
        json: true
      }, function(err, data) {
        if (err) return self.Error("Error fetching ride names", err, callback);
        if (!data.rides) return self.Error("No ride data returned", data, callback);

        // store each ride name
        for (var i = 0, rideData; rideData = data.rides[i++];) {
          sixFlagsRideData[rideData.rideId] = rideData;
        }

        // mark this park as having its ride names fetched
        self.rideNamesFetched = true;

        return callback(null, sixFlagsRideData);
      });
    });
  };

  // get wait times for this park
  this.GetWaitTimes = function(callback) {
    if (!self.park_id) return self.Error("No park ID supplied", null, callback);

    // ensure we have an access token first
    self.GetAccessToken(function(err) {
      if (err) return self.Error("Error fetching Six Flags access token", err, callback);

      // make sure we have the ride names first
      self.GetRideNames(function(err, rideNames) {
        if (err) return self.Error("Error getting ride names", err, callback);

        self.MakeRequest(self.APIBase + self.APIPrefix + "park/" + self.park_id + "/rideStatus", {
          json: true
        }, function(err, data) {
          if (err) return self.Error("Error getting ride statuses", err, callback);

          var rideTimes = [];

          for (var i = 0, ride; ride = data.rideStatuses[i++];) {
            rideTimes.push({
              id: ride.rideId,
              name: rideNames[ride.rideId] ? rideNames[ride.rideId].name : "Ride " + ride.rideId,
              waitTime: ride.status == "AttractionStatusOpen" ? (parseInt(ride.waitTime, 10) || 0) : 0,
              active: ride.status == "AttractionStatusOpen" ? true : false,
              fastPass: rideNames[ride.rideId] && rideNames[ride.rideId].isFlashPassEligible ? true : false,
              status: ride.status == "AttractionStatusTemporarilyClosed" ? "Down" : (ride.status == "AttractionStatusOpen" ? "Operating" : "Closed"),
            });
          }

          return callback(null, rideTimes);
        });
      });
    });
  };

  // get park opening times
  this.GetOpeningTimes = function(callback) {
    // ensure we have an access token first
    self.GetAccessToken(function(err) {
      if (err) return self.Error("Error fetching Six Flags access token", err, callback);

      // request park hours
      self.MakeRequest(self.APIBase + self.APIPrefix + "park/" + self.park_id + "/hours", {
        json: true
      }, function(err, data) {
        if (err) return self.Error("Failed to get Six Flags park schedule", err, callback);

        // work out our start and end day for schedule fetching
        var today = moment().tz(self.park_timezone);
        var endDay = moment().add(self.scheduleMaxDates, 'days').tz(self.park_timezone);

        // edge-case! This park has no operating hours. Returned as closed forever.
        //  usually because the park isn't open yet!
        if (data.message && data.message == "No operating hours found for this park") {
          var schedule = [];
          var currentScheduleDay = today;
          for (var i = 0; i < self.scheduleMaxDates; i++) {
            schedule.push({
              date: currentScheduleDay.format(self.dateFormat),
              openingTime: null,
              closingTime: null,
              type: "Closed",
            });
            currentScheduleDay.add(1, "day");
          }
          return callback(null, schedule);
        }

        if (!data.operatingHours) return self.Error("No operating hours returned by park", data, callback);

        // convert operatingHours array into object to make day querying easier
        var hours = {};
        for (var i = 0, day; day = data.operatingHours[i++];) {
          hours[day.operatingDate] = day;
        }

        var currentScheduleDay = today;
        var schedule = [];

        for (var i = 0; i < self.scheduleMaxDates; i++) {
          // operatingDate is in this format, use it to look up today's schedule
          var dayKey = currentScheduleDay.format("YYYY-MM-DDT00:00:00");

          if (hours[dayKey]) {
            schedule.push({
              date: currentScheduleDay.format(self.dateFormat),
              openingTime: moment(hours[dayKey].open).tz(self.park_timezone).format(self.timeFormat),
              closingTime: moment(hours[dayKey].close).tz(self.park_timezone).format(self.timeFormat),
              type: "Operating",
              // unaware of any special opening hours, so leave out of return object for now
              //special: [],
            });
          } else {
            // no data found for day, assume closed
            schedule.push({
              date: currentScheduleDay.format(self.dateFormat),
              openingTime: null,
              closingTime: null,
              type: "Closed",
            });
          }

          // increment along 1 day
          currentScheduleDay.add(1, "day");
        }

        return callback(null, schedule);
      });
    });
  };

  // make an API request
  this.MakeRequest = function(url, options, callback) {
    var headers = {
      'Accept-Language': 'en-US',
      'Connection': 'Keep-Alive',
    };

    // apply custom headers (if set)
    if (options && options.headers) {
      for (var k in options.headers) {
        headers[k] = options.headers[k];
      }
    }

    // if we have an access token, pass it to the API
    if (sixFlagsAccessToken && sixFlagsAccessToken.token && sixFlagsAccessToken.expires.isAfter(moment())) {
      headers["Authorization"] = "Bearer " + sixFlagsAccessToken.token;
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

    // can also just set the request body directly
    if (options.body) requestBody.body = options.body;

    self.MakeNetworkRequest(requestBody, function(err, resp, body) {
      if (err) return self.Error("Error making Six Flags API request", err, callback);

      return callback(null, body);
    });
  };
}