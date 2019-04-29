// include core Park class
var Park = require("../park");

var Moment = require("moment-timezone");

var rawRideData = require(__dirname + "/BellewaerdeData.js");
var rideData = {};
for (var i = 0, ride; ride = rawRideData[i++];) {
    rideData[ride.code] = ride;
}

var s_apiBase = Symbol();
var s_calendarURL = Symbol();

/**
 * Implements the Bellewaerde Park API
 * @class
 * @extends Park
 */
class Bellewaerde extends Park {
    constructor(options = {}) {
        options.name = options.name || "Bellewaerde";
        options.timezone = options.timezone || "Europe/Brussels";
        options.latitude = options.latitude || 50.846996;
        options.longitude = options.longitude || 2.947948;

        // inherit from base class
        super(options);

        // API Options
        this[s_apiBase] = options.api_base || "http://bellewaer.de/realtime/api/";
        this[s_calendarURL] = options.calendarURL || "https://www.bellewaerde.be/en/api/calendar/";
    }

    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
                this.HTTP({
                    url: this[s_apiBase] + 'api-realtime.php'
                }).then(function(waittimes) {
                    // loop over returned data
                    var rideNames = {};

                    for (var i = 0, ridetime; ridetime = waittimes[i++];) {
                      // Filter attractions from poi
                      if (rideData[ridetime.id] && rideData[ridetime.id].type === "Attractions") {
                          var rideObject = this.GetRideObject({
                              id: ridetime.id,
                              name: rideData[ridetime.id].name,
                          });

                          rideObject.WaitTime = ridetime.wait || 0;
                      }
                    }

                    resolve(rideNames);
                }.bind(this), reject);
        }.bind(this));
    }

    FetchYearOpeningTimes(year) {
      return new Promise(function(resolve, reject) {
        this.HTTP({
            url: this[s_calendarURL] + year + '?_format=json'
        }).then(function(openingTimes) {

          console.log(openingTimes)

        }.bind(this), function(error) { console.log(error); reject(error); });
      }.bind(this));
    }
}

// export the class
module.exports = Bellewaerde;
