"use strict";

// include core Park class
const Park = require("../park");
const Moment = require("moment-timezone");

// uuid generation lib
const uuid = require("uuid/v4");
// zip lib to extract data
const unzip = require("yauzl");

const s_apiKey = Symbol();
const s_apiBase = Symbol();
const s_calendarURLBase = Symbol();
const s_appVersion = Symbol();
const s_appBuild = Symbol();
const s_deviceID = Symbol();
const s_dataVersion = Symbol();

const s_deviceTokenCacheTime = Symbol();
const s_userIDCacheTime = Symbol();
const s_dataCacheTime = Symbol();

/**
 * Implements the Merlin Park API framework. Thorpe Park, Alton Towers, Chessington etc. use this API framework
 * @class
 * @extends Park
 */
class MerlinPark extends Park {
    /**
     * Create new Merlin Object.
     * This object should not be called directly, but rather extended for each of the individual Merlin parks
     * @param {Object} options
     * @param {String} options.api_key API key to access this park's API
     * @param {String} [options.api_base] API Base to use when accessing the API
     * @param {String} [options.app_build] Build version of the app (optional)
     * @param {String} [options.app_version] App version of the app (optional)
     * @param {String} [options.device_id] Device identifier for use against the API (optional)
     * @param {String} [options.initial_data_version] The initial version timestamp to fetch (optional)
     * @param {Number} [options.device_token_cachetime=86400000] Time to cache device token, in milliseconds (optional)
     * @param {Number} [options.user_id_cachetime=43200000] Time to cache user ID, in milliseconds (optional)
     * @param {Number} [options.data_cachetime=43200000] Time to ride data, in milliseconds (optional)
     */
    constructor(options = {}) {
        options.name = options.name || "Merlin Park";

        // hard-code UserAgent for these parks
        //  do this before calling super, so we don't get a randomly generated one
        options.useragent = "okhttp/3.2.0";

        // inherit from base class
        super(options);

        // custom API options
        if (!options.api_key) throw new Error("Merlin Parks require an API key");
        this[s_apiKey] = options.api_key;
        if (!options.initial_data_version) throw new Error("Merlin Parks require an initial data version to fetch ride names");
        this[s_dataVersion] = options.initial_data_version;

        // app version options (optionally overriden)
        this[s_appBuild] = options.app_build || "5";
        this[s_appVersion] = options.app_version || "1.0.1";
        this[s_deviceID] = options.device_id || "123";

        // default base API
        this[s_apiBase] = options.api_base || "https://api.attractions.io/v1/";
        this[s_calendarURLBase] = options.calendar_base || "https://www.thorpepark.com/";

        // cache times
        this[s_deviceTokenCacheTime] = options.device_token_cachetime || 86400000; // default: 24 hours
        this[s_userIDCacheTime] = options.user_id_cachetime || 43200000; // default: 12 hours
        this[s_dataCacheTime] = options.data_cachetime || 43200000; // default: 12 hours
    }

    /**
     * Get the API Base URL
     */
    get APIBase() {
        return this[s_apiBase];
    }

    FetchWaitTimes() {
        // first, make sure we have our park data (ride names etc.)
        return this.GetParkData().then((rideNames) => {
            // fetch wait times
            return this.MakeAPICall({
                url: `${this.APIBase}live-data`
            }).then((data) => {
                for (var i = 0, ride; ride = data.entities.Item.records[i++];) {
                    // apply each wait time data
                    var rideObject = this.GetRideObject({
                        id: ride._id,
                        name: rideNames[ride._id],
                    });

                    if (!rideObject) {
                        this.Log(`Failed to find ride with ID ${ride.id}`);
                    } else {
                        // update ride wait time (wait times are in seconds in this API!)
                        rideObject.WaitTime = ride.IsOpen ? (ride.QueueTime / 60) : -1;
                    }
                }

                return Promise.resolve();
            });
        });
    }

