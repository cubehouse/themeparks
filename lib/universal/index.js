"use strict";

// include core Park class
var Park = require("../park");
var Moment = require("moment-timezone");

// crypto lib for generating access token signature
var crypto = require("crypto");

// API settings
var api_baseURL = "https://services.universalorlando.com/api/";
var api_appKey = "AndroidMobileApp";
var api_appSecret = "AndroidMobileAppSecretKey182014";

var s_parkID = Symbol();
var s_city = Symbol();

// park IDs:
//  Studios: 10010
//  Islands: 10000
//  CityWalk: 10011
//  Wet 'N Wild: 45084

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

        // Universal parks return lots of opening time data, return a few months of data by default
        options.scheduleDaysToReturn = options.scheduleDaysToReturn || 90;

        // inherit from base class
        super(options);

        // grab Universal API configs for this park instance
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_parkID] = options.park_id;

        // universal hollywood uses ?city= on it's API requests, so optionally support setting that
        this[s_city] = options.park_city;
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
        var receivedTtl;

        return this.Cache.Wrap("accesstoken", function() {
            return new Promise(function(resolve, reject) {
                // Get access token
                // generate access token signature
                //  calculate current date to generate access token signature
                var today = Moment.utc().format("ddd, DD MMM YYYY HH:mm:ss") + " GMT";

                // create signature to get access token
                var signatureBuilder = crypto.createHmac("sha256", api_appSecret);
                signatureBuilder.update(api_appKey + "\n" + today + "\n");
                // generate hash from signature builder
                //  also convert trailing equal signs to unicode. because. I don't know
                var signature = signatureBuilder.digest("base64").replace(/=$/, "\u003d");

                // request new access token
                this.HTTP({
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
                            this.Log(body.toString("ascii"));
                            return reject("Missing access token from Universal API");
                        }

                        var expireyDate = Moment(body.TokenExpirationString, "YYYY-MM-DDTHH:mm:ssZ");
                        var now = Moment();
                        // expire this access token a minute before the API says (just to be sure)
                        receivedTtl = expireyDate.diff(now, "seconds") - 60;

                        // resolve with our new access token (Wrap will cache for us)
                        resolve(body.Token);
                    }.bind(this),
                    function(err) {
                        this.Log("Error fetching Universal Access Token: " + err);
                        return reject(err);
                    }.bind(this)
                );
            }.bind(this));
        }.bind(this), function() {
            // Ttl callback setter
            return receivedTtl;
        }.bind(this));
    }

    /**
     * Fetch a URL from the Universal API
     */
    GetAPIUrl(requestObject) {
        return this.GetAccessToken().then(function(access_token) {
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
            return this.HTTP(requestObject);
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
                url: api_baseURL + "pointsOfInterest",
                data: this[s_city] ? {
                    city: this[s_city]
                } : null
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
            // pick a date 1 month from now (in middle/lowest/highest form MM/DD/YYYY, because I don't know)
            var hoursEndDate = Moment().add(12, "months").format("MM/DD/YYYY");

            this.GetAPIUrl({
                url: api_baseURL + `venues/${this[s_parkID]}/hours`,
                data: {
                    endDate: hoursEndDate,
                    city: this[s_city] ? this[s_city] : null
                }
            }).then(function(body) {
                if (!body || !body.length) return reject("No venue hour data found from Universal API");

                // find all published opening times for the next year and insert into our schedule
                for (var i = 0, day; day = body[i++];) {
                    this.Schedule.SetDate({
                        // for ease, we'll just parse the Unix timestamp
                        openingTime: Moment.tz(day.OpenTimeString, "YYYY-MM-DDTHH:mm:ssZ", this.Timezone),
                        closingTime: Moment.tz(day.CloseTimeString, "YYYY-MM-DDTHH:mm:ssZ", this.Timezone)
                    });
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

// export the class
module.exports = UniversalPark;