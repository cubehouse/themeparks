"use strict";

// cookie library for reading geocookie for wait times
var cookie = require("cookie");

var Moment = require("moment-timezone");

var Park = require("../park");
var GeoLocation = require("../geoLocation");

var s_parkID = Symbol();
var s_parkKind = Symbol();
var s_parkLocationMin = Symbol();
var s_parkLocationMax = Symbol();

/**
 * Implements the Tokyo Disneyland API framework.
 * @class
 * @extends Park
 */
class DisneyTokyoPark extends Park {
    /**
     * Create new DisneyTokyoPark Object.
     * This object should not be called directly, but rather extended for each of the individual Tokyo Disneyland parks
     * @param {Object} options
     * @param {String} options.park_id Tokyo Disneyland API park ID
     */
    constructor(options = {}) {
        options.name = options.name || "Tokyo Disneyland Park";

        // inherit from base class
        super(options);

        // assign park configurations
        if (!options.park_id) throw new Error("Missing park's API ID");
        this[s_parkID] = options.park_id;
        if (!options.park_kind) throw new Error("Missing park's kind ID");
        this[s_parkKind] = options.park_kind;
        // geoip range for generating valid cookie
        //  specify as two Location points
        if (!options.location_min || !(options.location_min instanceof GeoLocation)) throw new Error("Missing park's min location");
        if (!options.location_max || !(options.location_max instanceof GeoLocation)) throw new Error("Missing park's max location");
        this[s_parkLocationMin] = options.location_min;
        this[s_parkLocationMax] = options.location_max;
    }

    // override Fastpass Getter to declare support for Fastpass
    get FastPass() {
        return true;
    }