    /**
     * Get an API token from cache or through registering a new device
     */
    RegisterDevice() {
        // fetch new device token if we haven't already got one in our cache
        return this.Cache.Wrap("device_token", () => {
            // first, get (or generate) a new user ID
            return this.GenerateUserID().then((user_id) => {
                // request token for further API requests
                return this.HTTP({
                    url: `${this[s_apiBase]}installation`,
                    method: "POST",
                    data: {
                        user_identifier: user_id,
                        device_identifier: this[s_deviceID],
                        app_version: this[s_appVersion],
                        app_build: this[s_appBuild]
                    },
                    headers: {
                        "occasio-platform": "Android",
                        "occasio-platform-version": "6.0.1",
                        "occasio-app-build": this[s_appBuild],
                        "authorization": `Attractions-Io api-key "${this[s_apiKey]}"`,
                    }
                }).then((data) => {
                    if (data && data.token) {
                        return Promise.resolve(data.token);
                    }

                    return Promise.reject("No data returned");
                });
            });
        }, this[s_deviceTokenCacheTime]);
    }

    /**
     * Generate (or fetch a cached) user ID
     */
    GenerateUserID() {
        return this.Cache.Wrap("user_id", () => {
            // generate new UUID if cache hit fails
            const newUserID = uuid();

            this.Log(`Generated new UserID ${newUserID}`);

            return Promise.resolve(newUserID);
        }, this[s_userIDCacheTime]);
    }

    /**
     * Get (or fetch new) park data
     */
    GetParkData() {
        return this.Cache.Wrap("data", () => {
            // fetch fresh/updated data
            return this.FetchParkData(this.DataVersion).then((data) => {
                var rideData = {};
                for (var i = 0, item; item = data.Item[i++];) {
                    rideData[item._id] = item.Name;
                }
                return Promise.resolve(rideData);
            });
        }, this[s_dataCacheTime]);
    }

    /**
     * Get the latest data version timestamp
     */
    get DataVersion() {
        return this[s_dataVersion];
    }

    /**
     * Fetch/Sync park data
     * Warning: full sync is ~30MB
     */
    FetchParkData(version) {
        // this is a recursive function, and will keep fetching data until we get no more deltas to resolve
        //  note: we should attempt to periodically update the initialVersion to cut down on these requests

        // remember this as the latest version for next fetch
        this[s_dataVersion] = version;

        // Fetch data
        return this.MakeAPICall({
            url: `${this[s_apiBase]}data`,
            data: {
                version: version
            },
            // we want the full response to get the status code
            returnFullResponse: true,
        }).then((response) => {
            if (response.statusCode == 304) {
                // reject
                this.Log(`Reached status 304 accessing data version ${version}`);
                return Promise.reject();
            } else {
                this.Log(`Received data for version ${version}`);

                return new Promise((resolve, reject) => {
                    // unzip data
                    unzip.fromBuffer(response.body, {
                        lazyEntries: true
                    }, (err, zip) => {
                        var manifestData;
                        var recordsData;

                        this.Log("Parsing zip file");
                        if (err) {
                            return reject(err);
                        }

                        const GetNextEntry = () => {
                            if (manifestData && recordsData) {
                                // got both the files we need, stop reading the zip file

                                // fetch next data URL
                                if (manifestData.version) {
                                    this.FetchParkData(manifestData.version).catch(() => {
                                        // as soon as we hit an error, return the current level or records data
                                        return resolve(recordsData);
                                    });
                                } else {
                                    return resolve(recordsData);
                                }
                            } else {
                                // read next entry
                                zip.readEntry();
                            }
                        };

                        zip.on("entry", (file) => {
                            this.Log(`Got zip file ${file.fileName}`);

                            // look for the two files we want
                            if (file.fileName == "manifest.json") {
                                ReadZipFile(zip, file).then((data) => {
                                    manifestData = data;

                                    GetNextEntry();
                                });
                            } else if (file.fileName == "records.json") {
                                ReadZipFile(zip, file).then((data) => {
                                    recordsData = data;

                                    GetNextEntry();
                                });
                            } else {
                                GetNextEntry();
                            }
                        });

                        // start reading file...
                        zip.readEntry();
                    });
                });
            }
        });
    }

