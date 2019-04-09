"use strict";

var Park = require("../park");
var Moment = require("moment-timezone");

var s_parkID = Symbol();
var s_authToken = Symbol();
var s_apiBase = Symbol();
var s_rideTypes = Symbol();

// this used to be "SeaWorld Park" base, but now it seems SeaWorld have dropped TE2, so refactor this for their other clients.

/**
 * Implements the The Experience Engine API framework.
 * @class
 * @extends Park
 */
class TE2Park extends Park {
    /**
     * Create new TE2Park Object.
     * This object should not be called directly, but rather extended for each of the individual TE2 parks
     * @param {Object} options
     * @param {String} options.park_id ID of the park to access the API for
     * @param {String} [options.auth_token] Auth token to use to connect to the API
     * @param {String} [options.api_base] Base URL to access the API
     * @param {String[]} [options.ride_types] Array of types that denote rides at the park (to avoid listing restaurants/toilets etc. as rides)
     */
    constructor(options = {}) {
        options.name = options.name || "TE2 Park";

        // inherit from base class
        super(options);

        // assign park configurations
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_parkID] = options.park_id;

        // accept API options to override defaults if needed
        this[s_authToken] = options.auth_token || "";
        if (this[s_authToken] === "") {
            // eslint-disable-next-line no-console
            console.error("Please supply an 'auth_token' as a Base64 encoded username:password string for '" + options.name + "'. API credentials have been removed from this library at the request of the park technology operators.");
        }
        this[s_apiBase] = options.api_base || "https://seas.te2.biz/v1/rest/";

        // array of valid ride types. Some implementations of the API use various types to declare rides (eg. Family/Kid/Thrill etc.)
        this[s_rideTypes] = options.ride_types || ["Ride", "Coasters", "Family", "ThrillRides", "Kids"];
    }

    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            // first make sure we have our ride names
            this.GetRideNames().then(function(rideNames) {
                this.GetAPIUrl({
                    url: `${this[s_apiBase]}venue/${this[s_parkID]}/poi/all/status`
                }).then(function(waitTimeData) {
                    for (var i = 0, ride; ride = waitTimeData[i++];) {
                        // find/create this ride object (only if we have a name for it)
                        if (rideNames[ride.id]) {
                            var rideObject = this.GetRideObject({
                                id: ride.id,
                                name: rideNames[ride.id]
                            });

                            if (rideObject && ride.status) {
                                // update ride wait time
                                rideObject.WaitTime = ride.status.waitTime ? ride.status.waitTime : (ride.status.isOpen ? 0 : -1);
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
                url: `${this[s_apiBase]}venue/${this[s_parkID]}/hours/${Moment().tz(this.Timezone).format("YYYY-MM-DD")}`,
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
     * Get cached (or fresh fetch) of ride names
     * @returns {Promise<Object>} Object of RideID => Ride name in English
     */
    GetRideNames() {
        return new Promise(function(resolve, reject) {
            // wrap cache request (cache ride names for 24 hours)
            this.Cache.Wrap("ridenames", this.FetchRideNames.bind(this), 60 * 60 * 24).then(resolve, reject);
        }.bind(this));
    }

    /**
     * Fetch all the rides and ride names for this park from the API (skip the cache)
     * @returns {Promise<Object>} Object of RideID => Ride name in English
     */
    FetchRideNames() {
        return new Promise(function(resolve, reject) {
            this.Log(`Fetching ride names for ${this.Name}`);

            // fetch POI (points-of-interest) data from API
            this.GetAPIUrl({
                url: `${this[s_apiBase]}venue/${this[s_parkID]}/poi/all`
            }).then(function(rideData) {
                if (!rideData) return reject("No POI data returned from Seaworld API");

                var rideNames = {};
                for (var i = 0, poi; poi = rideData[i++];) {
                    // only include POI data for rides
                    if (this[s_rideTypes].indexOf(poi.type) >= 0) {
                        // grab "label", which is the English title for each POI
                        rideNames[poi.id] = poi.label;
                    }
                }

                resolve(rideNames);
            }.bind(this), reject);
        }.bind(this));
    }

    GetAPIUrl(requestObject) {
        if (this[s_authToken] === "") {
            return Promise.reject(new Error("Unable to complete request without park auth_token. auth_token has been removed from the themeparks library under request by the theme park's technology operation representatives."));
        }

        return new Promise(function(resolve, reject) {
            // make sure headers exist if they weren't set already
            if (!requestObject.headers) requestObject.headers = [];
            requestObject.headers.Authorization = "Basic " + this[s_authToken];

            // make sure we get JSON back
            requestObject.forceJSON = true;

            // send network request
            this.HTTP(requestObject).then(resolve, reject);
        }.bind(this));
    }

    /**
     * Get the park ID used by the SeaWorld/Cedar Fair API
     * @type {String}
     * */
    get ParkID() {
        return this[s_parkID];
    }

    /**
     * Get this park's API Base URL
     * @type {String}
     * */
    get APIBase() {
        return this[s_apiBase];
    }
}

module.exports = TE2Park;