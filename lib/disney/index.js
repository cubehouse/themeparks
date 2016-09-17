"use strict";

// base Disney World park objects
var Park = require("../park.js");

// HTTP library
var HTTP = require("../http");

// Moment date/time library
var Moment = require("moment-timezone");

// include our Promise library
var Promise = require("../promise");

// load user settings
var Settings = require("../settings");
// configure the Disney API's cache key
var cacheKey = "disneyapi_";

// Disney API configuration keys
var s_disneyAPIResortID = Symbol();
var s_disneyAPIParkID = Symbol();
var s_disneyAPIParkRegion = Symbol();

// API settings
var api_accessTokenURL = "https://authorization.go.com/token";
var api_accessTokenURLBody = "grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD";
var api_accessTokenURLMethod = "POST";
var api_appID = "WDW-MDX-ANDROID-3.4.1";
var api_baseURL = "https://api.wdpro.disney.go.com/";

/**
 * Implements the Walt Disney World API framework. All Disney parks use this one API.
 * @class
 * @extends Park
 */
class WaltDisneyWorldPark extends Park {
    /**
     * Create new WaltDisneyWorldPark Object.
     * This object should not be called directly, but rather extended for each of the individual Disney parks
     * @param {Object} options
     * @param {String} options.resort_id Disney API resort ID
     * @param {String} options.park_id Disney API park ID
     * @param {String} options.park_region Disney API region ID
     */
    constructor(options = {}) {
        options.name = options.name || "Walt Disney World Resort";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3852;
        options.longitude = options.longitude || -81.5639;

        // create a random Android useragent for use with the Disney API
        options.useragent = function(ua) {
            return (ua.osName == "Android");
        };

        // inherit from base class
        super(options);

        // grab disney API configuration settings (or throw an error if value is missing/null)
        if (!options.resort_id) throw new Error("Missing park's resort ID");
        this[s_disneyAPIResortID] = options.resort_id;
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_disneyAPIParkID] = options.park_id;
        if (!options.park_region) throw new Error("Missing park's region");
        this[s_disneyAPIParkRegion] = options.park_region;
    }

    // override Fastpass Getter to declare support for FastPass
    //  (all Disney parks offer Fastpass)
    get FastPass() {
        return true;
    }

    /**
     * Get our current access token
     */
    GetAccessToken() {
        return new Promise(function(resolve, reject) {
            // first, check the cache!
            Settings.Cache.get(cacheKey + "accesstoken", function(err, accessToken) {
                if (err || !accessToken) {
                    // request a fresh access token
                    HTTP({
                        url: api_accessTokenURL,
                        method: api_accessTokenURLMethod,
                        body: api_accessTokenURLBody,
                        // Disney API doesn't want to return as application/JSON, so we'll manually parse it into a nice object
                        forceJSON: true
                    }).then(function(body) {
                        if (!body.access_token) {
                            this.Log("Error body", body);
                            return reject("Returned access token data missing access_token");
                        }
                        if (!body.expires_in) {
                            this.Log("Error body", body);
                            return reject("Returned access token data missing expires_in");
                        }

                        // parse expires_in into an int
                        var expiresIn = parseInt(body.expires_in, 10);

                        this.Log(`Fetched new WDW access_token ${body.access_token}, expires in ${body.expires_in}`);

                        // store access token in cache
                        Settings.Cache.set(cacheKey + "accesstoken", body.access_token, {
                            ttl: expiresIn
                        }, function() {
                            // return our new access token
                            return resolve(body.access_token);
                        });
                    }.bind(this), reject);
                } else {
                    // found cached access token! return it
                    return resolve(accessToken);
                }
            }.bind(this));
        }.bind(this)); // this ensures that the Promise remains in the scope of this object!
    }

    /**
     * Fetch a URL from the Disney API
     */
    GetAPIUrl(requestObject) {
        return new Promise(function(resolve, reject) {
            // get access token
            this.GetAccessToken().then(function(access_token) {
                // TODO - build request object
                // make sure headers exist if they weren't set already
                if (!requestObject.headers) requestObject.headers = [];
                requestObject.headers.Authorization = "BEARER " + access_token;
                requestObject.headers.Accept = "application/json;apiversion=1";
                requestObject.headers["X-Conversation-Id"] = "WDPRO-MOBILE.MDX.CLIENT-PROD";
                requestObject.headers["X-App-Id"] = api_appID;
                requestObject.headers["X-Correlation-ID"] = Date.now();

                // make sure we get JSON back
                requestObject.forceJSON = true;

                // send network request
                HTTP(requestObject).then(resolve, reject);

            }, reject);
        }.bind(this));
    }

    /**
     * Fetch this Disney Park's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            this.GetAPIUrl({
                url: this.FetchWaitTimesURL,
                // pass in park region also
                data: {
                    region: this[s_disneyAPIParkRegion]
                }
            }).then(
                // success!
                function(waitTimeData) {
                    // check we have some data
                    if (!waitTimeData || !waitTimeData.entries) {
                        this.Log("Error data", waitTimeData || "null");
                        return reject("Invalid data returned by WDW API for FetchWaitTimes");
                    }

                    // apply each ride wait time
                    for (var i = 0, ride; ride = waitTimeData.entries[i++];) {
                        this.SetRideWaitTime({
                            // WDW API ride IDs are weird, clean them up first
                            id: CleanRideID(ride.id),
                            name: ride.name || "???",
                            // if no wait minutes are available, return -1
                            wait_time: ride.waitTime.postedWaitMinutes || -1,
                        });
                    }

                    // resolve successfully!
                    return resolve();
                }.bind(this),
                // error
                reject
            );
        }.bind(this));
    }

    /**
     * Fetch this Disney Park's opening times
     * @returns {Promise}
     */
    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            // get today's date and add on a month to get a decent range of dates
            var rangeStart = Moment.tz(this.Timezone).format("YYYY-MM-DD");
            var rangeEnd = Moment.tz(this.Timezone).add(30, "days").format("YYYY-MM-DD");

            this.GetAPIUrl({
                url: this.FetchScheduleTimesURL,
                data: {
                    "filters": "theme-park,Attraction",
                    "startDate": rangeStart,
                    "endDate": rangeEnd,
                    "region": this[s_disneyAPIParkRegion]
                }
            }).then(function(scheduleData) {
                if (!scheduleData || !scheduleData.activities) {
                    this.Log(`Missing activities from ${scheduleData}`);
                    return reject("Missing activities data from opening times API");
                }

                // parse each schedule entry
                for (var i = 0, schedule; schedule = scheduleData.activities[i++];) {
                    // skip if we're missing valid schedule data
                    if (!schedule.schedule) continue;

                    var scheduleID = CleanRideID(schedule.id);
                    for (var j = 0, scheduleTime; scheduleTime = schedule.schedule.schedules[j++];) {
                        // check if we've found the actual park's schedule
                        if (scheduleID == this.WDWParkID) {
                            this.Schedule.SetDate({
                                date: Moment.tz(scheduleTime.date, "YYYY-MM-DD", schedule.timeZone || this.Timezone),
                                openingTime: Moment.tz(`${scheduleTime.date}T${scheduleTime.startTime}`, "YYYY-MM-DDTHH:mm:ss", schedule.timeZone || this.Timezone),
                                closingTime: Moment.tz(`${scheduleTime.date}T${scheduleTime.endTime}`, "YYYY-MM-DDTHH:mm:ss", schedule.timeZone || this.Timezone),
                                type: scheduleTime.type,
                                // work out if these are special hours or not
                                specialHours: (scheduleTime.type != "Operating" && scheduleTime.type != "Closed"),
                            });
                        } else {
                            // TODO - handle ride schedule times
                        }
                    }
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * The URL used to request this park's latest ride waiting times 
     * @type {String}
     */
    get FetchWaitTimesURL() {
        // this is a separate function for any parks that need to override this
        return `${this.APIBase}facility-service/theme-parks/${this.WDWParkID};destination\u003d${this.WDWResortID}/wait-times`;
    }

    /**
     * The URL used to request this park's schedule data
     * @type {String}
     */
    get FetchScheduleTimesURL() {
        return `${this.APIBase}mobile-service/public/ancestor-activities-schedules/${this.WDWResortID};entityType=destination`;
    }

    /**
     * Get the API base URL for WDW parks
     * @type {String}
     */
    get APIBase() {
        return api_baseURL;
    }

    /**
     * Get the internal WDW Park ID
     * @type {String}
     */
    get WDWParkID() {
        return this[s_disneyAPIParkID];
    }

    /**
     * Get the internal WDW Resort ID
     * @type {String}
     */
    get WDWResortID() {
        return this[s_disneyAPIResortID];
    }
}

var regexTidyID = /^([^;]+)/;
/**
 * Clean up a WDW ride id
 * IDs are usually in form [id];entityType=Attraction
 * This will tidy that up to just return the numeric ID portion at the start
 * @private
 */
function CleanRideID(ride_id) {
    var capture = regexTidyID.exec(ride_id);
    if (capture && capture.length > 1) {
        return capture[1];
    }
    return ride_id;
}

// export just the Base Disney Park class
module.exports = WaltDisneyWorldPark;