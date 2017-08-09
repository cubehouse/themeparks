const crypto = require("crypto");
const Moment = require("moment-timezone");

const Park = require("../park");

const GeoLocation = require("../geoLocation.js");

const s_apiVersion = Symbol();
const s_cryptoKey = Symbol();
const s_cryptoCipher = Symbol();
const s_cryptoIV = Symbol();
const s_digestKey = Symbol();
const s_searchURL = Symbol();
const s_waitTimesURL = Symbol();

/**
 * Implements the Efteling API framework.
 * @class
 * @extends Park
 */
class Efteling extends Park {
    /**
     * Create new Efteling Object.
     * @param {Object} [options]
     * @param {String} [options.api_version] Version of the API to reference in request headers
     * @param {String} [options.digest_key] Key used to generate URL header digest
     * @param {String} [options.crypto_key] Key to decrypt wait times
     * @param {String} [options.crypto_cipher] Cipher to decrypt wait times
     * @param {Buffer} [options.crypto_iv] IV to decrypt wait times
     * @param {String} [options.search_url] URL used for fetching POI data
     */
    constructor(options = {}) {
        options.name = options.name || "Efteling";

        options.timezone = options.timezone || "Europe/Amsterdam";

        // set park's location as it's entrance
        options.latitude = options.latitude || 51.64990915659694;
        options.longitude = options.longitude || 5.043561458587647;

        // inherit from base class
        super(options);

        // api settings
        this[s_apiVersion] = options.api_version || "4";

        // URL generation settings
        this[s_digestKey] = options.digest_key || "blblblblbla";

        // decryption settings
        this[s_cryptoKey] = options.crypto_key || "1768257091023496";
        this[s_cryptoCipher] = options.crypto_cipher || "aes-128-cbc";
        this[s_cryptoIV] = options.crypto_iv || new Buffer([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        // URL settings
        this[s_searchURL] = options.search_url || "http://prd-search-acs.efteling.com/2013-01-01/";
        this[s_waitTimesURL] = options.wait_times_url || "https://mobile-services.efteling.com/wis/";
    }

    /**
     * Get POI data for this park (from the cache or fetch fresh data if none is cached)
     * @returns {Promise}
     */
    GetPOIData() {
        return this.Cache.Wrap("poidata", this.FetchPOIData.bind(this), 60 * 60 * 24);
    }

    /**
     * Fetch POI data for the park.
     * Don't call this function directly unless you know what you're doing. Use GetPOIData instead to use cached data when possible.
     * @returns {Promise} Object of Ride IDs => Object containing name and location (GeoLocation object, if location is available for this ride)
     */
    FetchPOIData() {
        return this.MakeRequest({
            url: `${this[s_searchURL]}search`,
            data: {
                "size": 1000,
                "q.parser": "structured",
                "q": "(phrase field=language 'en')"
            }
        }).then((result) => {
            if (!result || !result.hits || !result.hits.hit) {
                throw new Error(`No results returned for POI data for Efteling Park: ${result}`);
            }

            var poiData = {};

            result.hits.hit.map((hit) => {
                if (hit.fields) {
                    // ignore non-attractions
                    if (hit.fields.category == "attraction") {
                        poiData[hit.fields.id] = {
                            name: hit.fields.name,
                        };

                        // try to parse lat/long
                        //  edge-case: some rides have dud "0.0,0.0" location, ignore these
                        if (hit.fields.latlon && hit.fields.latlon != "0.0,0.0") {
                            var match = /([0-9.]+),([0-9.]+)/.exec(hit.fields.latlon);
                            if (match) {
                                poiData[hit.fields.id].location = new GeoLocation({
                                    latitude: match[1],
                                    longitude: match[2]
                                });
                            }
                        }
                    }
                }
            });

            return poiData;
        });
    }

    /**
     * Fetch park wait times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        // first, get POI data
        return this.GetPOIData().then((poiData) => {
            // then, get latest wait time results
            return this.FetchWaitTimesData().then((waitData) => {
                // parse and inject into park data
                if (!waitData.AttractionInfo) throw new Error("No AttractionInfo found for Efteling Park response");

                waitData.AttractionInfo.map((item) => {
                    // check we have POI data and item is an attraction
                    if (item.Type == "Attraction" && poiData[item.Id]) {
                        var rideObject = this.GetRideObject({
                            id: item.Id,
                            name: poiData[item.Id].name
                        });

                        if (rideObject) {
                            // update ride with wait time data
                            //  if the State isn't "open", assume ride is closed
                            // TODO - learn how Efteling marks rides as under refurb and set = -2
                            rideObject.WaitTime = item.State == "open" ? parseInt(item.WaitingTime, 10) : -1;
                        }
                    }
                });

                return Promise.resolve();
            });
        });
    }

    /**
     * Fetch the raw wait times data for Efteling Park
     */
    FetchWaitTimesData() {
        return this.MakeRequest({
            url: this[s_waitTimesURL]
        });
    }

    /**
     * Decrypt an encrypted string from the Efteling API
     * @param {String|Buffer} data 
     */
    DecryptString(data) {
        // step 1: decode Base64 (make sure it's in ascii format first, since it's a base64 string in text, not actual base64 data)
        const decodedBuffer = Buffer.from(data.toString("ascii"), "base64");
        // step 2: setup decryption
        const decipher = crypto.createDecipheriv(this[s_cryptoCipher], this[s_cryptoKey], this[s_cryptoIV]);
        // step 3: decrypt and return as utf8 string
        return Buffer.concat([
            decipher.update(decodedBuffer),
            decipher.final()
        ]).toString("utf8");
    }

    /**
     * Generate a digest for given URL
     * @param {String} URL
     */
    GetDigest(url) {
        // remove http(s) from string
        url = url.replace(/^https?:\/\//, "");
        // generate digest
        const hmac = crypto.createHmac("sha256", this[s_digestKey]);
        hmac.update(url);
        return hmac.digest("hex");
    }

    /**
     * Make an API request against the Efteling API
     * Injects required headers and passes request through to standard HTTP method
     * See HTTP for full documentation on how to use
     * @param {Object} requestOptions 
     * @return {Promise}
     */
    MakeRequest(requestOptions) {
        if (!requestOptions.url) {
            return Promise.error("No URL supplied");
        }

        // generate digest needed to make URL request
        const digest = this.GetDigest(requestOptions.url);
        this.Log(`Generated digest for url "${requestOptions.url}": ${digest}`);

        // add our required headers
        if (!requestOptions.headers) requestOptions.headers = {};
        requestOptions.headers["X-Digest"] = digest;
        requestOptions.headers["X-Api-Version"] = this[s_apiVersion];

        if (requestOptions.body || requestOptions.data) {
            requestOptions.headers["Content-Type"] = "application/json";
        }

        // return full body (so we don't try to auto-parse JSON data as it's often encrypted)
        requestOptions.returnFullResponse = true;
        // don't auto-JSON request or response
        requestOptions.json = false;

        return this.HTTP(requestOptions).then((response) => {
            // intercept the HTTP method's response to sort out any encrypted data responses...

            if (!response.body) return Promise.reject("Failed to get network response");

            // check if we've already got a valid JSON object as a response
            if (response.body.constructor === {}.constructor || response.body.constructor === [].constructor) {
                return Promise.resolve(response.body);
            }

            // try to parse result body into JSON first
            var JSONResult;
            try {
                JSONResult = JSON.parse(response.body);
                return Promise.resolve(JSONResult);
            } catch (e) {
                // failed to parse JSON data? assume it's encrypted and decrypt it first
                var decryptedString;
                try {
                    decryptedString = this.DecryptString(response.body);
                } catch (e) {
                    throw new Error(`Failed to decrypt string: ${response.body}`);
                }

                // got decrypted string, try to parse it
                try {
                    JSONResult = JSON.parse(decryptedString);
                    return Promise.resolve(JSONResult);
                } catch (e) {
                    // also failed to parse decrypted data? reject
                    throw new Error(`Failed to parse decrypted Efteling string: ${decryptedString}`);
                }
            }
        });
    }

    /**
     * Request park opening times.
     * @returns {Promise}
     */
    FetchOpeningTimes() {
        // calculate how many (and which) months we want to check
        const endMonth = Moment().tz(this.Timezone).add(this.ScheduleDays, "days");
        var datePointer = Moment().tz(this.Timezone);
        const months = [];

        this.Log(`Fetching opening hours between ${datePointer.format()} and ${endMonth.format()}`);

        // slide along between start and end until we go past endMonth to get an array of required month/year combos
        while (datePointer.isSameOrBefore(endMonth, "month")) {
            months.push({
                month: datePointer.format("M"),
                year: datePointer.format("YYYY")
            });
            datePointer.add(1, "months");
        }

        // loop through each month, calling FetchOpeningTimesByMonth
        return Promise.all(months.map((month) => {
            return this.FetchOpeningTimesByMonth(month.month, month.year);
        })).then((results) => {
            // inject results into calendar
            results.map((hours) => {
                hours.map((times) => {
                    this.Schedule.SetDate({
                        date: times.open,
                        openingTime: times.open,
                        closingTime: times.close
                    });
                });
            });
            return results;
        });
    }

    /**
     * Fetch park opening times for a specific month and add to park's opening times
     * @param {String} month
     * @param {String} [year]
     * @returns {Promise} Array of Objects containing "open" and "close" Moment objects
     */
    FetchOpeningTimesByMonth(month, year) {
        // default to current year if none supplied
        if (!year) {
            year = Moment.tz(this.Timezone).format("YYYY");
        }

        return this.HTTP({
            url: `https://www.efteling.com/service/cached/getpoiinfo/en/${year}/${month}`,
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        }).then((data) => {
            if (!data) throw new Error(`Invalid data returned for park opening hours for ${month}/${year}`);
            if (!data.OpeningHours) throw new Error(`No park opening hours data returned for ${month}/${year}`);

            // build array of Moment objects for each open and close time
            const result = [];
            for (var i = 0, date; date = data.OpeningHours[i++];) {
                const open = Moment.tz(`${date.Date}${date.Open}`, "YYYY-MM-DDHH:mm", this.Timezone);
                const close = Moment.tz(`${date.Date}${date.Close}`, "YYYY-MM-DDHH:mm", this.Timezone);
                result.push({
                    open,
                    close,
                });
            }
            return result;
        });
    }
}

module.exports = Efteling;