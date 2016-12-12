/**
 * Very simple wrapper around node-cache-manager
 */

var cacheManager = require("cache-manager");
var DebugLog = require("./debugPrint");
var Settings = require("./settings");

// initialise one cache object for the lib
//  use a separate wrapper for each park that calls back to the same cache object
DebugLog(`Initialising cache of type ${Settings.CacheStore} with ttl ${Settings.CacheTtl}`);
var cacheObject = cacheManager.caching({
    store: Settings.CacheStore,
    max: 5000,
    ttl: Settings.CacheTtl
});

var s_prefix = Symbol();

class Cache {
    /**
     * Create Cache object
     * This object will handle caching data for later use
     * @param {Object} [options]
     * @param {String} [options.prefix] Preface to prepend to all cache keys for this instance
     */
    constructor(options = {}) {
        // setup cache configuration
        this[s_prefix] = options.prefix || "";
    }

    /**
     * Get the prefix used for this caching instance
     * @returns {String} Cache key prefix
     */
    get Prefix() {
        return this[s_prefix] + "_";
    }

    /** 
     * Get a cached value
     * @param {String} key Key to request associated data for 
     * @returns {Promise<Object>} Returns Promise resolved if data found, rejects if data is not in cache
     */
    Get(key) {
        return new Promise(function(resolve, reject) {
            // prepend the prefix to the requested key
            cacheObject.get(this.Prefix + key, function(err, result) {
                // reject promise on failure
                if (err) return reject(err);
                // reject on no data returned
                if (typeof result == "undefined") return reject();

                // resolve promise on successful data
                return resolve(result);
            }.bind(this));
        }.bind(this));
    }

    /**
     * Set a cached value
     * @param {String} key Key to set data for
     * @param {Object} data Data to store in cache
     * @param {Object} [options] Additional options for caching (see node-cache-manager)
     * @returns {Promise} Returns Promise resolving if cached data was successfully set
     */
    Set(key, data, options = {}) {
        return new Promise(function(resolve, reject) {
            // prepend prefix to key setting
            cacheObject.set(this.Prefix + key, data, options, function(err) {
                // if failure, reject Promise
                if (err) return reject(err);

                // other, resolve
                resolve();
            }.bind(this));
        }.bind(this));
    }

    /**
     * Wrap a get request and pass a setter to tidy up the usual get/set boilerplate
     * @param {String} key Key to get/set
     * @param {Function} setFunction Function to set data if it is missing from the cache. setFunction should return a Promise
     * @param {Number|Function} [ttl] How long cached result should last. Can be a number (seconds) or a function that will return a value
     */
    Wrap(key, setFunction, ttl) {
        return new Promise(function(resolve, reject) {
            // attempt to get the requested key (note, no prefix here, it's attached in the Get function)
            //  pass success directly through to resolve
            this.Get(key).then(resolve, function() {
                // if cache miss, call the setFunction to get the new value we want
                setFunction().then(function(dataToCache) {
                    // work out ttl
                    var options = {};
                    if (ttl) {
                        //  if it's a function, call the function to get the required ttl
                        if (typeof ttl == "function") {
                            ttl = ttl();
                        }
                        options.ttl = ttl;
                    }

                    // store in cache
                    this.Set(key, dataToCache, options).then(function() {
                        // resolve with newly cached data
                        resolve(dataToCache);
                    }.bind(this), reject);
                }.bind(this), reject);
            }.bind(this));
        }.bind(this));
    }
}

// create new cache object and export it
module.exports = Cache;