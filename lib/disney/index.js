"use strict";

const Park = require("../park");
const DisneyUtil = require("./disneyUtil");
const Moment = require("moment-timezone");

// maintain a global object of resort facilities
const DisneyFacilities = require("./disneyFacilityChannel");
// object of resort ID -> facility channel object
const FacilityChannels = {};

// build our own custom channel to get facility statuses
const DisneyChannel = require("./couchbaseChannelDisney");
// again, there is one channel per resort, so share one between all the parks per-resort
const FacilityStatusChannels = {};

// private symbols
const s_ResortCode = Symbol();
const s_ParkID = Symbol();
const s_ResortID = Symbol();

const s_AccessTokenBody = Symbol();
const s_AppID = Symbol();

class DisneyPark extends Park {
    constructor(options = {}) {
        options.name = options.name || "Disney Park";

        super(options);

        this[s_AccessTokenBody] = options.accessTokenBody || "grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD";

        this[s_AppID] = options.appID || "WDW-MDX-ANDROID-4.12";

        if (options.park_id === undefined) throw new Error("No park_id passed to Disney Park constructor");
        this[s_ParkID] = options.park_id;

        if (options.resort_id === undefined) throw new Error("No resort_id passed to Disney Park constructor");
        this[s_ResortID] = options.resort_id;

        if (options.resort_code === undefined) throw new Error("No resort_code passed to Disney Park constructor");
        this[s_ResortCode] = options.resort_code;

        // setup facility channel for this resort
        if (FacilityChannels[this[s_ResortCode]] === undefined) {
            // create facility channel if it doesn't already exist
            FacilityChannels[this[s_ResortCode]] = new DisneyFacilities({
                resort_id: this[s_ResortCode]
            });
        }

        if (FacilityStatusChannels[this[s_ResortCode]] === undefined) {
            FacilityStatusChannels[this[s_ResortCode]] = new DisneyChannel({
                dbName: `facilitystatus_${this[s_ResortCode]}`,
                channel: `${this[s_ResortCode]}.facilitystatus.1_0`,
            });

            /* eslint-disable no-console */
            FacilityStatusChannels[this[s_ResortCode]].on("error", console.error);
            /* eslint-enable no-console */
        }
    }

    FetchWaitTimes() {
        // make sure the channel is started and synced
        return this.FacilityStatusChannel.Start().then(() => {
            // get all facility status documents
            return this.FacilityStatusChannel.GetAllDocuments().then((docs) => {
                // build a list of wait times and facility documents to fetch
                const docsToFetch = [];
                const waitTimes = {};

                for (let i = 0, ride; ride = docs[i++];) {
                    ride = ride.doc;
                    docsToFetch.push(ride.id);

                    if (ride.status == "Down") {
                        waitTimes[DisneyUtil.CleanID(ride.id)] = -2;
                    } else if (ride.status == "Closed") {
                        waitTimes[DisneyUtil.CleanID(ride.id)] = -1;
                    } else if (ride.status == "Operating") {
                        waitTimes[DisneyUtil.CleanID(ride.id)] = ride.waitMinutes || 0;
                    }
                }

                // get facility data for each attraction to match up our wait times to our park and apply their ride names
                return this.FacilityChannel.GetFacilitiesData(docsToFetch, {
                    // match our park
                    park_id: this[s_ParkID],
                }).then((docs) => {
                    for (let i = 0; i < docs.length; i++) {
                        const cleanID = DisneyUtil.CleanID(docs[i].id);

                        this.UpdateRide(cleanID, {
                            name: docs[i].name,
                            waitTime: waitTimes[cleanID],
                        });
                    }

                    return Promise.resolve();
                });
            });

        });
    }

