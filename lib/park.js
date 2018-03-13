"use strict";

const Location = require("./location");

// our caching library
const CacheLib = require("./cache");

// Ride class
const Ride = require("./ride");

// load user settings
const Settings = require("./settings");

// random useragent generator
const RandomUseragent = require("random-useragent");

// wrap the HTTP lib for each park so we automatically pass the User-Agent header nicely along
const HTTPLib = require("./http");

// symbols
const s_cacheObject = Symbol();
const s_cacheTimeWaitTimes = Symbol();
const s_cacheTimeOpeningTimes = Symbol();
const s_cachedWaitTimesResponse = Symbol();
const s_useragent = Symbol();
const s_proxyAgent = Symbol();
const s_rideObjects = Symbol();

/**
 * Park class handles all the base logic for all implemented themeparks.
 * All parks should inherit from this base class.
 * Any common functionality is implemented here to save endless re-implementations for each park.
 * @class
 */
class Park extends Location {
    /**
     * Create a new Park object
     * @param {Object} options
     * @param {Number} [options.cacheWaitTimesLength=300] How long (in seconds) to cache wait times before fetching fresh data
     * @param {Number} [options.cacheOpeningTimesLength=3600] How long (in seconds) to cache opening times before fetching fresh data
     * @param {String} [options.useragent] Useragent to use when making HTTP requests
     * @param {http.Agent} [options.proxyAgent] A http.Agent object to use as a proxy when making HTTP requests for this park. Eg. https-proxy-agent, or socks-proxy-agent
     */
    constructor(options = {}) {
        super(options);

        // can only construct actual parks, not the park object itself
        //  see http://ilikekillnerds.com/2015/06/abstract-classes-in-javascript/
        if (this.constructor === Park) {
            throw new TypeError("Cannot create Park object directly, only park implementations of Park");
        }

        // cache settings
        //  how long wait times are cached before fetching new data
        this[s_cacheTimeWaitTimes] = options.cacheWaitTimesLength;
        this[s_cacheTimeOpeningTimes] = options.cacheOpeningTimesLength;

        // proxy agent to use for HTTP requests
        this[s_proxyAgent] = options.proxyAgent || null;

        // set useragent, or if no useragent has been set, create a random Android one by default
        this.UserAgent = options.useragent || function(ua) {
            return (ua.osName == "Android");
        };

        // create cache object for this park
        this[s_cacheObject] = new CacheLib({
            prefix: this.constructor.name
        });

        // keep a cache of ride objects (ID => Ride) to return
        this[s_rideObjects] = {};

        // keep a cache of wait times response in memory, to avoid needless database reads
        this[s_cachedWaitTimesResponse] = {
            time: null,
            data: {}
        };
    }

    /**
     * Get waiting times for rides from this park
     * If the last argument is a function, this will act as a callback.
     *  Callback will call with callback(error, data)
     *  Data will be null if error is present
     * If the last argument is not a function, this will return a Promise.
     */
    GetWaitTimes() {
        const callback = arguments[arguments.length - 1];
        // if our last argument is a function, use it as a callback
        if (typeof callback === "function") {
            // translate the promise result into a "classic" callback response
            this.GetWaitTimesPromise().then((data) => callback(null, data)).catch(callback);
            // otherwise, return a Promise object
        } else {
            return this.GetWaitTimesPromise();
        }
    }

    /**
     * Get opening times for this park
     * If the last argument is a function, this will act as a callback.
     *  Callback will call with callback(error, data)
     *  Data will be null if error is present
     * If the last argument is not a function, this will return a Promise.
     */
    GetOpeningTimes() {
        const callback = arguments[arguments.length - 1];
        // if our last argument is a function, use it as a callback
        if (typeof callback === "function") {
            // translate the promise result into a "classic" callback response
            this.GetOpeningTimesPromise().then((data) => callback(null, data)).catch(callback);
            // otherwise, return a Promise object
        } else {
            return this.GetOpeningTimesPromise();
        }
    }

    /**
     * Process wait times request
     */
    GetWaitTimesPromise() {
        // check memory cache to avoid pointless database reads
        if (this[s_cachedWaitTimesResponse].time >= (+new Date() - (1000 * this[s_cacheTimeWaitTimes]))) {
            return Promise.resolve(this[s_cachedWaitTimesResponse].data);
        }

        // check last fetch time
        return this.Cache.Get("waittimes_lastfetch").then((last_fetch) => {
            if (last_fetch !== null) {
                // return database cached data
                return this.Cache.Get("waittimes").then((ride_data) => {
                    return this.BuildWaitTimesResponse(ride_data);
                });
            }

            // otherwise, call FetchWaitTimes to fetch fresh data
            return this.FetchWaitTimes().then((ride_data) => {
                // set new lastfetch time
                return this.Cache.Set("waittimes_lastfetch", +(new Date()), {
                    ttl: this[s_cacheTimeWaitTimes]
                }).then(() => {
                    // store new ride data in database cache
                    return this.Cache.Set("waittimes", ride_data).then(() => {
                        // return new data
                        return this.BuildWaitTimesResponse(ride_data);
                    });
                });
            });
        });
    }