    /**
     * Refresh/Fetch new Wait Times for this Tokyo Disney Resort park
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return this.GetRideNames().then((rideData) => {
            // fetch wait times HTML page
            return this.FetchWaitTimesURL().then((data) => {
                // parse HTML data
                return this.ParseWaitTimesJSON(data).then((rideTimes) => {
                    for (let rideIDX = 0; rideIDX < rideTimes.length; rideIDX++) {
                        const ride = rideTimes[rideIDX];

                        var rideObject = this.GetRideObject({
                            id: ride.ID,
                            name: rideData[ride.ID]
                        });

                        if (rideObject) {
                            rideObject.WaitTime = ride.WaitTime;
                            rideObject.FastPass = ride.FastPass;
                            if (ride.FastPassReturnTimeStart) {
                                rideObject.FastPassReturnTimeStart = ride.FastPassReturnTimeStart;
                            }
                            if (ride.FastPassReturnTimeEnd) {
                                rideObject.FastPassReturnTimeEnd = ride.FastPassReturnTimeEnd;
                            }
                        }
                    }

                    return Promise.resolve();
                });
            });
        });
    }

    FetchWaitTimesURL() {
        return this.GetAcccessToken().then((access_token) => {
            return this.HTTP({
                url: `https://www.tokyodisneyresort.jp/_/realtime/${this[s_parkID]}_attraction.json`,
                headers: {
                    "Cookie": `tdrloc=${encodeURIComponent(access_token)}`,
                    connection: "keep-alive",
                },
                retryDelay: 1000 * 10
            });
        });
    }

    ParseWaitTimesJSON(data) {
        const rides = [];

        for (let rideIDX = 0; rideIDX < data.length; rideIDX++) {
            const facilityStatus = Number(data[rideIDX].FacilityStatusCD);
            const operatingStatus = Number(data[rideIDX].OperatingStatusCD);

            // default ride status - current standby time
            let rideStatus = Number(data[rideIDX].StandbyTime);
            if (isNaN(rideStatus)) rideStatus = -1;

            // some rides don't show wait times, default to 0
            if (!data[rideIDX].UseStandbyTimeStyle) {
                rideStatus = 0;
            }

            if (facilityStatus == 2 || operatingStatus == 2) {
                // 1 means "closed" for the day
                rideStatus = -1;
            } else if (facilityStatus == 3 || facilityStatus == 4 || operatingStatus == 3 || operatingStatus == 4) {
                // status of 3 or 4 means "closed"
                rideStatus = -1;
            } else if (operatingStatus == 5 || facilityStatus == 5) {
                // status of 5 means "down"
                rideStatus = -2;
            } else if (operatingStatus == 6 || facilityStatus == 6) {
                // status 6 means "closed" unless you have a FastPass (it's right at the end of the day)
                rideStatus = -1;
            }

            const ride = {
                ID: Number(data[rideIDX].FacilityID),
                WaitTime: rideStatus,
                FastPass: (data[rideIDX].FsStatus && data[rideIDX].FsStatusflg) ? true : false // does ride support FastPass? (and does it have any left?)
                // TODO: separate "has fastpass" and "any fastpass left?"
            };

            // process any found fastpass return times
            if (data[rideIDX].FsStatus && data[rideIDX].FsStatusflg && data[rideIDX].FsStatusStartTime !== null && data[rideIDX].FsStatusEndTime !== null) {
                // we have start and end return times! convert to Moment objects and set
                ride.FastPassReturnTimeStart = Moment.tz(data[rideIDX].FsStatusStartTime, "HH:mm", this.Timezone);
                ride.FastPassReturnTimeEnd = Moment.tz(data[rideIDX].FsStatusEndTime, "HH:mm", this.Timezone);
            }

            rides.push(ride);
        }

        return Promise.resolve(rides);
    }

    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            // fetch 3 months of schedule data
            var today = Moment().tz(this.Timezone);
            this.FetchOpeningTimesForMonth(today.format("YYYYMM")).then(function() {
                today.add(1, "month");
                this.FetchOpeningTimesForMonth(today.format("YYYYMM")).then(function() {
                    today.add(1, "month");
                    this.FetchOpeningTimesForMonth(today.format("YYYYMM")).then(function() {
                        resolve();
                    }.bind(this), reject);
                }.bind(this), reject);
            }.bind(this), reject);
        }.bind(this));
    }

    FetchOpeningTimesForMonth(month) {
        return new Promise(function(resolve, reject) {
            this.HTTP({
                url: `http://www.tokyodisneyresort.jp/api/v1/wapi_monthlycalendars/detail/ym:${month}/`,
                headers: {
                    "Referer": `http://www.tokyodisneyresort.jp/en/attraction/lists/park:${this[s_parkID]}`,
                    "X-Requested-With": "XMLHttpRequest",
                    connection: "keep-alive",
                },
                forceJSON: true,
                retryDelay: 1000 * 10
            }).then(function(body) {
                if (!body || !body.entry) return reject("Failed to find data from TDR calendar");

                for (var date in body.entry) {
                    if (body.entry[date][this[s_parkID]]) {
                        var scheduleDate = Moment(date, "YYYY/MM/DD");
                        this.Schedule.SetDate({
                            date: scheduleDate,
                            openingTime: Moment.tz(scheduleDate.format("YYYY-MM-DD") + " " + body.entry[date][this[s_parkID]].open_time_1, "YYYY-MM-DD HH:mm", this.Timezone),
                            closingTime: Moment.tz(scheduleDate.format("YYYY-MM-DD") + " " + body.entry[date][this[s_parkID]].close_time_1, "YYYY-MM-DD HH:mm", this.Timezone),
                        });
                    }
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Get the Geo-Locked access token for accessing Tokyo Disneyland wait times
     * @returns {Promise<String>} tdrloc cookie needed for accessing wait time pages
     */
    GetAcccessToken() {
        var cookieExpire;
        return this.Cache.Wrap("geocookie", function() {
            return new Promise(function(resolve, reject) {
                // generate a new geo cookie for accessing Tokyo ride data
                var randomGeoLocation = GeoLocation.RandomBetween(this[s_parkLocationMin], this[s_parkLocationMax]);

                this.HTTP({
                    method: "GET",
                    url: `https://www.tokyodisneyresort.jp/${this[s_parkID]}/realtime.html?nextUrl=${this[s_parkID]}attraction`,
                    headers: {
                        connection: "keep-alive"
                    },
                    retryDelay: 1000 * 10
                }).then((pageResp) => {
                    // extract blockId and pageBlockId from page HTML
                    const pageRegex = /blockId=([0-9]+)&pageBlockId=([0-9]+)/;
                    const match = pageRegex.exec(pageResp);

                    if (!match) return reject("Unable to extract blockId and pageBlockId from Tokyo Disneyland page");

                    // request cookie for accessing wait times using a random location in the park
                    this.HTTP({
                        method: "POST",
                        url: `https://www.tokyodisneyresort.jp/view_interface.php?nextUrl=${this[s_parkID]}attraction&blockId=${match[1]}&pageBlockId=${match[2]}`,
                        data: {
                            lat: randomGeoLocation.LatitudeRaw,
                            lon: randomGeoLocation.LongitudeRaw
                        },
                        headers: {
                            connection: "keep-alive",
                            "Referer": `https://www.tokyodisneyresort.jp/${this[s_parkID]}/realtime`,
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            "X-Requested-With": "XMLHttpRequest",
                            "Origin": "https://www.tokyodisneyresort.jp",
                        },
                        // don't actually follow the redirect, we just want the cookie
                        follow_max: 0,
                        // we are actually only interested in the headers, so get the full response, not the body
                        returnFullResponse: true,
                        retryDelay: 1000 * 10
                    }).then(function(resp) {
                        if (resp.body && resp.body.result === false) {
                            return reject("Tokyo Disney Resort failed our location test");
                        }

                        if (resp && resp.headers && resp.headers["set-cookie"] && resp.headers["set-cookie"].length) {
                            // hunt for the tdrloc cookie
                            var GPSCookie, GPSExpiresIn = 60 * 30;
                            for (var i = 0, cookie_string; cookie_string = resp.headers["set-cookie"][i++];) {
                                var cookie_data = cookie.parse(cookie_string);

                                // search for any tdrloc cookie
                                //  keep searching and keep the last set one
                                //  their server usually sets it twice, first deleting it, then setting the correct one
                                if (cookie_data && cookie_data.tdrloc) {
                                    GPSCookie = cookie_data.tdrloc;
                                    // parse cookie date to calculate expirey time in seconds
                                    GPSExpiresIn = Moment().diff(Moment(cookie_data.expires, "ddd, DD-MMM-YYYY HH:mm:ss z"), "seconds");

                                    // the cookie can actually be negative if the park is closed (weird, but OK)
                                    //  if this is so, keep the current one for 5 minutes and try again
                                    if (GPSExpiresIn < 0) {
                                        GPSExpiresIn = 60 * 5;
                                    }
                                }
                            }

                            // did we find the cookie?
                            if (GPSCookie) {
                                // set out-of-scope cookieExpire so we can tell the cache how long to keep this token
                                //  take a little off to be safe (a minute)
                                cookieExpire = GPSExpiresIn - 60;

                                this.Log(`Fetched new TDR geo-cookie: ${GPSCookie}`);

                                // return the new cookie
                                resolve(GPSCookie);
                            } else {
                                return reject("Failed to find GPS Cookie from TDR website");
                            }
                        } else {
                            return reject("Missing GeoCookie from TDR response");
                        }
                    }.bind(this), reject);
                });
            }.bind(this));
        }.bind(this),
        function() {
            return cookieExpire;
        }.bind(this));
    }

