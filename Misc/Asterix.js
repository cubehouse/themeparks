var Park = require("../parkBase");

var request = require("request");
var moment = require("moment-timezone");
var crypto = require("crypto");

module.exports = [ParcAsterix];

function ParcAsterix(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Parc-Asterix";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://www.parcasterix.fr/webservices/";
  self.APIVersion = self.APIVersion || "1";
  self.appVersion = self.appVersion || "320";
  self.device = self.device || "android";
  self.locale = self.locale || "fr";

  // Parc Asterix is near Paris, France
  self.park_timezone = "Europe/Paris";

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // set useragent
  self.useragent = null;

  // set supports_ride_schedules : this park doesn't support full ride schedules specification
  self.supports_ride_schedules = false;

  // include our AsterixData asset
  self.RideData = require(__dirname + "/AsterixData.json");

  // generate a code => name object to speed up look-ups
  self.RideNames = {};
  for (var i = 0, ride; ride = self.RideData[i++];) {
    self.RideNames[ride.code] = ride;
  }

  // opening data cache
  self._scheduleDataCache = null;

  // get park wait times
  this.GetWaitTimes = function (callback) {
    // then fetch the wait times using the access code we created
    self.MakeNetworkRequest({
      url: self.APIBase + "api/attentix.json",
      qs: {
        "device": self.device,
        "version": self.appVersion,
        "lang": self.locale,
        "apiversion": self.APIVersion
      },
      json: true
    }, function (err, resp, body) {
      // check for standard network error for API response error
      if (err) {
        return self.Error("Error fetching wait times", err, callback);
      }

      if (!body || body.code !== 0) return self.Error("Asterix API returned non-success result", body, callback);
      if (!body.latency || !body.latency.latency || !Array.isArray(body.latency.latency)) return self.Error("No results data present in wait times data", body, callback);

      // build ride object
      var rides = [];

      // RegExp for closing time
      var reClosingTime = /(\d+)h(\d+)/;

      var updateMoment = moment.tz(self.park_timezone);

      for (var i = 0, ridetime; ridetime = body.latency.latency[i++];) {
        if (!ridetime.latency) {
          continue;
        }

        var rideData = self.RideNames[ridetime.attractionid];
        var ride = {
          id: ridetime.attractionid,
          name: (rideData && rideData.title) ? rideData.title : "??",
          waitTime: 0,
          active: false,
          fastPass: (rideData && rideData.coupe_file) ? rideData.coupe_file : false,
          status: "Closed",
        };

        //FYI, latency = "A L'ARRET" / "INDISPONIBLE" / "FERME" / "X" (mn)
        if (ridetime.latency === "A L'ARRET" || ridetime.latency === "INDISPONIBLE") {
          ride.status = "Down";
          ride.active = false;
        } else if (ridetime.latency === "FERME") {
          ride.status = "Closed";
          ride.active = false;
        } else {
          ride.waitTime = parseInt(ridetime.latency, 10);
          ride.status = "Operating";
          ride.active = true;
          if (ridetime.closing_time) {
            var resultRe = reClosingTime.exec(ridetime.closing_time);
            if (resultRe) {
              var closingMoment = moment.tz(self.park_timezone).hours(parseInt(resultRe[1])).minutes(parseInt(resultRe[2])).seconds(0);
              ride.schedule = {
                openingTime: null,
                closingTime: closingMoment.format(self.timeFormat),
                type: "Operating"
              }

              // - Patch status when closing time is known; unfortunatly, the ride status doesn't seems always updated after park closing time.
              if (updateMoment.isAfter(closingMoment) && ride.active === true) {
                ride.status = "Closed";
                ride.active = false;
              }
            }
          }
        }
        rides.push(ride);
      }

      return callback(null, rides);
    });
  };

  // get opening time data
  this.GetOpeningTimes = function (callback) {
    // get raw schedule data first
    self.MakeNetworkRequest({
      url: self.APIBase + "03/fr",
      json: true,
    }, function (err, resp, body) {
      if (err) return self.Error("Error getting opening schedule data", err, callback);

      if (!body || !body.agenda || !Array.isArray(body.agenda)) return self.Error("No opening data returned by API", body, callback);

      var schedule = [];

      var endDay = moment().add(self.scheduleMaxDates, 'days');
      var reTime = /(\d+)h - (\d+|Minuit)(?:h?)/ig;

      for (var i = 0, agenda; agenda = body.agenda[i++];) {
        var day = moment.tz(agenda.jour, "DD-MM-YYYY", self.park_timezone);
        var item = {
          date: day.format(self.dateFormat)
        };

        if (day.isAfter(endDay)) {
          break;
        }

        if (agenda.type === "D") {
          item.type = "Closed";
        } else if (agenda.type === "A") {
          item.type = "Operating";
          var resultRe;
          var firstResult = true;
          while ((resultRe = reTime.exec(agenda.horaire)) !== null) {
            // - Normal time
            if (firstResult === true) {
              item.openingTime = day.clone().hours(parseInt(resultRe[1])).minutes(0).seconds(0).format(self.timeFormat);
              if (resultRe[2] === "Minuit") {
                item.closingTime = day.clone().hours(23).minutes(59).seconds(59).format(self.timeFormat);
              } else {
                item.closingTime = day.clone().hours(parseInt(resultRe[2])).minutes(0).seconds(0).format(self.timeFormat);
              }
              firstResult = false;
            } else {
              // - Special time
              item.special = item.special || [];
              var specialItem = {
                type: "Event"
              };
              specialItem.openingTime = day.clone().hours(parseInt(resultRe[1])).minutes(0).seconds(0).format(self.timeFormat);
              if (resultRe[2] === "Minuit") {
                specialItem.closingTime = day.clone().hours(23).minutes(59).seconds(59).format(self.timeFormat);
              } else {
                specialItem.closingTime = day.clone().hours(parseInt(resultRe[2])).minutes(0).seconds(0).format(self.timeFormat);
              }
              item.special.push(specialItem);
            }
          }

        } else {
          self.Dbg("Unknown agenda type :", agenda.type);
          continue;
        }

        schedule.push(item);
      }

      return callback(null, schedule);
    });
  };
}
