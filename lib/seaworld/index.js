"use strict";

var Park = require("../park");
var Settings = require("../settings");
var Moment = require("moment-timezone");

var s_parkID = Symbol();

var api_authToken = "c2Vhd29ybGQ6MTM5MzI4ODUwOA==";
var api_baseURL = "https://seas.te2.biz/v1/rest/venue/";

var cacheKey = "seaworldCache_";

/**
 * Implements the Seaworld API framework.
 * @class
 * @extends Park
 */
class SeaworldPark extends Park {
    /**
     * Create new SeaworldPark Object.
     * This object should not be called directly, but rather extended for each of the individual SeaWorld parks
     * @param {Object} options
     * @param {String} options.park_id
     */
    constructor(options = {}) {
        options.name = options.name || "SeaWorld Park";

        // inherit from base class
        super(options);

        // assign park configurations
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_parkID] = options.park_id;
    }

    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            // first make sure we have our ride names
            this.FetchRideNames().then(function(rideNames) {
                this.GetAPIUrl({
                    url: `${api_baseURL}${this[s_parkID]}/poi/all/status`
                }).then(function(waitTimeData) {
                    for (var i = 0, ride; ride = waitTimeData[i++];) {
                        // find/create this ride object (only if we have a name for it)
                        if (rideNames[ride.id]) {
                            var rideObject = this.GetRideObject({
                                id: ride.id,
                                name: rideNames[ride.id]
                            });

                            if (rideObject) {
                                // update ride wait time
                                rideObject.WaitTime = ride.status && ride.status.waitTime ? ride.status.waitTime : -1;
                            }
                        }
                    }

                    resolve();
                }.bind(this), reject);
            }.bind(this), reject);
        }.bind(this));
    }

    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            this.GetAPIUrl({
                url: `${api_baseURL}${this[s_parkID]}/hours/${Moment().tz(this.Timezone).format("YYYY-MM-DD")}`,
                data: {
                    days: 30
                }
            }).then(function(scheduleData) {
                for (var i = 0, day; day = scheduleData[i++];) {
                    var thisDay = Moment(day.date, "YYYY-MM-DD");
                    this.Schedule.SetDate({
                        date: thisDay,
                        openingTime: day.open ? Moment(day.open, "YYYY-MM-DDTHH:mm:ss.SSSZZ").tz(this.Timezone) : thisDay,
                        closingTime: day.close ? Moment(day.close, "YYYY-MM-DDTHH:mm:ss.SSSZZ").tz(this.Timezone) : thisDay,
                        type: day.isOpen ? "Operating" : "Closed",
                    });
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Fetch all the rides and ride names for this park
     * @returns {Promise<Object>} Object of RideID => Ride name in English
     */
    FetchRideNames() {
        return new Promise(function(resolve, reject) {
            Settings.Cache.wrap(cacheKey + `${this[s_parkID]}_ridenames`, function(callback) {
                this.GetAPIUrl({
                    url: `${api_baseURL}${this[s_parkID]}/poi/all`
                }).then(function(rideData) {
                    if (!rideData) return reject("No POI data returned from TDR API");

                    var rideNames = {};
                    for (var i = 0, poi; poi = rideData[i++];) {
                        // only include POIs of configured types
                        if (poi.type == "Ride") {
                            rideNames[poi.id] = poi.label;
                        }
                    }

                    callback(null, rideNames);
                }.bind(this), callback);
            }.bind(this), {
                // cache for 24 hours
                ttl: 60 * 60 * 24
            }, function(err, rideNames) {
                if (err) return reject(err);
                resolve(rideNames);
            }.bind(this));
        }.bind(this));
    }

    GetAPIUrl(requestObject) {
        return new Promise(function(resolve, reject) {
            // make sure headers exist if they weren't set already
            if (!requestObject.headers) requestObject.headers = [];
            requestObject.headers.Authorization = "Basic " + api_authToken;

            // make sure we get JSON back
            requestObject.forceJSON = true;

            // send network request
            this.HTTP(requestObject).then(resolve, reject);
        }.bind(this));
    }
}

module.exports = SeaworldPark;