"use strict";

// include core Park class
var Park = require("../park");
var HTTP = require("../http");
var Settings = require("../settings");
var Moment = require("moment-timezone");

// crypto lib for generating access token signature
var crypto = require("crypto");

// API settings
var api_baseURL = "https://services.universalorlando.com/api/";
var api_appKey = "AndroidMobileApp";
var api_appSecret = "AndroidMobileAppSecretKey182014";

var cacheKey = "universalapi_";

var s_parkID = Symbol();

/**
 * Implements the Universal API framework. All Universal parks use this one API.
 * @class
 * @extends Park
 */
class UniversalPark extends Park {
    /**
     * Create new UniversalPark Object.
     * This object should not be called directly, but rather extended for each of the individual Universal parks
     * @param {Object} options
     * @param {String} options.park_id Universal API park ID
     */
    constructor(options = {}) {
        options.name = options.name || "Universal Park";

        // inherit from base class
        super(options);

        // grab Universal API configs for this park instance
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_parkID] = options.park_id;
    }

    // override Fastpass Getter to declare support for FastPass
    get FastPass() {
        return true;
    }

    /**
     * Get our current access token
     * @returns {Promise}
     */
    GetAccessToken() {
        return new Promise(function(resolve, reject) {
            // first check the cache
            Settings.Cache.get(cacheKey + "accesstoken", function(err, accessToken) {
                if (err || !accessToken) {
                    // generate access token signature
                    //  calculate current date to generate access token signature
                    var today = Moment.utc().format("ddd, DD MMM YYYY HH:mm:ss") + " GMT";

                    // create signature to get access token
                    var signatureBuilder = crypto.createHmac("sha256", api_appSecret);
                    signatureBuilder.update(api_appKey + "\n" + today + "\n");
                    // generate hash from signature builder
                    //  also convert trailing equal signs to unicode. because. I don't know
                    var signature = signatureBuilder.digest("base64").replace(/\=$/, "\u003d");

                    // request new access token
                    HTTP({
                        url: api_baseURL,
                        method: "POST",
                        headers: {
                            Date: today
                        },
                        body: {
                            apiKey: api_appKey,
                            signature: signature,
                        }
                    }).then(
                        function(body) {
                            // check we actually got the token back
                            if (!body.Token) {
                                this.Log(JSON.stringify(body, null, 2));
                                return reject("Missing access token from Universal API");
                            }

                            // update cache
                            Settings.Cache.set(cacheKey + "accesstoken", body.Token, {
                                // work out how long this token lasts, and take a minute off for safety
                                ttl: Moment().diff(Moment(body.TokenExpirationString, "YYYY-MM-DDTHH:mm:ssZ"), "seconds") - 60,
                            }, function() {
                                // return new access token!
                                resolve(body.Token);
                            });
                        }.bind(this),
                        function(err) {
                            this.Log("Error fetching Universal Access Token: " + err);
                            return reject(err);
                        }.bind(this)
                    );
                } else {
                    return resolve(accessToken);
                }
            }.bind(this));
        }.bind(this));
    }

    /**
     * Fetch a URL from the Universal API
     */
    GetAPIUrl(requestObject) {
        return new Promise(function(resolve, reject) {
            // get access token
            this.GetAccessToken().then(function(access_token) {
                // TODO - build request object
                // make sure headers exist if they weren't set already
                if (!requestObject.headers) requestObject.headers = [];
                requestObject.headers.Accept = "application/json";
                requestObject.headers["Content-Type"] = "application/json; charset=UTF-8";
                requestObject.headers["Accept-Language"] = "en-US";

                // add our access token to the request
                if (access_token) {
                    requestObject.headers["X-UNIWebService-ApiKey"] = api_appKey;
                    requestObject.headers["X-UNIWebService-Token"] = access_token;
                }

                // send network request
                HTTP(requestObject).then(resolve, reject);
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Fetch this Universal Park's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            // ride wait time data is kept in the pointsOfInterest URL
            this.GetAPIUrl({
                url: api_baseURL + "pointsOfInterest"
            }).then(function(body) {
                if (!body || !body.Rides) return reject("Universal POI data missing Rides array");

                for (var i = 0, ride; ride = body.Rides[i++];) {
                    // skip if this ride isn't for our current park
                    // TODO - store poiData separately for both parks to access
                    if (ride.VenueId != this[s_parkID]) continue;

                    // waitTimes assumed key:
                    //  -1 seems to mean "closed"
                    //  -2 means "delayed", which I guess is a nice way of saying "broken"
                    //  -3 and -50 seems to mean planned closure

                    // find/create this ride
                    var rideObject = this.GetRideObject({
                        id: ride.Id,
                        name: ride.MblDisplayName
                    });

                    // update wait time
                    rideObject.WaitTime = ride.WaitTime;
                    // update FastPass status
                    rideObject.FastPass = ride.ExpressPassAccepted;
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Fetch this Universal Park's opening times
     * @returns {Promise}
     */
    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            this.GetAPIUrl({
                url: api_baseURL + "venues",
            }).then(function(body) {
                // figure out where our park is in the venues list
                for (var i = 0, venue; venue = body.Results[i++];) {
                    if (venue.Id != this[s_parkID]) continue;

                    // find next 10 days opening times and insert into our schedule
                    for (var j = 0, day; day = venue.Hours[j++];) {
                        this.Schedule.SetDate({
                            // for ease, we'll just parse the Unix timestamp
                            openingTime: Moment.tz(day.OpenTimeString, "YYYY-MM-DDTHH:mm:ssZ", this.Timezone),
                            closingTime: Moment.tz(day.CloseTimeString, "YYYY-MM-DDTHH:mm:ssZ", this.Timezone)
                        });
                    }
                    break;
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

// export the class
module.exports = UniversalPark;