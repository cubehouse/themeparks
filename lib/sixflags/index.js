"use strict";

var Park = require("../park");
var Moment = require("moment-timezone");

var s_parkID = Symbol();

var s_authToken = Symbol();
var s_baseURL = Symbol();
var s_apiVersion = Symbol();

/**
 * Implements the SixFlags API framework.
 * @class
 * @extends Park
 */
class SixFlagsPark extends Park {
    /**
     * Create new SixFlagsPark Object.
     * This object should not be called directly, but rather extended for each of the individual SixFlags parks
     * @param {Object} options
     * @param {String} options.park_id
     * @param {String} [options.auth_token] Auth token for logging into the SixFlags API
     * @param {String} [options.api_url] URL for accessing the SixFlags API (default: https://api.sixflags.net/)
     * @param {String} [options.api_version] API version (default: 6)
     */
    constructor(options = {}) {
        options.name = options.name || "SixFlags Park";

        // inherit from base class
        super(options);

        // assign park configurations
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_parkID] = options.park_id;

        this[s_authToken] = options.auth_token || "MEExQ0RGNjctMjQ3Ni00Q0IyLUFCM0ItMTk1MTNGMUY3NzQ3Ok10WEVKU0hMUjF5ekNTS3FBSVZvWmt6d2ZDUUFUNEIzTVhIZ20rZVRHU29xSkNBRDRXUHlIUnlYK0drcFZYSHJBNU9ZdUFKRHYxU3p3a3UxWS9sM0Z3PT0=";
        this[s_baseURL] = options.api_url || "https://api.sixflags.net/";
        this[s_apiVersion] = options.api_version || "6";
    }

    /**
     * Get the API base URL for making API requests
     * @returns {String} Base URL for the park's API (eg. https://api.sixflags.net/api/v6/)
     */
    get APIBase() {
        return `${this[s_baseURL]}api/v${this[s_apiVersion]}/`;
    }

    // override this from the base class to declare this park supports a FastPass-style service
    get FastPass() {
        return true;
    }

    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            this.GetRideNames().then(function(rideNames) {
                this.GetAPIUrl({
                    url: `${this.APIBase}park/${this[s_parkID]}/rideStatus`
                }).then(function(rideData) {
                    if (!rideData || !rideData.rideStatuses) return reject("Missing ridestatuses from API response");

                    // loop over rides
                    for (var i = 0, ride; ride = rideData.rideStatuses[i++];) {
                        // find/create this ride in our park object
                        var rideObject = this.GetRideObject({
                            id: ride.rideId,
                            name: rideNames[ride.rideId]
                        });

                        if (rideObject) {
                            // update ride time
                            rideObject.WaitTime = (ride.status == "AttractionStatusOpen" ? (parseInt(ride.waitTime, 10) || -1) : -1);
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
                url: `${this.APIBase}park/${this[s_parkID]}/hours`
            }).then(function(scheduleData) {
                if (scheduleData.message && scheduleData.message == "No operating hours found for this park") {
                    // edge-case! park is closed forever! (or not open yet)
                    return resolve();
                }

                if (!scheduleData.operatingHours) return reject("No operating hours returned by park");

                for (var i = 0, day; day = scheduleData.operatingHours[i++];) {
                    var thisDay = Moment(day.operatingDate, "YYYY-MM-DDTHH:mm:ss");
                    this.Schedule.SetDate({
                        openingTime: day.open ? Moment.tz(day.open, "YYYY-MM-DDTHH:mm:ss", this.Timezone) : thisDay,
                        closingTime: day.close ? Moment.tz(day.close, "YYYY-MM-DDTHH:mm:ss", this.Timezone) : thisDay,
                        type: "Operating",
                    });
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Get an access token for making Six Flags API requests
     */
    GetAccessToken() {
        // default ttl for an access token (in case we don't get an expirey time correctly)
        var ttl = 60 * 30;
        return this.Cache.Wrap("accesstoken", function() {
            return new Promise(function(resolve, reject) {
                this.HTTP({
                    url: `${this[s_baseURL]}Authentication/identity/connect/token`,
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${this[s_authToken]}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    data: {
                        "grant_type": "client_credentials",
                        "scope": "mobileApp",
                    },
                    forceJSON: true
                }).then(function(body) {
                    if (!body) return reject("No body returned for access token");
                    if (!body.access_token) return reject("No access_token returned");

                    this.Log("Fetched access token", body.access_token);

                    ttl = body.expires_in || 60 * 30;

                    return resolve(body.access_token);
                }.bind(this), reject);
            }.bind(this));
        }.bind(this), function() {
            return ttl;
        }.bind(this));
    }

    /**
     * Get rides names for all the rides in this park
     * This is either fetched from cache or fresh from the API if not fetched for a while
     * @returns {Promise<Object>} Object of Ride IDs => Ride Names
     */
    GetRideNames() {
        return this.Cache.Wrap("rides", function() {
            return new Promise(function(resolve, reject) {
                // get ride name data
                this.GetAPIUrl({
                    url: `${this.APIBase}park/${this[s_parkID]}/ride`
                }).then(function(body) {
                    if (!body) return reject("No body recieved");
                    if (!body.rides) return reject("No rides returned");

                    // interesting fields
                    //  name
                    //  location.latitude
                    //  location.longitude
                    //  location.radius
                    //  rides
                    //  waitTimesLastUpdated

                    var rideNames = {};
                    for (var i = 0, ride; ride = body.rides[i++];) {
                        // interesting fields
                        //  isFlashPassEligible
                        //  status
                        //  waitTime
                        rideNames[ride.rideId] = ride.name;

                        // this is also where FastPass is determined, so update our rides here
                        var rideObject = this.GetRideObject({
                            id: ride.rideId,
                            name: ride.name
                        });
                        if (rideObject) {
                            rideObject.FastPass = ride.isFlashPassEligible || false;
                        }
                    }

                    resolve(rideNames);
                }.bind(this), reject);
            }.bind(this));
        }.bind(this), 60 * 60 * 12);
    }

    GetAPIUrl(requestObject) {
        return new Promise(function(resolve, reject) {
            // grab an access token first
            this.GetAccessToken().then(function(access_token) {
                // make sure headers exist if they weren't set already
                if (!requestObject.headers) requestObject.headers = [];
                requestObject.headers["Accept-Language"] = "en-US";
                requestObject.headers.Connection = "Keep-Alive";
                requestObject.headers.Authorization = "Bearer " + access_token;

                // make sure we get JSON back
                requestObject.forceJSON = true;

                // send network request
                this.HTTP(requestObject).then(resolve, reject);
            }.bind(this), reject);
        }.bind(this));
    }
}

module.exports = SixFlagsPark;