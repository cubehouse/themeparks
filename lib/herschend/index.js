"use strict";

// base park objects
var Park = require("../park.js");

// Moment date/time library
var Moment = require("moment-timezone");

// include our Promise library
var Promise = require("../promise");

// API settings
var base_url = "http://pulse.hfecorp.com/api/waitTimes/";

var s_parkID = Symbol();
var s_calendarURL = Symbol();
var s_parkIDs = Symbol();

/**
 * Implements the Walt Disney World API framework. All Disney parks use this one API.
 * @class
 * @extends Park
 */
class HerschendBase extends Park {
    /**
     * Create new HerschendBase Object.
     * This object should not be called directly, but rather extended for each of the individual Herschend Parks
     * @param {Object} options
     * @param {String} options.park_id Herschend API park ID
     * @param {String} options.calendar_url Herschend calendar base URL
     * @param {String} options.parkids Herschend calendar "parkids" value
     */
    constructor(options = {}) {
        // inherit from base class
        super(options);

        // check we have our park_id
        if (!options.park_id) {
            throw new Error("No park_id supplied for Herschend park");
        }
        this[s_parkID] = options.park_id;

        if (!options.calendar_url) {
            throw new Error("No calendar URL supplied for Herschend park");
        }
        this[s_calendarURL] = options.calendar_url;

        if (!options.parkids) {
            throw new Error("No parkids supplied for Herschend park");
        }
        this[s_parkIDs] = options.parkids;
    }

    /**
     * Fetch this Herschend Park's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            this.HTTP({
                url: base_url + this[s_parkID]
            }).then(function(body) {
                body.forEach((ride) => {
                    var rideObject = this.GetRideObject({
                        id: ride.rideId,
                        name: ride.rideName
                    });

                    // Assume that all "UNKNOWN" times are closed rides.
                    if (ride.operationStatus.includes("CLOSED") || ride.operationStatus.includes("UNKNOWN")) {
                        rideObject.WaitTime = -1;
                    }

                    // Wait time is not defined if text says "Under x minutes" - we'll set the ride time to x
                    else if (ride.waitTimeDisplay.includes("UNDER")) {
                        rideObject.WaitTime = parseInt(ride.waitTimeDisplay.split(" ")[1]);
                    } else {
                        rideObject.WaitTime = parseInt(ride.waitTime);
                    }
                });

                return resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Fetch this Herschend Park's opening times
     * @returns {Promise}
     */
    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            // get today's date and add on a month to get a decent range of dates
            var rangeStart = Moment.tz(this.Timezone).format("YYYY-MM-DD");

            this.HTTP({
                url: "https://" + this[s_calendarURL] + "/sitecore/api/hfe/hfedata/dailyschedulebytime",
                data: {
                    "date": rangeStart,
                    "days": 30,
                    "parkids": this[s_parkIDs]
                },
                headers: {
                    "Authorization": "Basic ZXh0cmFuZXRcYXBpdXNlcjpKdzdvZGh3RkhwSzRKZw=="
                }
            }).then(function(scheduleData) {
                // parse each schedule entry
                for (var i = 0; i < scheduleData.length; i++) {
                    var day = scheduleData[i];

                    if (day.schedule.parkHours[0].from) {
                        this.Schedule.SetDate({
                            date: Moment.tz(day.date, "YYYY-MM-DD", this.Timezone),
                            openingTime: Moment.tz(day.schedule.parkHours[0].from, "YYYY-MM-DDTHH:mm:ss", this.Timezone),
                            closingTime: Moment.tz(day.schedule.parkHours[0].to, "YYYY-MM-DDTHH:mm:ss", this.Timezone)
                        });
                    } else {
                        this.Schedule.SetDate({
                            date: Moment.tz(day.date, "YYYY-MM-DD", this.Timezone),
                            type: "Closed"
                        });
                    }
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

// export just the Base Herschend Park class
module.exports = HerschendBase;