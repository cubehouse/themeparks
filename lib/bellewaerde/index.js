// include core Park class
var Park = require("../park");

var Moment = require("moment-timezone");

var rawRideData = require("./bellewaerdeData.js");
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
                url: this[s_apiBase] + "api-realtime.php"
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

                        rideObject.WaitTime = Number(ridetime.wait) || 0;
                    }
                }

                resolve(rideNames);
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Request park opening times.
     * @returns {Promise}
     */
    FetchOpeningTimes() {
        // calculate how many (and which) years we want to check
        const endYear = Moment().tz(this.Timezone).add(this.ScheduleDays, "days");
        var datePointer = Moment().tz(this.Timezone);
        const years = [];

        this.Log(`Fetching opening hours between ${datePointer.format()} and ${endYear.format()}`);

        // slide along between start and end until we go past endYear to get an array of required year combos
        while (datePointer.isSameOrBefore(endYear, "year")) {
            years.push(datePointer.format("YYYY"));
            datePointer.add(1, "year");
        }

        // loop through each year, calling FetchYearOpeningTimes
        return Promise.all(years.map((year) => {
            return this.FetchYearOpeningTimes(year);
        })).then((results) => {
            // inject results into calendar
            results.map((hours) => {
                hours.map((times) => {
                    this.Schedule.SetDate(times);
                });
            });

            return results;
        });
    }

    /**
     * Fetch park opening times for a specific year and add to park's opening times
     * @param {String} [year]
     */
    FetchYearOpeningTimes(year) {
        return this.HTTP({
            url: this[s_calendarURL] + year,
            method: "GET",
            data: {
                _format: "json"
            },
            json: true
        }).then((openingJSON) => {
            if (openingJSON === null) {
                return Promise.reject("API didn't return expected format");
            }

            var result = [];
            Object.keys(openingJSON.opening_hours).forEach((key) => {
                //FYI, status: "open" / "closed" / "soldout"
                if (openingJSON.opening_hours[key].status === "open") {
                    result.push({
                        date: Moment.tz(`${key}/${year}`, "MM/DD/YYYY", this.Timezone),
                        openingTime: Moment.tz(`${key}/${year}${openingJSON.opening_hours[key].mo_time}`, "MM/DD/YYYYHH:mm", this.Timezone),
                        closingTime: Moment.tz(`${key}/${year}${openingJSON.opening_hours[key].mc_time}`, "MM/DD/YYYYHH:mm", this.Timezone),
                        type: "Operating"
                    });
                } else {
                    result.push({
                        date: Moment.tz(`${key}/${year}`, "MM/DD/YYYY", this.Timezone),
                        type: "Closed"
                    });
                }
            });

            Promise.resolve(result);
        });
    }
}

// export the class
module.exports = Bellewaerde;