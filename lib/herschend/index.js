"use strict";

// base park objects
var Park = require("../park.js");

// Moment date/time library
var Moment = require("moment-timezone");

// include our Promise library
var Promise = require("../promise");

// API settings
var base_url = "http://pulse.hfecorp.com/api/waitTimes/";

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
     * @param {String} options.park_id is Herschend API park ID
     */
    constructor(options = {}) {
        // inherit from base class
        super(options);
    }

    /**
     * Fetch this Herschend Park's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            this.Log("Running Herschend Park: ${options['name']}");
            this.HTTP({
                url: base_url + this.park_id
            }).then(function(body) {
                var main = this;
                body.forEach(function(ride) {
                    main.Log("Accessing ride ${ride['rideName']}");
                    var rideObject = main.GetRideObject({
                        id: ride["rideId"],
                        name: ride["rideName"]
                    });
                    // Assume that all "UNKNOWN" times are closed rides.
                    if(ride["operationStatus"].includes("CLOSED") || ride["operationStatus"].includes("UNKNOWN")) {
                        rideObject.WaitTime = -1;
                    }
                    // Wait time is not defined if text says "Under x minutes" - we'll set the ride time to x
                    else if(ride["waitTimeDisplay"].includes("UNDER")) {
                        rideObject.WaitTime = parseInt(ride["waitTimeDisplay"].split(" ")[1]);
                    }
                    else {
                        rideObject.WaitTime = parseInt(ride["waitTime"]);
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
            var rangeStart = Moment.tz(this.timezone).format("YYYY-MM-DD");

            this.Log("Running Herschend Park: ${options['name']}");
            this.HTTP({
                url: "https://" + this.url + "/sitecore/api/hfe/hfedata/dailyschedulebytime",
                data: {
                    "date": rangeStart,
                    "days": 30,
                    "parkids": this.parkids
                },
                headers: {
                    "Authorization": "Basic ZXh0cmFuZXRcYXBpdXNlcjpKdzdvZGh3RkhwSzRKZw=="
                }
            }).then(function(scheduleData) {
                // parse each schedule entry
                for(var i=0; i < scheduleData.length; i++){
                    this.Log("Building day: ${day.date} for Herschend Park: ${options['name']}");
                    var day = scheduleData[i];
                    if(day.schedule.parkHours[0].from){
                        this.Schedule.SetDate({
                            date: Moment.tz(day.date, "YYYY-MM-DD", this.timezone),
                            openingTime: Moment.tz(day.schedule.parkHours[0].from, "YYYY-MM-DDTHH:mm:ss", this.timezone),
                            closingTime: Moment.tz(day.schedule.parkHours[0].to, "YYYY-MM-DDTHH:mm:ss", this.timezone)
                        });
                    }
                    else {
                        this.Schedule.SetDate({
                            date: Moment.tz(day.date, "YYYY-MM-DD", this.timezone),
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
