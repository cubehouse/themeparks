"use strict";

// cherrio, our web scraping library
var cheerio = require("cheerio");
// cookie library for reading geocookie for wait times
var cookie = require("cookie");

var Moment = require("moment-timezone");

var Park = require("../park");
var GeoLocation = require("../geoLocation");

var s_parkID = Symbol();
var s_parkKind = Symbol();
var s_parkLocationMin = Symbol();
var s_parkLocationMax = Symbol();

// token history (maybe we can just calculate it instead of fetching it??)
// 25th 17:30: 2Gz2/J+AAhLVQsYnVWXzmFRR
// 25th 18:00: 2Gz2/J+AAhLVQsYnVWXzmFRR
// September 25th: 2Gz24oWAAhLVQsYnVWXzmFRS
// September 5th:  2GH25YWLFRfNG9QlVGL1kV9XCg==
// August 29th:    2GD2/J+AAhLVQsYnVWXzmVRe
// August 28th:    2GD2/J+AAhLVQsYnVWXzmVRe
// July 31st:      2GT24oWAAhLVQsYnVWXzllVW
// July 13th:      2WP25ZibFADIA403VmPyl1ZQDbc=
// May 31st:       2WX25YWLFRfNG9QlVGL1kVNUDQ==
// May 30th:       2WX2/J+AAhLVQsYnVWXzlFVX
// April 17th:     2mH24oWAAhLVQsYnVWXzlVdQ
// April 16th:     2mH24pGaEwHIA403VmPyl1ZTDbU=

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
        return new Promise((resolve) => {
            // get ride names
            this.GetRideNames().then((rideData) => {
                // fetch wait times HTML page
                this.FetchWaitTimesURL().then((HTML) => {
                    // parse HTML data
                    this.ParseWaitTimesHTML(HTML).then((rideTimes) => {
                        for (var rideID in rideData) {
                            // find ride object (using ride names, not actual wait time data)
                            //  why? because when the park closes, the HTML page is empty
                            //  so, we want to check each ride for data, if it's missing data, the park/ride is assumed closed
                            var rideObject = this.GetRideObject({
                                id: rideID,
                                name: rideData[rideID]
                            });

                            if (rideObject) {
                                if (rideTimes[rideID]) {
                                    // update ride with new waittime data
                                    rideObject.WaitTime = rideTimes[rideID].WaitTime;
                                    rideObject.FastPass = rideTimes[rideID].FastPass;
                                } else {
                                    // ride isn't on the website. Most like park is closed, so set wait time to -1 to mark as inactive
                                    rideObject.WaitTime = -1;
                                }
                            }
                        }

                        resolve();
                    });
                });
            });
        });
    }

    FetchWaitTimesURL() {
        return this.GetAcccessToken().then((access_token) => {
            return this.HTTP({
                url: `http://info.tokyodisneyresort.jp/rt/s/realtime/${this[s_parkID]}_attraction.html`,
                headers: {
                    "Cookie": `tdrloc=${encodeURIComponent(access_token)}`,
                    connection: "keep-alive",
                }
            });
        });
    }

    ParseWaitTimesHTML(HTML) {
        // load HTML using cheerio
        var $ = cheerio.load(HTML);

        var results = {};

        var rides = $(".schedule .midArw");
        for (var i = 0, ride; ride = rides[i++];) {
            var el = $(ride);
            var ride_data = {};

            // extract URL (finding ride name/id)
            var ride_url = el.find("a").attr("href");
            var ride_id_match = /attraction\/detail\/str_id:([a-z0-9_]+)/gi.exec(ride_url);

            // if we can't get a ride ID, just continue
            if (!ride_id_match) {
                continue;
            }

            // got the ride ID!
            ride_data.id = ride_id_match[1];

            // get waiting time!
            // first, check for rides under maintenance
            if (
                // ride down for refurb/off-season (closed all day)
                el.text().indexOf("運営・公演中止") >= 0
                // ride unexpectedly closed
                ||
                el.text().indexOf("一時運営中止") >= 0
                // "special type" closed, for non-standard attractions such as walking experiences or transport
                ||
                el.text().indexOf("案内終了") >= 0) {
                // found the maintenance text, mark ride as inactive
                ride_data.WaitTime = -1;
            } else {
                var waitTime = el.find(".waitTime");
                if (!waitTime || !waitTime.length) {
                    ride_data.WaitTime = 0;
                } else {
                    // extract number
                    ride_data.WaitTime = parseInt(waitTime.remove("span").text(), 10);
                    // if we didn't get a number, time is unavailable! (but ride is still open)
                    //  this usually means you have to go to the ride to get wait times, and they're not on the app
                    if (isNaN(ride_data.WaitTime)) ride_data.WaitTime = -1;
                }
            }

            // fast pass status
            if (el.find(".fp").length) {
                // does this ride have FastPass?
                ride_data.FastPass = true;
            } else if (el.find(".fp-no")
                .length) {
                // ride supports fastpass! but they've ran out
                ride_data.FastPass = true;
            } else {
                // otherwise, assume no fastpasses for this ride
                ride_data.FastPass = false;
            }

            results[ride_data.id] = ride_data;
        }

        return Promise.resolve(results);
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
                forceJSON: true
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

                // request cookie for accessing wait times using a random location in the park
                this.HTTP({
                    url: `https://info.tokyodisneyresort.jp/rt/s/gps/${this[s_parkID]}_index.html`,
                    data: {
                        nextUrl: `http://info.tokyodisneyresort.jp/rt/s/realtime/${this[s_parkID]}_attraction.html`,
                        lat: randomGeoLocation.LatitudeRaw,
                        lng: randomGeoLocation.LongitudeRaw
                    },
                    headers: {
                        connection: "keep-alive",
                        "Referer": `http://www.tokyodisneyresort.jp/en/attraction/lists/park:${this[s_parkID]}`,
                    },
                    // don't actually follow the redirect, we just want the cookie
                    follow_max: 0,
                    // we are actually only interested in the headers, so get the full response, not the body
                    returnFullResponse: true
                }).then(function(resp) {
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
            }.bind(this));
        }.bind(this), function() {
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