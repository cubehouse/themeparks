"use strict";

// base Disney World park objects
var Park = require("../park.js");

// we're storing ride locations now, so include our location lib
var GeoLocation = require("../geoLocation.js");

// need schedule lib to store ride times
var Schedule = require("../schedule");

// Moment date/time library
var Moment = require("moment-timezone");

// random useragent generator
var random_useragent = require("random-useragent");

// include our Promise library
var Promise = require("../promise");

// Disney API configuration keys
var s_disneyAPIResortID = Symbol();
var s_disneyAPIParkID = Symbol();
var s_disneyAPIParkRegion = Symbol();
var s_rideSchedules = Symbol();
var s_rideTypes = Symbol();

// API settings
var api_accessTokenURL = "https://authorization.go.com/token";
var api_accessTokenURLBody = "grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD";
var api_accessTokenURLMethod = "POST";
var api_appID = "WDW-MDX-ANDROID-3.4.1";
var api_baseURL = "https://api.wdpro.disney.go.com/";

// use the same user-agent for all WDW park requests
var api_userAgent = random_useragent.getRandom(function(ua) {
    return (ua.osName == "Android");
});

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
     * @param {String[]} options.ride_types Array of attraction types to return when getting wait times, eg. ["Attraction", "Entertainment"]
     */
    constructor(options = {}) {
        options.name = options.name || "Walt Disney World Resort";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3852;
        options.longitude = options.longitude || -81.5639;

        // use our userAgent generated randomly on bootup
        options.useragent = api_userAgent;

        // inherit from base class
        super(options);

        // grab disney API configuration settings (or throw an error if value is missing/null)
        if (!options.resort_id) throw new Error("Missing park's resort ID");
        this[s_disneyAPIResortID] = options.resort_id;
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_disneyAPIParkID] = options.park_id;
        if (!options.park_region) throw new Error("Missing park's region");
        this[s_disneyAPIParkRegion] = options.park_region;

        // valid ride types to return
        this[s_rideTypes] = options.ride_types || ["Attraction"];
        // make sure ride types is an array
        this[s_rideTypes] = [].concat(this[s_rideTypes]);

        // store ride schedules separately and apply them when needed
        this[s_rideSchedules] = {};
    }

    // override Fastpass Getter to declare support for FastPass
    //  (all Disney parks offer Fastpass)
    get FastPass() {
        return true;
    }

    // override ride schedule getter to state this park supports ride schedules
    get SupportsRideSchedules() {
        return true;
    }

    /**
     * Get our current access token
     */
    GetAccessToken() {
        var expiresIn;
        return this.Cache.Wrap("accesstoken", function() {
            return new Promise(function(resolve, reject) {
                // request a fresh access token
                this.HTTP({
                    url: this.AuthURL,
                    method: api_accessTokenURLMethod,
                    body: this.AuthString,
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
                    var ttlExpiresIn = parseInt(body.expires_in, 10);

                    // The ttlExpiresIn is the maximum time the access_token is valid. 
                    // It's possible for the token to be given back just moments before
                    // it is invalid. Therefore we should force the ttl value in the
                    // cache lower than this value so requests don't fail.
                    expiresIn = Math.ceil(ttlExpiresIn * .90);

                    this.Log(`Fetched new WDW access_token ${body.access_token}, expires in ${body.expires_in}, caching for a maximum of ${expiresIn}`);

                    // return our new access token
                    return resolve(body.access_token);
                }.bind(this), reject);
            }.bind(this));
        }.bind(this), function() {
            return expiresIn;
        }.bind(this));
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
                this.HTTP(requestObject).then(resolve, reject);

            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Fetch this Disney Park's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            // fetch opening times before wait times (so we have opening times to inject into rides)
            this.GetOpeningTimes().then(function() {
                // fetch wait times URL
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

                        // fetch facilities data to inject locations (coming soon) and fastPass availability
                        this.GetFacilitiesData().then((facilitiesData) => {

                            // apply each ride wait time
                            for (var i = 0, ride; ride = waitTimeData.entries[i++];) {
                                // skip any ride without a name, likely an invalid ride
                                //  eg. the River Rogue Keelboats at DLP are dormant and invalid, but still have a ride object with no name
                                if (!ride.name) {
                                    continue;
                                }

                                // only keep actual attractions
                                if (this[s_rideTypes].indexOf(ride.type) < 0) {
                                    continue;
                                }

                                var rideId = CleanRideID(ride.id);

                                // get the ride object for this ride (will create it if it doesn't exist)
                                var rideObject = this.GetRideObject({
                                    id: rideId,
                                    name: ride.name,
                                });

                                let rideStatus = (ride.waitTime && ride.waitTime.status) ? ride.waitTime.status.toLowerCase() : "";
                                if (rideStatus == "down") {
                                    rideObject.WaitTime = -2;
                                } else if (rideStatus == "operating") {
                                    rideObject.WaitTime = ride.waitTime.postedWaitMinutes || 0;
                                } else {
                                    rideObject.WaitTime = ride.waitTime.postedWaitMinutes || -1;
                                }

                                // set fastpass status from facilities data
                                if (facilitiesData[rideId]) {
                                    rideObject.FastPass = facilitiesData[rideId] ? facilitiesData[rideId].fastPass : false;
                                } else {
                                    // no facilities data? fallback on live fastPass availability
                                    rideObject.FastPass = (ride.waitTime &&
                                        // check for both fastpass and fastPass
                                        (ride.waitTime.fastpass && ride.waitTime.fastpass.available) ||
                                        (ride.waitTime.fastPass && ride.waitTime.fastPass.available)
                                    ) ? true : false;
                                }

                                // some Disney parks return fastpass return times! search them out
                                if (ride.waitTime && ride.waitTime.fastPass) {
                                    if (!ride.waitTime.fastPass.available) {
                                        rideObject.FastPassReturnTimeAvailable = false;
                                    } else {
                                        if (ride.waitTime.fastPass.startTime && ride.waitTime.fastPass.endTime) {
                                            // we have start and end return times! convert to Moment objects and set
                                            rideObject.FastPassReturnTimeStart = Moment.tz(ride.waitTime.fastPass.startTime, "HH:mm:ss", this.Timezone);
                                            rideObject.FastPassReturnTimeEnd = Moment.tz(ride.waitTime.fastPass.endTime, "HH:mm:ss", this.Timezone);
                                        }
                                    }
                                }

                                // apply any schedule data we've fetched from opening hour data
                                if (this[s_rideSchedules][rideId]) {
                                    var endFillDate = Moment().tz(this.Timezone).add(90, "days");
                                    for (var m = Moment().tz(this.Timezone); m.isBefore(endFillDate); m.add(1, "day")) {
                                        var rideScheduleData = this[s_rideSchedules][rideId].GetDate({
                                            date: m
                                        });
                                        if (rideScheduleData) {
                                            rideObject.Schedule.SetDate(rideScheduleData);
                                        }
                                    }
                                }
                            }

                            return resolve();
                        });
                    }.bind(this),
                    // error
                    reject
                );
            }.bind(this), reject);
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
                        var newScheduleData = {
                            date: Moment.tz(scheduleTime.date, "YYYY-MM-DD", schedule.timeZone || this.Timezone),
                            openingTime: Moment.tz(`${scheduleTime.date}T${scheduleTime.startTime}`, "YYYY-MM-DDTHH:mm:ss", schedule.timeZone || this.Timezone),
                            closingTime: Moment.tz(`${scheduleTime.date}T${scheduleTime.endTime}`, "YYYY-MM-DDTHH:mm:ss", schedule.timeZone || this.Timezone),
                            type: scheduleTime.type,
                            // work out if these are special hours or not
                            specialHours: (scheduleTime.type != "Operating" && scheduleTime.type != "Closed" && scheduleTime.type != "Refurbishment"),
                        };

                        // check if we've found the actual park's schedule
                        if (scheduleID == this.WDWParkID) {
                            // apply data to our schedule
                            this.Schedule.SetDate(newScheduleData);
                        } else {
                            // else, we must be a ride! (or event/parade or something)

                            // remember ride schedules and apply them when FetchWaitTimes is called
                            if (!this[s_rideSchedules][scheduleID]) {
                                this[s_rideSchedules][scheduleID] = new Schedule();
                            }

                            this[s_rideSchedules][scheduleID].SetDate(newScheduleData);
                        }
                    }
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Get park facilities data
     * Gives us data like whether a ride offers FastPass and their geo-location
     */
    GetFacilitiesData() {
        // cache facilities data for 24 hours (this fetches all data for the resort, so cache at a resort level with a global wrap)
        return this.Cache.WrapGlobal(`${this.WDWResortID}_facilities`, () => {
            // fetch fresh facilities data
            return this.GetAPIUrl({
                url: this.FetchFacilitiesURL,
                method: "POST"
            }).then((data) => {
                var facilitiesData = {};

                for (var i = 0, element; element = data.added[i++];) {
                    if (element.type != "Attraction") continue;

                    // grab ride coordinates (there will be likely multiple)
                    var coordinates = [];
                    for (var locationIDX = 0, location; location = element.relatedLocations[locationIDX++];) {
                        for (var coordinateIDX = 0, coordinate; coordinate = location.coordinates[coordinateIDX++];) {
                            // each ride can have multiple locations
                            //  think: railway, fastPass entrance etc.

                            var locationName = coordinate.type.trim();

                            // calculate name for this location
                            if (locationName == "Guest Entrance") {
                                // we have a "Guest Entrance", rather than calling it that, use the name of this location
                                //  this helps for rides with multiple "Guest Entrance"s like the railroad
                                locationName = location.name.trim();
                            }

                            var geoLoc = new GeoLocation({
                                longitude: coordinate.longitude,
                                latitude: coordinate.latitude
                            });

                            coordinates.push({
                                location: geoLoc,
                                name: locationName
                            });
                        }
                    }

                    // add this attraction to our collected data
                    facilitiesData[CleanRideID(element.id)] = {
                        name: element.name.trim(),
                        locations: coordinates,
                        // hilariously some parks call is "fastPass" and some "fastPassPlus"
                        fastPass: element.fastPass && element.fastPass == "true" ? true : (element.fastPassPlus && element.fastPassPlus == "true" ? true : false)
                    };
                }

                return Promise.resolve(facilitiesData);
            }, Promise.reject);
        }, 60 * 60 * 24);
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
     * The URL used to request the park's facilities data
     * @type {String}
     */
    get FetchFacilitiesURL() {
        return `${this.APIBase}mobile-service/public/destinations/${this.WDWResortID};entityType\u003ddestination/facilities?region=${this[s_disneyAPIParkRegion]}`;
    }

    /**
     * Get the API base URL for WDW parks
     * @type {String}
     */
    get APIBase() {
        return api_baseURL;
    }

    /**
     * Get the Auth URL for WDW parks
     * @type {String}
     */
    get AuthURL() {
        return api_accessTokenURL;
    }

    /**
     * Get the Auth body used for requesting the auth token
     * @type {String}
     */
    get AuthString() {
        return api_accessTokenURLBody;
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