    /**
     * Generic API request function, will sort out API token and send auth headers
     * @param {*} options 
     * @param {String} options.url URL to access
     * @param {String} [options.method=GET] method to use
     * @param {Object} [options.data={}] data/query string to use
     */
    MakeAPICall(options = {
        method: "GET",
        data: {}
    }) {
        // get token
        return this.RegisterDevice().then((token) => {
            // inject auth headers into request headers
            if (!options.headers) {
                options.headers = {};
            }
            options.headers["occasio-platform"] = "Android";
            options.headers["occasio-platform-version"] = "6.0.1";
            options.headers["occasio-app-build"] = this[s_appBuild];
            options.headers["authorization"] = `Attractions-Io api-key "${this[s_apiKey]}", installation-token="${token}"`;

            // make API call
            return this.HTTP(options);
        });
    }

    FetchOpeningTimes() {
        return new Promise((resolve, reject) => {
            this.HTTP({
                url: `${this[s_calendarURLBase]}Umbraco/Api/Calendar/GetAllOpeningTimes`,
                method: "GET",
                headers: {
                    "Referer": this[s_calendarURLBase],
                    "X-Requested-With": "XMLHttpRequest",
                },
                json: true
            }).then((calendarData) => {
                // find theme park dates from response
                //  it contains "WatterPark"[sic] times as well in a separate array
                var parkDates = null;
                if (calendarData[0] && calendarData[0].Type) {
                    // for resorts with multiple parks (Alton Towers)
                    for (var i = 0, times; times = calendarData[i++];) {
                        if (times.Type == "ThemePark") {
                            parkDates = times.OpeningHours;
                            break;
                        }
                    }
                } else if (calendarData[0].Open) {
                    // resorts with only 1 park (Thorpe Park)
                    parkDates = calendarData;
                } else {
                    return reject("Invalid/Unknown calendar data returned");
                }

                var result, timeRange;
                for (i = 0, timeRange; timeRange = parkDates[i++];) {
                    var range = {
                        startDate: Moment(timeRange.From, "YYYY-MM-DDTHH:mm:ss"),
                        endDate: Moment(timeRange.To, "YYYY-MM-DDTHH:mm:ss")
                    };

                    this.Log(`Processing ${range.startDate} => ${range.endDate}`);

                    // figure out opening times for this range
                    if (result = /([0-9:]+\s?[ap]m)\s*-\s*([0-9:]+\s?[ap]m)/gi.exec(timeRange.Open.replace(/\./g, ":"))) {
                        range.openingTime = Moment(result[1].replace(/ /g, ""), "HH:mma");
                        range.closingTime = Moment(result[2].replace(/ /g, ""), "HH:mma");
                    }
                    // try shorthand format too, in case someone entered the times in badly
                    else if (result = /([0-9]+)\s*-\s*([0-9]+)/gi.exec(timeRange.Open.replace(/\./g, ":"))) {
                        range.openingTime = Moment(result[1] + ":00am", "HH:mma");
                        range.closingTime = Moment(result[2] + ":00pm", "HH:mma");
                    } else {
                        this.Log(`Unable to understand hour format: ${timeRange.Open}`);
                        continue;
                    }

                    // apply this range
                    this.Schedule.SetRange(range);
                }

                resolve();
            }, reject);
        });
    }
}

// export the class
module.exports = MerlinPark;

// static functions
function ReadZipFile(zip, file) {
    return new Promise((resolve, reject) => {
        var data = "";
        zip.openReadStream(file, function(err, readStream) {
            if (err) {
                return reject(err);
            }

            readStream.on("data", function(chunk) {
                data += chunk;
            }).on("end", function() {
                // parse JSON data
                try {
                    data = JSON.parse(data);
                    return resolve(data);
                } catch (e) {
                    return reject(`JSON parse error extracting ${file.fileName}: ${e}`);
                }
            });
        });
    });
}