"use strict";

// include core Park class
var Park = require("../park");
var Moment = require("moment-timezone");

// crypto library for generating access tokens
var crypto = require("crypto");

var s_apiBase = Symbol();
var s_apiVersion = Symbol();
var s_parkSecretToken = Symbol();

/**
 * Implements the Europa Park API framework.
 * @class
 * @extends Park
 */
class EuropaPark extends Park {
    /**
     * Create new EuropaPark Object.
     * @param {Object} [options]
     * @param {String} [options.api_base] Optional base URL for API requests 
     * @param {String} [options.api_version] API Version to make requests to (default: 'api-5.2') 
     * @param {String} [options.secret_token] Secret token to use to generate the wait times API access token
     */
    constructor(options = {}) {
        options.name = options.name || "Europa Park";

        // Europa-Park coordinates
        options.latitude = options.latitude || 48.268931;
        options.longitude = options.longitude || 7.721559;

        // Use the Android app's user-agent
        options.useragent = options.useragent || "okhttp/2.7.0";

        // park's timezone
        options.timezone = "Europe/Berlin";

        // inherit from base class
        super(options);

        // accept overriding the API base URL
        this[s_apiBase] = options.api_base || "https://api.europapark.de/";
        // accept overriding API version
        this[s_apiVersion] = options.api_version || "api-5.4";
        // take secret token from options, or default to known token
        this[s_parkSecretToken] = options.secret_token || "ZhQCqoZp";
    }

    /**
     * Generate an access token for accessing wait times
     * @returns {String} Current Access Token
     */
    GenerateAccessToken() {
        // generate wait times access code

        // start with current park date in UTC (YYYYMMDDHH format)
        var currentParkDate = Moment.utc().format("YYYYMMDDHH");
        this.Log("Calculated token date as", currentParkDate);

        // sha256 hash using key
        var hmac = crypto.createHmac("sha256", this[s_parkSecretToken]);
        hmac.update(currentParkDate);
        var code = hmac.digest("hex").toUpperCase();

        this.Log("Generated Europa wait times code", code);

        return code;
    }

    /**
     * Fetches fresh or cached ride data from the park API
     * @returns {Promise<Object>} Object of Ride ID => Ride Name in English (or German if no English name is available)
     */
    FetchRideData() {
        return this.Cache.Wrap("ridedata", function() {
            return new Promise(function(resolve, reject) {
                // grab ride names from the API
                this.HTTP({
                    url: this[s_apiBase] + this[s_apiVersion] + "/pointsofinterest",
                }).then(function(ride_data) {
                    // extract names from returned data
                    var rideNames = {};
                    for (var i = 0, poi; poi = ride_data[i++];) {
                        // types:
                        //  1: ride
                        //  2: food
                        //  3: park entrance
                        //  5: shop
                        //  6: show

                        // not all attractions have English names, so fallback to German if missing
                        rideNames[poi.code] = poi.nameEnglish || poi.nameGerman;
                    }

                    resolve(rideNames);
                }.bind(this), reject);
            }.bind(this));
        }.bind(this), 60 * 60 * 24);
    }

    /**
     * Fetch Wait times
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            // fetch ride names before getting wait times (usually this will come from the cache)
            this.FetchRideData().then(function(rideNames) {
                this.HTTP({
                    url: `${this[s_apiBase]}${this[s_apiVersion]}/waitingtimes`,
                    data: {
                        "mock": false,
                        "token": this.GenerateAccessToken()
                    }
                }).then(function(waitTimes) {
                    // if empty, park is just totally closed (!)
                    if (!waitTimes.length) {
                        // mark each ride as inactive
                        // loop through previously known-about rides
                        for (var rideIdx, ride; ride = this.Rides[rideIdx++];) {
                            // set ride time to -1 to mark as closed
                            ride.WaitTime = -1;
                        }

                        // TODO - loop over a hard-coded list of known rides at the park

                        // resolve early
                        return resolve();
                    }

                    for (var i = 0, ridetime; ridetime = waitTimes[i++];) {
                        // FYI, ridetime.type:
                        //   1: rollercoaster
                        //   2: water
                        //   3: adventure

                        // status meanings:
                        //  0: Open!
                        //  1: Wait time is over 90 minutes
                        //  2: Closed
                        //  3: Broken Down
                        //  4: Bad weather
                        //  5: VIP/Special Tour
                        //  other: Probably just crazy long wait times

                        // get this ride's' object
                        var rideObject = this.GetRideObject({
                            id: ridetime.code,
                            name: rideNames[ridetime.code] || "???",
                        });

                        // lowest wait time is 1 minute (according to app)
                        var waittime = ridetime.time > 0 ? ridetime.time : 0;
                        var active = (ridetime.status === 0 || ridetime.status === 1);
                        // copy how the app reacts to >90 minute waits
                        if (ridetime.status === 1) waittime = 91;

                        // set new wait time
                        rideObject.WaitTime = active ? waittime : -1;
                    }

                    resolve();
                }.bind(this), reject);
            }.bind(this), reject);
        }.bind(this));
    }

    /** 
     * Fetch Europa Park opening time data
     * @returns {Promise}
     */
    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            this.HTTP({
                url: `${this[s_apiBase]}${this[s_apiVersion]}/openingtimes`
            }).then(function(openingTimes) {
                for (var i = 0, sched; sched = openingTimes[i++];) {
                    // EuropaPark returns opening hours in blocks of ranges
                    //  set each range of dates in our schedule object 
                    this.Schedule.SetRange({
                        startDate: Moment.tz(sched.from, "YYYY-MM-DD", this.Timezone),
                        endDate: Moment.tz(sched.until, "YYYY-MM-DD", this.Timezone),
                        openingTime: Moment(sched.start, "HH:mm"),
                        closingTime: Moment(sched.end, "HH:mm")
                    });
                }

                // TODO - the park is actually closed on various days and has announced varients to these times
                //  find out how to get these properly!

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

// export the class
module.exports = EuropaPark;