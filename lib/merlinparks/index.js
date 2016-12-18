// include core Park class
var Park = require("../park");

var s_apiBase = Symbol();
var s_apiKey = Symbol();

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
     * @param {String} options.api_base Base URL to access the API
     * @param {String} options.api_key API key to access this park's API
     */
    constructor(options = {}) {
        options.name = options.name || "Merlin Park";

        // hard-code UserAgent for these parks
        //  do this before calling super, so we don't get a randomly generated one
        options.useragent = "Apache-HttpClient/UNAVAILABLE (java 1.4)";

        // inherit from base class
        super(options);

        // custom API options
        if (!options.api_base) throw new Error("Merlin Parks require an API base to work");
        this[s_apiBase] = options.api_base;
        if (!options.api_key) throw new Error("Merlin Parks require an API key");
        this[s_apiKey] = options.api_key;
    }

    /**
     * Fetch Wait Times for Merlin Park
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            // request challenge string
            this.HTTP({
                method: "POST",
                url: `${this[s_apiBase]}/queue-times`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Connection": "Keep-Alive"
                }
            }).then(function(data) {
                if (!data.challenge) return reject(`Failed to get challenge string from API: ${JSON.stringify(data)}`);
                this.Log(`Got challenge string ${data.challenge} for park ${this.Name}`);

                this.GenerateAPIResponse(data.challenge).then(function(response) {
                    this.Log(`Generated response string ${response}`);

                    // make API request with our response request
                    this.HTTP({
                        method: "POST",
                        url: `${this[s_apiBase]}/queue-times`,
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Connection": "Keep-Alive"
                        },
                        body: {
                            response: response,
                            challenge: data.challenge
                        }
                    }).then(function(waittimes) {
                        for (var i = 0, ride; ride = waittimes[i++];) {
                            // apply each wait time data
                            var rideObject = this.GetRideObject({
                                id: ride.id,
                                name: ride.ride,
                            });

                            // update ride wait time
                            rideObject.WaitTime = ride.status == "closed" ? -1 : (ride.time || -1);
                        }

                        resolve();
                    }.bind(this), reject);
                }.bind(this), reject);
            }.bind(this), reject);
        }.bind(this));
    }

    /**
     * Generate a response to a challenge for this park
     * @returns {Promise<String>} Promise resolving with the challenge response for this park
     */
    GenerateAPIResponse(challenge) {
        // each park does this very slightly differently, so each park needs to implement their own version of this
        if (this._APIRespond === undefined) {
            return Promise.reject("Park needs to implement API response function _APIRespond to make API requests");
        }
        return Promise.resolve(this._APIRespond(challenge));
    }

    /**
     * The API Base URL for this park
     * @returns {String} API Base URL
     */
    get APIBase() {
        return this[s_apiBase];
    }

    /**
     * API Key for this park
     * @returns {String} Park's API Key
     */
    get APIKey() {
        return this[s_apiKey];
    }
}

// export the class
module.exports = MerlinPark;