    /**
     * Build the Wait Times response from JSON data
     * This will create/fetch Ride objects based on the supplied JSON data
     */
    BuildWaitTimesResponse(data) {
        const rides = [];

        for (let rideIdx = 0; rideIdx < data.length; rideIdx++) {
            // find/create our Ride object
            const rideObject = this.GetRideData(data[rideIdx].id);
            rideObject.fromJSON(data[rideIdx]);

            rides.push(rideObject);
        }

        return Promise.resolve(rides);
    }

    /**
     * Process opening times request
     */
    GetOpeningTimesPromise() {
        return Promise.reject("Not yet implemented");
    }

    /**
     * Find (or create) a ride object with the given ID
     * @param {*} rideId ID to search for/create ride
     */
    GetRideData(rideId) {
        // prepend park name to ride ID so it is unique across the library
        const className = this.constructor.name;
        if (String(rideId).substr(0, className.length + 1) !== `${className}_`) {
            rideId = `${className}_${rideId}`;
        }

        // check our local ride cache first
        if (this[s_rideObjects][rideId]) {
            return this[s_rideObjects][rideId];
        }

        // don't have this locally, create it and store it for later
        this[s_rideObjects][rideId] = new Ride({
            rideId: rideId,
            timezone: this.Timezone,
            forceCreate: true
        });

        return this[s_rideObjects][rideId];
    }

    /**
     * Get this park's useragent string for making network requests
     * This is usually randomly generated on object construction
     * @type {String}
     */
    get UserAgent() {
        return this[s_useragent];
    }

    /**
     * Set this park's useragent
     * Can set user agent to a defined string or use a generator function (see random-useragent library)
     * @type {string|function}
     */
    set UserAgent(useragent = null) {
        if (!useragent) throw new Error("No configuration passed to UserAgent setter");

        if (typeof(useragent) === "function") {
            // generate a useragent using a generator function
            this[s_useragent] = RandomUseragent.getRandom(useragent);
        } else if (typeof(useragent) === "string") {
            // set useragent using supplied static string
            this[s_useragent] = useragent;
        } else {
            throw new Error("Must define either static user agent string or a generator function");
        }

        this.Log("Set useragent to " + this.UserAgent);
    }

    /**
     * Does this park offer fast-pass services?
     * @type {Boolean}
     */
    get FastPass() {
        return false;
    }

    /**
     * Does this park tell you the fast-pass return times?
     * @type {Boolean}
     */
    get FastPassReturnTimes() {
        return false;
    }

    /**
     * Does this park offer wait time information?
     * @type {Boolean}
     */
    get SupportsWaitTimes() {
        // base this logic solely on the presence of a function "FetchWaitTimes" existing
        return this.FetchWaitTimes !== undefined;
    }

    /**
     * Does this park offer opening time information?
     * @type {Boolean}
     */
    get SupportsOpeningTimes() {
        // base this logic solely on the presence of a function "FetchOpeningTimes" existing
        return this.FetchOpeningTimes !== undefined;
    }

    /**
     * Does this park offer opening times for rides?
     * @type {Boolean}
     */
    get SupportsRideSchedules() {
        return false;
    }

    /**
     * Make an HTTP request using this park's user agent and HTTP settings
     */
    HTTP(options) {
        if (!options) return Promise.reject("No HTTP options passed!");
        if (!options.headers) options.headers = {};
        if (!options.headers["User-Agent"]) options.headers["User-Agent"] = this.UserAgent;

        // some default timeout settings for needle
        if (!options.open_timeout) options.open_timeout = Settings.OpenTimeout;
        if (!options.read_timeout) options.read_timeout = Settings.ReadTimeout;

        // use a proxy agent, is supplied
        if (this[s_proxyAgent] !== null) {
            options.agent = this[s_proxyAgent];
        }

        // pass on options to HTTP lib and return
        return HTTPLib(options);
    }

    /**
     * Get the cache object for this park
     * @returns {Cache}
     */
    get Cache() {
        return this[s_cacheObject];
    }
}

module.exports = Park;