    FetchOpeningTimes() {
        // make sure the channel is started and synced
        return this.FacilityChannel.Start().then(() => {
            const dates = [];
            const endFillDate = Moment().tz(this.Timezone).add(200, "days");
            for (let m = Moment().tz(this.Timezone); m.isBefore(endFillDate); m.add(1, "day")) {
                dates.push(m.format("YYYY-MM-DD"));
            }

            return this.FacilityChannel.GetCalendarDates(dates).then((docs) => {
                for (let i = 0; i < docs.length; i++) {
                    // find our park
                    for (let j = 0; j < docs[i].parkHours.length; j++) {
                        if (DisneyUtil.CleanID(docs[i].parkHours[j].facilityId) == this[s_ParkID]) {
                            this.Schedule.SetDate({
                                date: Moment.tz(docs[i]._date, "YYYY-MM-DD", this.Timezone),
                                openingTime: Moment(docs[i].parkHours[j].startTime, "YYYY-MM-DDTHH:mm:ssZ").tz(this.Timezone),
                                closingTime: Moment(docs[i].parkHours[j].endTime, "YYYY-MM-DDTHH:mm:ssZ").tz(this.Timezone),
                                type: docs[i].parkHours[j].scheduleType,
                                specialHours: docs[i].parkHours[j].scheduleType != "Operating",
                            });
                        }
                    }
                }

                return Promise.resolve();
            });
        });
    }

    /**
     * Get the couchbase lite channel for this park's resort facilities
     * @returns {FacilityChannel} Disney Park facility live channel
     */
    get FacilityChannel() {
        return FacilityChannels[this[s_ResortCode]];
    }

    /**
     * Get the couchbase lite channel for this park's resort facility statuses
     * @returns {CouchbaseChannelDisney} Disney live channel
     */
    get FacilityStatusChannel() {
        return FacilityStatusChannels[this[s_ResortCode]];
    }

    /**
     * Get an access token for accessing the non-live portions of the WDW API
     */
    GetAccessToken() {
        let expiresIn;
        return this.Cache.Wrap("accesstoken", () => {
            // request a fresh access token
            return this.HTTP({
                url: "https://authorization.go.com/token",
                method: "POST",
                body: this[s_AccessTokenBody],
                // Disney API doesn't want to return as application/JSON, so we'll manually parse it into a nice object
                forceJSON: true
            }).then((body) => {
                if (!body.access_token) {
                    this.Log("Error body", body);
                    return Promise.reject("Returned access token data missing access_token");
                }
                if (!body.expires_in) {
                    this.Log("Error body", body);
                    return Promise.reject("Returned access token data missing expires_in");
                }

                // parse expires_in into an int
                const ttlExpiresIn = parseInt(body.expires_in, 10);

                // The ttlExpiresIn is the maximum time the access_token is valid. 
                // It's possible for the token to be given back just moments before
                // it is invalid. Therefore we should force the ttl value in the
                // cache lower than this value so requests don't fail.
                expiresIn = Math.ceil(ttlExpiresIn * .90);

                this.Log(`Fetched new WDW access_token ${body.access_token}, expires in ${body.expires_in}, caching for a maximum of ${expiresIn}`);

                // return our new access token
                return Promise.resolve(body.access_token);
            });
        }, () => {
            // return the fetched expirey time as our cached TTL
            return Promise.resolve(expiresIn);
        });
    }

    /**
     * Fetch a URL from the Disney API
     */
    GetAPIUrl(requestObject) {
        // get access token
        return this.GetAccessToken().then((access_token) => {
            // make sure headers exist if they weren't set already
            if (!requestObject.headers) requestObject.headers = [];

            // add our auth headers
            requestObject.headers.Authorization = "BEARER " + access_token;
            requestObject.headers.Accept = "application/json;apiversion=1";
            requestObject.headers["X-Conversation-Id"] = "WDPRO-MOBILE.MDX.CLIENT-PROD";
            requestObject.headers["X-App-Id"] = this[s_AppID];
            requestObject.headers["X-Correlation-ID"] = Date.now();

            // make sure we get JSON back
            requestObject.forceJSON = true;

            // send network request
            return this.HTTP(requestObject);
        });
    }
}

module.exports = DisneyPark;