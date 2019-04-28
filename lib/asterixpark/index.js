// include core Park class
var Park = require("../park");

var Moment = require("moment-timezone");

var s_apiBase = Symbol();
var s_apiVersion = Symbol();
var s_appVersion = Symbol();

var reTime = /(\d+)h - (\d+|Minuit)(?:h?)/ig;
var reClosingTime = /(\d+)h(\d+)/;

/**
 * Implements the Asterix Park API
 * @class
 * @extends Park
 */
class AsterixPark extends Park {
    constructor(options = {}) {
        options.name = options.name || "Parc-Asterix";
        options.timezone = options.timezone || "Europe/Paris";
        options.latitude = options.latitude || 49.136041;
        options.longitude = options.longitude || 2.572768;

        // inherit from base class
        super(options);

        // API Options
        this[s_apiBase] = options.api_base || "https://www.parcasterix.fr/webservices/";
        this[s_apiVersion] = options.api_version || "1";
        this[s_appVersion] = options.app_version || "320";
    }

    // this park supports ride schedules
    get SupportsRideSchedules() {
        return true;
    }

    FetchRideData() {
      return this.Cache.Wrap("ridedata", function() {
          return new Promise(function(resolve, reject) {
              // grab ride names from the API
              this.HTTP({
                  url: this[s_apiBase] + "api/attractions.json",
                  data: {
                      device: "android",
                      version: this[s_appVersion],
                      lang: "fr",
                      apiversion: this[s_apiVersion]
                  }
              }).then(function(body) {
                  // extract names from returned data
                  if (typeof body.result.attractions === undefined) {
                      this.Log("Error body", body);
                      return reject("API didn't return expected format");
                  }

                  var ride_data = body.result.attractions;
                  var rideNames = {};

                  for (var i = 0, poi; poi = ride_data[i++];) {
                      rideNames[poi.code] = {
                        title: poi.title,
                        coupe_file: poi.coupe_file
                      };
                  }

                  resolve(rideNames);
              }.bind(this), reject);
          }.bind(this));
      }.bind(this), 60 * 60 * 24);
    }

    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            // fetch ride names before getting wait times (usually this will come from the cache)
            this.FetchRideData().then(function(rideData) {
                this.HTTP({
                    url: `${this[s_apiBase]}api/attentix.json`,
                    data: {
                        "device": "android",
                        "version": this[s_appVersion],
                        "lang": "fr",
                        "apiversion": this[s_apiVersion]
                    }
                }).then(function(waittimes) {
                    // get opening hours and mark every ride as closed if the park is just actually closed
                    this.GetOpeningTimes().then(function(parkTimes) {
                        var allRidesClosed = true;
                        var todaysOpeningHour;

                        var now = Moment();
                        for (var i = 0, parkTime; parkTime = parkTimes[i++];) {
                            if (parkTime.type == "Operating" && now.isBetween(parkTime.openingTime, parkTime.closingTime)) {
                                allRidesClosed = false;
                                // remember the park's opening hour so we can fill in ride opening times later
                                todaysOpeningHour = parkTime.openingTime;
                            }
                        }

                        if (!waittimes.latency || !waittimes.latency.latency) return reject("API didn't return expected format");

                        var ridetime;
                        for (i = 0, ridetime; ridetime = waittimes.latency.latency[i++];) {
                            // copying app's behavior where undefined latency values and attractions are skipped
                            if(ridetime.latency && rideData[ridetime.attractionid]) {
                                var rideObject = this.GetRideObject({
                                    id: ridetime.attractionid,
                                    name: (rideData[ridetime.attractionid].title) ? rideData[ridetime.attractionid].title : "??",
                                });

                                // if park is closed, just mark all rides as closed
                                if (allRidesClosed) {
                                    rideObject = -1;
                                } else {
                                    //FYI, latency = "OUVERT" / "A L'ARRET" / "INDISPONIBLE" / "FERME" / "X" (mn)
                                    if (ridetime.latency === "A L'ARRET" || ridetime.latency === "INDISPONIBLE") {
                                        rideObject.WaitTime = -2;
                                    } else if (ridetime.latency === "FERME") {
                                        rideObject.WaitTime = -1;
                                    } else if (ridetime.latency === "OUVERT") {
                                        rideObject.WaitTime = 0;
                                    } else {
                                        rideObject.WaitTime = parseInt(ridetime.latency, 10);

                                        if (ridetime.closing_time) {
                                            var resultRe = reClosingTime.exec(ridetime.closing_time);
                                            if (resultRe) {
                                                var closingMoment = Moment.tz(this.Timezone).hours(parseInt(resultRe[1])).minutes(parseInt(resultRe[2])).seconds(0);
                                                rideObject.Schedule.SetDate({
                                                    openingTime: todaysOpeningHour,
                                                    closingTime: closingMoment,
                                                    type: "Operating"
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        resolve();
                    }.bind(this), reject);
                }.bind(this), reject);
            }.bind(this), reject);
        }.bind(this));
    }

    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            this.HTTP({
                url: `${this[s_apiBase]}03/fr`,
                data: {
                    "device": "android",
                    "version": this[s_appVersion],
                    "lang": "fr",
                    "apiversion": this[s_apiVersion]
                }
            }).then(function(openingHours) {
                if (!openingHours.agenda) return reject("API didn't return expected opening hours data");

                for (var i = 0, agenda; agenda = openingHours.agenda[i++];) {
                    var date = Moment.tz(agenda.jour, "DD-MM-YYYY", this.Timezone);

                    if (agenda.type === "D") {
                        // park is closed
                        this.Schedule.SetDate({
                            date: date,
                            type: "Closed"
                        });
                    } else {
                        var resultRe;
                        var firstResult = true;

                        while ((resultRe = reTime.exec(agenda.horaire)) !== null) {
                            // - Normal time
                            this.Schedule.SetDate({
                                date: date,
                                openingTime: date.clone().hours(parseInt(resultRe[1])).minutes(0).seconds(0),
                                closingTime: (resultRe[2] === "Minuit") ? date.endOf("day") : date.clone().hours(parseInt(resultRe[2])).minutes(0).seconds(0),
                                // can't send type for "special hours"
                                type: !firstResult ? null : "Operating",
                                // first result is normal hours, any further dates are special hours
                                specialHours: !firstResult
                            });

                            // mark that we've parsed one set of opening hours, assume any others are special
                            firstResult = false;
                        }
                    }
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

// export the class
module.exports = AsterixPark;
