// include core Park class
const Park = require("../park");

const GeoLocation = require("../geoLocation");

const cheerio = require("cheerio");
const Moment = require("moment-timezone");

const s_parkURL = Symbol();

/**
 * Implements the Universal Japan API.
 * @class
 * @extends Park
 */
class UniversalStudiosJapan extends Park {
    /**
     * Create new UniversalStudiosJapan Object.
     * @param {Object} options
     * @param {String} [options.api_base] API URL base for accessing API
     * @param {String} [options.api_langauge] Language ID for API results (default: 1)
     */
    constructor(options = {}) {
        options.name = options.name || "Universal Studios Japan";

        // set park's location as it's entrance
        options.latitude = options.latitude || 34.665482;
        options.longitude = options.longitude || 135.432360;

        options.timezone = "Asia/Tokyo";

        // inherit from base class
        super(options);

        this[s_parkURL] = options.park_url || "http://ar02.biglobe.ne.jp/app/waittime/waittime.json"
    }

    /**
     * Fetch Universal Japan's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise((resolve, reject) => {
            this.Log("Running Universal Studios Japan");
            this.HTTP({
                url: this[s_parkURL],
            }).then((body) => {
                // check the response is as we expect
                if (!body) {
                    this.Log(`Error parsing Universal Studios Japan response: ${body}`);
                    return reject("Unable to parse Universal Studios Japan wait times response");
                }
                if (body.status != 0) {
                    this.Log(`Incorrect status code: ${body} - the park is probably closed`);
                    return reject("Unable to parse Universal Studios Japan wait times response");
                }

                // loop through each zone
                body.list.forEach((info) => {
                    var rides = info.rows
                    var wait = parseInt(info.wait.replace('分', '').replace(/^\s+|\s+$/g, ''))

                    // loop through each ride
                    for (var rideIDX = 0, ride; ride = rides[rideIDX++];) {
                        var rideObject = this.GetRideObject({
                            id: ride.aid,
                            name: ride.text
                        });
                        rideObject.WaitTime = wait;
                    }
                });

                return resolve();
            }, reject);
        });
    }
}

// export the class
module.exports = UniversalStudiosJapan;