    /**
     * Fetch English ride names from the API
     * @returns {Promise<Object>} `rideID` to English names
     */
    GetRideNames() {
        return this.Cache.Wrap("ridenames", function() {
            return new Promise(function(resolve, reject) {
                // fetch ride names
                this.HTTP({
                    url: `http://www.tokyodisneyresort.jp/api/v1/wapi_attractions/lists/sort_type:1/locale:1/park_kind:${this[s_parkKind]}/`,
                    forceJSON: true,
                    headers: {
                        "Referer": `http://www.tokyodisneyresort.jp/en/attraction/lists/park:${this[s_parkID]}`,
                        connection: "keep-alive",
                    },
                    retryDelay: 1000 * 10
                }).then(function(body) {
                    if (!body || !body.entries || !body.entries.length) {
                        return reject("Failed to find entries in ride data response");
                    }

                    // populate data
                    var rideData = {};
                    for (var i = 0, ride; ride = body.entries[i++];) {
                        // use English if we can, fallback to yomi if we're missing an English name
                        rideData[ride.str_id] = ride.name || ride.name_yomi;
                    }

                    return resolve(rideData);
                }.bind(this), reject);
            }.bind(this));
        }.bind(this), 86400);
    }
}

module.exports = DisneyTokyoPark;

if (!module.parent) {
    // test example wait times HTML page
    var S = new DisneyTokyoPark({
        latitude: 35.6277563214705,
        longitude: 139.8811161518097,
        park_id: "tds",
        park_kind: 2,
        location_min: new GeoLocation({
            latitude: 35.6277563214705,
            longitude: 139.8811161518097
        }),
        location_max: new GeoLocation({
            latitude: 35.62465172824325,
            longitude: 139.88948464393616
        })
    });

    // fetch new test HTML file
    /*S.FetchWaitTimesURL().then((HTML) => {
        require("fs").writeFileSync(__dirname + "/test.html", HTML);
    });*/

    // test parsing stored HTML file
    var HTML = require("fs").readFileSync(__dirname + "/test.html");
    S.ParseWaitTimesHTML(HTML).then((data) => {
        S.Log(JSON.stringify(data, null, 2));
    });
}