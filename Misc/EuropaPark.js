var Park = require("../parkBase");

var request = require("request");
var moment = require("moment-timezone");
var crypto = require("crypto");

module.exports = [EuropaPark];

function EuropaPark(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Europa-Park";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://apps.europapark.de/webservices/";
  self.APIVersion = self.APIVersion || "4";

  // Europa Park is in Germany
  self.park_timezone = "Europe/Berlin";

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // unset default useragent
  self.useragent = null;

  // include our EuropaData asset (cut from PhoneGap app JS)
  self.RideData = require(__dirname + "/EuropaData.json");

  // generate a code => name object to speed up look-ups
  self.RideNames = {};
  for (var i = 0, ride; ride = self.RideData[i++];) {
    self.RideNames[ride.code] = ride.en || ride.de || ride.fr;
  }

  // opening data cache
  self._scheduleDataCache = null;

  // get park wait times
  this.GetWaitTimes = function(callback) {
    // now generate an access code to get wait times
    var waitTimesAccessCode = self.GenerateWaittimesCodes();

    // then fetch the wait times using the access code we created
    self.MakeNetworkRequest({
      url: self.APIBase + "waittimes/index.php",
      data: {
        "code": waitTimesAccessCode,
        "v": self.APIVersion
      },
    }, function(err, resp, body) {
      // check for standard network error for API response error
      if (err) return self.Error("Error fetching wait times", err, callback);

      // API doesn't return a proper JSON object, so parse it here
      var JSONData = body;
      if (typeof(body) == "string") {
        try {
          JSONData = JSON.parse(body);
        } catch (e) {
          return self.Error("Failed to parse JSON data from Europa API", e + ": " + body, callback);
        }
      }

      if (!JSONData || !JSONData.success) return self.Error("Europa API returned non-success result", JSONData, callback);
      if (!JSONData.results) return self.Error("No results data present in wait times data", JSONData, callback);

      // build ride object
      var rides = [];

      for (var i = 0, ridetime; ridetime = JSONData.results[i++];) {
        // FYI, ridetime.type:
        //   1: rollercoaster
        //   2: water
        //   3: adventure

        rides.push({
          id: ridetime.code,
          name: self.RideNames[ridetime.code] || "??",
          waitTime: parseInt(ridetime.time, 10),
          // TODO
          active: false,
          // Europa doesn't have a fastpass-like system
          fastPass: false,
          // TODO
          status: "Closed",
        });
      }

      return callback(null, rides);
    });
  };

  // generate wait times access code
  this.GenerateWaittimesCodes = function() {
    var currentParkDate = moment().tz(self.park_timezone).format("YYYYMMDDHHmm");
    var hashString = "Europa-Park" + currentParkDate + "SecondTry";
    self.Dbg("Generated Europa-Park hash string", hashString);
    var md5Buffer = crypto.createHash('md5').update(hashString).digest();
    var code = "";
    for (var i = 0; i < md5Buffer.length; i++) {
      code += ((0xF0 & md5Buffer[i]) >> 4).toString(16) + (0xF & md5Buffer[i]).toString(16);
    }

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
      "url": self.APIBase + "opening.php",
      "json": true,
    }, function(err, resp, body) {
      if (err) return self.Error("Error getting opening schedule data", err, callback);

      if (!body || !body.length) return self.Error("No opening data returned by API", body, callback);

      // convert returned object into time parsed data with moment()
      var scheduleData = [];
      for (var i = 0, sched; sched = body[i++];) {
        scheduleData.push({
          "startDate": moment.tz(sched.from, "DD.MM.YYYY", self.park_timezone),
          "endDate": moment.tz(sched.till, "DD.MM.YYYY", self.park_timezone),
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