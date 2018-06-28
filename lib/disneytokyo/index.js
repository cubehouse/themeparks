"use strict";

const random_useragent = require("random-useragent");

const Moment = require("moment-timezone");

const Park = require("../park");

const s_apiKey = Symbol();
const s_apiAuth = Symbol();
const s_apiOS = Symbol();
const s_apiVersion = Symbol();
const s_apiBase = Symbol();
const s_webUserAgent = Symbol();
const s_parkID = Symbol();

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

        this[s_apiKey] = options.api_key || "818982cd6a62e7927700a4fbabcd4534a4657a422711a83c725433839b172371";
        this[s_apiAuth] = options.api_auth || "MmYyZDYzehoVwD52FWYyDvo22aGvetu6uaGGKdN6FILO9lp2XS17DF//BA+Gake8oJ0GKlGnJDWu/boVa32d7PfCeTqCJA==";
        this[s_apiOS] = options.api_os || "Android 8.1.0";
        this[s_apiVersion] = options.api_version || "1.0.1";
        this[s_apiBase] = options.api_base || "https://api-portal.tokyodisneyresort.jp";

        if (options.park_id === undefined) throw new Error("No Park ID passed to DisneyTokyoPark object constructor");
        this[s_parkID] = options.park_id;

        this[s_webUserAgent] = random_useragent.getRandom((ua) => ua.osName == "Android");
    }

    // override Fastpass Getter to declare support for Fastpass
    get FastPass() {
        return true;
    }

    /**
     * Refresh/Fetch new Wait Times for this Tokyo Disney Resort park
     * @returns {Promise}
     */
    GetAPIHeaders() {
        return {
            "x-api-key": this[s_apiKey],
            "X-PORTAL-LANGUAGE": "ja",
            "X-PORTAL-OS-VERSION": this[s_apiOS],
            "X-PORTAL-APP-VERSION": this[s_apiVersion],
            "X-PORTAL-AUTH": this[s_apiAuth],
            connection: "keep-alive"
        };
    }

    FetchWaitTimes() {
        // first get our ride names etc.
        return this.FetchRideData().then((rides) => {
            return this.FetchWaitTimesJSON().then((data) => {
                for (let i = 0; i < data.attractions.length; i++) {
                    const ride = data.attractions[i];
                    // skip any rides we don't recognise
                    if (!rides[ride.id]) continue;
                    // skip rides with no wait time service
                    if (ride.standbyTimeDisplayType == "FIXED") continue;
                    // skip anything not type 1 or 2 (rides and shows)
                    if (rides[ride.id].type >= 3) continue;

                    let rideObject = this.GetRideObject({
                        id: ride.id,
                        name: rides[ride.id].name
                    });

                    rideObject.FastPass = rides[ride.id].fastpass;

                    if (ride.operatingStatus == "CLOSE_NOTICE") {
                        // ride is temporarily closed
                        rideObject.WaitTime = -2;
                    } else if (ride.facilityStatus == "CANCEL") {
                        // ride is closed for the day
                        rideObject.WaitTime = -1;
                    } else if (ride.operatingStatus == "OPEN") {
                        rideObject.WaitTime = (ride.standbyTime !== undefined && ride.standbyTime >= 0) ? ride.standbyTime : 0;
                    } else {
                        rideObject.WaitTime = -1;
                    }
                }

                return Promise.resolve();
            });
        });
    }

    FetchWaitTimesJSON() {
        return this.HTTP({
            url: `${this[s_apiBase]}/rest/v1/facilities/conditions`,
            method: "GET",
            headers: this.GetAPIHeaders(),
        });
    }

    FetchRideData() {
        return this.Cache.Wrap("ridedata", () => {
            // first get our English ride names
            return this.GetEnglishNames().then((englishNames) => {
                // fetch ride data from App API
                return this.HTTP({
                    url: `${this[s_apiBase]}/rest/v1/facilities`,
                    method: "GET",
                    headers: this.GetAPIHeaders()
                }).then((body) => {
                    if (!body) {
                        return Promise.reject("Failed to find entries in ride data response");
                    }

                    const rideData = {};

                    for (let i = 0; i < body.attractions.length; i++) {
                        const attr = body.attractions[i];

                        // skip attractions from the other park
                        if (attr.parkType.toLowerCase() != this[s_parkID]) continue;

                        const englishData = englishNames[Number(attr.facilityCode)];

                        rideData[attr.id] = {
                            name: englishData && englishData.name !== undefined ? englishData.name : attr.nameKana,
                            fastpass: !!attr.fastpass,
                            type: attr.attractionType.id,
                            facilityCode: Number(attr.facilityCode),
                        };
                    }

                    return Promise.resolve(rideData);
                });
            });
        }, 86400);
    }

    GetEnglishNames() {
        return this.Cache.Wrap("ridenames", () => {
            // fetch ride names
            return this.HTTP({
                url: `https://www.tokyodisneyresort.jp/en/${this[s_parkID]}/attraction.html`,
                headers: {
                    "Referer": `https://www.tokyodisneyresort.jp/en/${this[s_parkID]}/attraction.html`,
                    connection: "keep-alive",
                    "User-Agent": this[s_webUserAgent]
                },
                retryDelay: 1000 * 10
            }).then((body) => {
                if (!body) {
                    return Promise.reject("Failed to find entries in English ride names data response");
                }

                const regexGetRideNames = /e">([^<]+)<\/p>[\s\n]*<a href="\/en\/tds\/attraction\/detail\/([0-9]+)\/">[\s\n]*<div class="headingArea">[\s\n]*<div class="headingAreaInner">[\s\n]*<h3 class="heading3">([^<]+)<\/h3>/g;

                let match;
                var rideData = {};
                while (match = regexGetRideNames.exec(body)) {
                    rideData[Number(match[2])] = {
                        name: match[3],
                        area: match[1],
                    };
                }

                // add area name to any duplicate names
                for (let id in rideData) {
                    const matches = [];
                    for (let compId in rideData) {
                        if (rideData[id].name == rideData[compId].name) {
                            matches.push(compId);
                        }
                    }

                    if (matches.length > 1) {
                        for (let i = 0; i < matches.length; i++) {
                            rideData[matches[i]].name = `${rideData[matches[i]].area} ${rideData[matches[i]].name}`;
                        }
                    }
                }

                // missing facility 245 from scrape?
                if (rideData[244] && !rideData[245]) rideData[245] = rideData[244];

                return Promise.resolve(rideData);
            });
        }, 86400);
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
                url: `https://www.tokyodisneyresort.jp/en/tdr/calendar/${month}/`,
                headers: {
                    "Referer": "https://www.tokyodisneyresort.jp/en/tdr/calendar/",
                    connection: "keep-alive",
                },
                retryDelay: 1000 * 10
            }).then(function(body) {
                if (!body) return reject("Failed to find data from TDR calendar");

                const data = this.ParseCalendarHTML(body, this[s_parkID], month);

                for (let i = 0; i < data.length; i++) {
                    this.Schedule.SetDate({
                        date: data[i].date,
                        openingTime: data[i].openingTime,
                        closingTime: data[i].closingTime,
                    });
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }

    ParseCalendarHTML(HTML, park, month) {
        const regexExtractDays = /\/en\/(td[ls])\/daily\/calendar\/[0-9]{6}([0-9]{2})\/">\s*<p class="openTime">([0-9]+:[0-9]+)\s*([ap])\.?m.?\s*-([0-9]+:[0-9]+)\s*([ap])\.?m/g;

        // strip out all new lines
        HTML = HTML.replace(/\n/g, "");

        const days = [];

        let match;
        while (match = regexExtractDays.exec(HTML)) {
            if (match[1] == park) {
                const dayString = month + match[2];
                const date = Moment.tz(dayString, "YYYYMMDD", this.Timezone);
                if (date.isValid()) {
                    let alreadyHasDay = false;
                    for (let i = 0; i < days.length; i++) {
                        if (days[i].date.isSame(date, "day")) {
                            alreadyHasDay = true;
                            break;
                        }
                    }

                    if (!alreadyHasDay) {
                        days.push({
                            date,
                            openingTime: Moment.tz(dayString + " " + match[3] + " " + match[4] + "m", "YYYYMMDD h:mm a", this.Timezone),
                            closingTime: Moment.tz(dayString + " " + match[5] + " " + match[6] + "m", "YYYYMMDD h:mm a", this.Timezone),
                        });
                    }
                }
            }
        }

        return days;
    }
}

module.exports = DisneyTokyoPark;

if (!module.parent) {
    // test example wait times HTML page
    var S = new DisneyTokyoPark({
        latitude: 35.6277563214705,
        longitude: 139.8811161518097,
        park_id: "tds"
    });

    S.GetWaitTimes().then(data => {
        console.log(JSON.stringify(data, null, 2));
    })

    // fetch new test HTML file
    /*S.FetchWaitTimesURL().then((HTML) => {
        require("fs").writeFileSync(__dirname + "/test.html", HTML);
    });*/

    // test parsing stored HTML file
    /*var HTML = require("fs").readFileSync(__dirname + "/test.html");
    S.ParseWaitTimesHTML(HTML).then((data) => {
        S.Log(JSON.stringify(data, null, 2));
    });*/
}