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
const s_deviceID = Symbol();

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
        options.timezone = options.timezone || "Asia/Tokyo";

        options.useragent = options.useragent || "TokyoDisneyResortApp/1.0.8 Android/8.1.0";

        // inherit from base class
        super(options);

        this[s_apiKey] = options.api_key || "818982cd6a62e7927700a4fbabcd4534a4657a422711a83c725433839b172371";
        this[s_apiAuth] = options.api_auth || "MmYyZDYzehoVwD52FWYyDvo22aGvetu6uaGGKdN6FILO9lp2XS17DF//BA+Gake8oJ0GKlGnJDWu/boVa32d7PfCeTqCJA==";
        this[s_apiOS] = options.api_os || "Android 8.1.0";
        this[s_apiVersion] = options.api_version || "1.0.11";
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
        const headers = {
            "x-api-key": this[s_apiKey],
            "X-PORTAL-LANGUAGE": "ja",
            "X-PORTAL-OS-VERSION": this[s_apiOS],
            "X-PORTAL-APP-VERSION": this[s_apiVersion],
            "X-PORTAL-AUTH": this[s_apiAuth],
            "X-PORTAL-DEVICE-NAME": "shamu",
            connection: "keep-alive",
            "Accept-Encoding": "gzip",
            "Accept": "application/json",
            "Content-Type": "application/json",
        };

        if (this[s_deviceID]) {
            headers["X-PORTAL-DEVICE-ID"] = this[s_deviceID];
        }

        return headers;
    }

    CheckLatest() {
        let Depth = 3;

        const OriginalVersion = this[s_apiVersion];

        const TestVersion = () => {
            if (Depth <= 0) {
                return Promise.reject(new Error(`TDR API is out-of-date (failed to use version ${OriginalVersion}). Please update the library.`));
            }

            return this.HTTP({
                url: `${this[s_apiBase]}/rest/v1/applications/versions`,
                method: "GET",
                headers: this.GetAPIHeaders(),
            }).then((resp) => {
                if (!resp || !resp.latest) {
                    this[s_apiVersion] = this[s_apiVersion].split(".").map((x, idx) => idx == 2 ? "" + (Number(x) + 1) : x).join(".");
                    this.Log(`Bumping version from ${OriginalVersion} to ${this[s_apiVersion]}`);
                    Depth--;

                    return TestVersion();
                }

                return Promise.resolve();
            });
        };

        return TestVersion();
    }

    FetchDeviceID() {
        if (this[s_deviceID]) return Promise.resolve(this[s_deviceID]);

        return this.Cache.Wrap("tdrDeviceID", () => {
            return this.HTTP({
                url: `${this[s_apiBase]}/rest/v1/devices`,
                method: "POST",
                headers: this.GetAPIHeaders(),
            }).then((data) => {
                if (data && data.deviceId) {
                    this.Log(`Fetched device ID for TDR: ${data.deviceId}`);

                    this[s_deviceID] = data.deviceId;

                    return this.CheckLatest().then(() => {
                        return Promise.resolve(data.deviceId);
                    });
                }

                return Promise.reject(new Error(`Unable to fetch device ID: ${data}`));
            });
        }, 60 * 60 * 24 * 90);
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
        return this.FetchDeviceID().then(() => {
            return this.HTTP({
                url: `${this[s_apiBase]}/rest/v1/facilities/conditions`,
                method: "GET",
                headers: this.GetAPIHeaders(),
            });
        });
    }

    FetchRideData() {
        return this.Cache.Wrap("ridedata", () => {
            // first get our English ride names
            return this.GetEnglishNames().then((englishNames) => {
                return this.FetchDeviceID().then(() => {
                    // fetch ride data from App API
                    return this.HTTP({
                        url: `${this[s_apiBase]}/rest/v1/facilities`,
                        method: "GET",
                        headers: this.GetAPIHeaders(),
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

                const regexGetRideNames = /e">([^<]+)<\/p>[\s\n]*<a href="\/en\/td[sl]\/attraction\/detail\/([0-9]+)\/">[\s\n]*<div class="headingArea">[\s\n]*<div class="headingAreaInner">[\s\n]*<h3 class="heading3">([^<]+)<\/h3>/g;

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

    FetchCalendarJSON() {
        const today = Moment().tz(this.Timezone).format("YYYY-MM-DD");
        return this.FetchDeviceID().then(() => {
            return this.HTTP({
                url: `${this[s_apiBase]}/rest/v1/parks/calendars?since=${today}`,
                method: "GET",
                headers: this.GetAPIHeaders(),
            });
        });
    }

    FetchOpeningTimes() {
        return this.FetchCalendarJSON().then((data) => {
            for (let i = 0, day; day = data[i++];) {
                // skip times for the wrong park
                if (day.parkType.toLowerCase() != this[s_parkID]) continue;

                this.Schedule.SetDate({
                    date: Moment.tz(day.date, "YYYY-MM-DD", this.Timezone),
                    openingTime: Moment.tz(`${day.date} ${day.openTime}`, "YYYY-MM-DD HH:mm", this.Timezone),
                    closingTime: Moment.tz(`${day.date} ${day.closeTime}`, "YYYY-MM-DD HH:mm", this.Timezone),
                    type: day.closedDay ? "Closed" : "Operating",
                });
            }
        });
    }
}

module.exports = DisneyTokyoPark;