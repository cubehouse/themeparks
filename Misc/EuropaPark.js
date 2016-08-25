var Park = require("../parkBase");

var moment = require("moment-timezone");
var crypto = require("crypto");

module.exports = [EuropaPark];

function EuropaPark(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Europa-Park";

  // base API URL to use for requests
  self.APIVersion = self.APIVersion || "api-1.1";
  self.APIBase = self.APIBase || "https://api.europapark.de/" + self.APIVersion + "/";
  self.TokenSecret = self.TokenSecret || "ZhQCqoZp";

  // Europa Park is in Germany
  self.park_timezone = "Europe/Berlin";

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // set useragent
  self.useragent = self.useragent || "okhttp/2.7.0";

  // generate a code => name object to speed up look-ups
  self.RideNames = null;

  // opening data cache
  self._scheduleDataCache = null;

  // grab ride names from the API
  this.GetRideData = function(callback) {
    if (self.RideNames != null) return callback(null, self.RideNames);

    // download points of interest data
    self.MakeNetworkRequest({
      url: self.APIBase + "pointsofinterest",
      json: true
    }, function(err, resp, body) {
      if (err) return self.Error("Error getting ride data", err, callback);
      if (resp.statusCode !== 200) return self.Error("Error getting ride data", "Status code: " + resp.statusCode, callback);

      self.RideNames = {};
      for(var i=0, poi; poi=body[i++];) {
        // not all attractions have English names, so fallback to German if missing
        self.RideNames[poi.code] = poi.nameEnglish || poi.nameGerman;
      }

      return callback(null, self.RideNames);
    })
  };

  // get park wait times
  this.GetWaitTimes = function(callback) {
    self.GetRideData(function(err, rideNames) {
      if (err) return self.Error("Error fetching ride names", err, callback);

      // now generate an access code to get wait times
      var waitTimesAccessCode = self.GenerateWaittimesCodes();

      // then fetch the wait times using the access code we created
      self.MakeNetworkRequest({
        url: self.APIBase + "waitingtimes",
        qs: {
          "mock": false,
          "token": waitTimesAccessCode
        },
        json: true
      }, function(err, resp, body) {
        // check for standard network error for API response error
        if (err) return self.Error("Error fetching wait times", err, callback);
        if (resp.statusCode !== 200) return self.Error("Error fetching wait times", "Status code: " + resp.statusCode, callback);
        if (!body || body.length == 0) return self.Error("No data returned from Europa API", body, callback);

        // build ride object
        var rides = [];

        for (var i = 0, ridetime; ridetime = body[i++];) {
          // FYI, ridetime.type:
          //   1: rollercoaster
          //   2: water
          //   3: adventure

          // status meanings:
          //  0: Open!
          //  1: Wait time is over 90 minutes
          //  2: Closed
          //  3: Broken Down
          //  4: Bad weather
          //  5: VIP/Special Tour
          //  other: Probably just crazy long wait times

          // lowest wait time is 1 minute (according to app)
          var waittime = ridetime.time > 0 ? ridetime.time : 0;
          var active = (ridetime.status == 0 || ridetime.status == 1);
          // copy how the app reacts to >90 minute waits
          if (ridetime.status == 1) waittime = 91;
          // is status is open, and ride has zero wait time, it is marked inactive
          //  (copying how the app behaves, rides have minimum of 1 minute wait)
          if (ridetime.status == 0 && ridetime.waittime == 0) {
            active = false;
          }

          var ride = {
            id: ridetime.code,
            name: self.RideNames[ridetime.code],
            waitTime: waittime,
            active: active,
            // Europa park doesn't have a fastpass-like system
            fastPass: false,
            status: active ? "Operating" : "Closed"
          };

          rides.push(ride);
        }

        return callback(null, rides);
      });
    });
  };

  // generate wait times access code
  this.GenerateWaittimesCodes = function() {
    var currentParkDate = moment.utc().format("YYYYMMDDHH");
    self.Dbg("Calculated token date as", currentParkDate);
    var hmac = crypto.createHmac('sha256', self.TokenSecret);
    hmac.update(currentParkDate);
    var code = hmac.digest('hex').toUpperCase();
    self.Dbg("Generated Europa wait times code", code);
    return code;
  };

  // fetch opening time raw data from API
  this.GetOpeningData = function(callback) {
    // check cache for existing data
    if (self._scheduleDataCache && self._scheduleDataCache.expires && self._scheduleDataCache.expires >= Date.now()) {
      return callback(null, self._scheduleDataCache.data);
    }

    // request opening time object
    self.MakeNetworkRequest({
      "url": self.APIBase + "openingtimes",
      "json": true,
    }, function(err, resp, body) {
      if (err) return self.Error("Error getting opening schedule data", err, callback);
      if (resp.statusCode !== 200) return self.Error("Error getting opening schedule data", "Status code: " + resp.statusCode, callback);
      if (!body || !body.length) return self.Error("No opening data returned by API", body, callback);

      // convert returned object into time parsed data with moment()
      var scheduleData = [];
      for (var i = 0, sched; sched = body[i++];) {
        scheduleData.push({
          "startDate": moment.tz(sched.from, "YYYY-MM-DD", self.park_timezone),
          "endDate": moment.tz(sched.until, "YYYY-MM-DD", self.park_timezone),
          "openingTime": sched.start,
          "closingTime": sched.end,
        });
      }

      // store data in cache
      self._scheduleDataCache = {
        "data": scheduleData,
        // keep cache for 7 days
        "expires": Date.now() + 1000 * 60 * 60 * 24 * 7,
      };

      return callback(null, scheduleData);
    });
  };

  // get opening time data
  this.GetOpeningTimes = function(callback) {
    // get raw schedule data first
    self.GetOpeningData(function(err, data) {
      if (err) return self.Error("Failed to get raw opening time data", err, callback);

      var schedule = [];

      // setup loop to get all the desired days
      var today = moment().tz(self.park_timezone);
      var endDay = moment().add(self.scheduleMaxDates, 'days').tz(self.park_timezone);

      for (var day = today; day.isSameOrBefore(endDay); day.add(1, "day")) {
        // check this day against each known opening period for the park
        var foundValidSeason = false;
        for (var i = 0, period; period = data[i++];) {
          if (day.isBetween(period.startDate, period.endDate)) {
            foundValidSeason = true;

            schedule.push({
              "date": day.format(self.dateFormat),
              "openingTime": moment.tz(day.format("YYYY-MM-DD") + period.openingTime, "YYYY-MM-DDHH:mm", self.park_timezone).format(self.timeFormat),
              "closingTime": moment.tz(day.format("YYYY-MM-DD") + period.closingTime, "YYYY-MM-DDHH:mm", self.park_timezone).format(self.timeFormat),
              "type": "Operating",
            });

            break;
          }
        }

        if (!foundValidSeason) {
          // we have no known season for this date, so assume it's closed
          schedule.push({
            "date": day.format(self.dateFormat),
            "type": "Closed",
          });
        }
      }

      return callback(null, schedule);
    });
  };
}
