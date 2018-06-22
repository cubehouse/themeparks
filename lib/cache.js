"use strict";

/**
 * Caching module using sqlite
 */

const sqlite3 = require("sqlite3");
const Moment = require("moment-timezone");
const Settings = require("./settings");
const DebugLog = require("./debugPrint.js");

let sqldb = null;
let pendingSetup = false;
let readyCallbacks = [];

// current database version, used for any future database scheme changes
const currentDBVersion = 1;

// get (or initialise) the cache database
function GetDB() {
    return new Promise((resolve) => {
        if (sqldb != null) {
            return resolve(sqldb);
        }

        // no setup yet, add our resolve to list of callbacks once db is ready
        readyCallbacks.push(resolve);

        // if we're already setting up elsewhere, return now and wait for our callback
        if (pendingSetup) return;
        pendingSetup = true;

        // no db setup yet, set one up
        // TODO - use filesystem
        const newdb = new sqlite3.Database(Settings.Cache, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                throw new Error(`Unable to initialise sqlite database: ${err}`);
            }

            if (process.env.DEBUG_DB) {
                newdb.on("trace", (query) => {
                    DebugLog("SQLite:", query);
                });
            }

            // create cache table
            SetupDB(newdb).then(() => {
                // upgrade database if needed
                return UpgradeDB(newdb);
            }).then(() => {
                // setup successful! store database reference for later and callback
                sqldb = newdb;

                // callback to all systems waiting for the database to be ready
                for (let i = 0, cb; cb = readyCallbacks[i++];) {
                    cb(sqldb);
                }
                readyCallbacks = [];
            }).catch(err => {
                throw new Error(`Failed to setup sqlite database: ${err}`);
            });
        });

    });
}

/**
 * Setup database tables
 */
function SetupDB(db) {
    return new Promise((resolve, reject) => {
        const setupQueries = [
            "CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)", // meta table, holds version data etc.
            "CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, expires INTEGER NOT NULL)", // general cache table
            "CREATE TABLE IF NOT EXISTS disneyRides (id INT PRIMARY KEY, waitMinutes INTEGER, status INTEGER, document TEXT)", // couchbase-lite Disney documents
        ];

        const step = () => {
            const query = setupQueries.shift();

            if (!query) return resolve();

            db.run(query, (err) => {
                if (err) return reject(err);
                process.nextTick(step);
            });
        };

        process.nextTick(step);
    });
}

/**
 * Upgrade our cache database
 */
function UpgradeDB(db) {
    return new Promise((resolve, reject) => {
        // perform any database upgrade work here
        db.get("SELECT value FROM meta WHERE key = 'version'", (err, data) => {
            if (err) return reject(err);

            let version = 0;
            if (data && data.value) {
                version = Number(data.value);
            }

            if (version > currentDBVersion) {
                /* eslint-disable no-console */
                console.error(`!!!!!\nThemeparks database version is ${version}, which is higher than expected ${currentDBVersion}.\nThere may be unexpected issues running themeparks library.\n!!!!!`);
                /* eslint-enable no-console */

                return resolve();
            }

            // check if we're already at the latest DB version
            if (version == currentDBVersion) {
                return resolve();
            }

            DebugLog(`Database version out-of-date. Got: ${version}, wants: ${currentDBVersion}`);

            // bump version, upgrade database, and mark DB version number
            const step = () => {
                version++;

                // call version upgrade (if it exists)
                if (DBUpgrades[version]) {
                    DebugLog(`Updating database version to ${version}...`);
                    DBUpgrades[version](db).then(() => {
                        process.nextTick(upgradeDBVersion);
                    });
                } else {
                    // no upgrade script, update database and continue
                    process.nextTick(upgradeDBVersion);
                }
            };

            // bump version number in database, and resolve if we're at the correct version
            const upgradeDBVersion = () => {
                db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('version', ?)", [version], (err) => {
                    if (err) return reject(err);

                    if (version >= currentDBVersion) {
                        return resolve();
                    }

                    process.nextTick(step);
                });
            };

            process.nextTick(step);
        });
    });
}

const DBUpgrades = {
    1: function() {
        // version 1 doesn't need any changes to upgrade, as it's the initial version
        return Promise.resolve();
    }
};

/**
 * Clear out expired entries from our cache
 */
function ClearCache() {
    return GetDB().then(db => {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM cache WHERE expires < ?", [Math.floor(new Date().getTime() / 1000)], (err) => {
                if (err) return reject(err);
                return resolve();
            });
        });
    });
}

// clear the cache every 5 minutes
//  what is .unref()? this unreferences from Node's event queue, so any apps using themeparks won't be stopped from closing if they run out of tasks
//  we only want to do this clearout if the program is actually running, so we let this go if nothing else is going on
setInterval(ClearCache, 1000 * 60 * 5).unref();
// kick-off an initial cache clear
ClearCache();

const s_prefix = Symbol();

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
     * Return the sqlite3 database handle
     * @returns {Promise}
     */
    static DB() {
        return GetDB();
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
     * @returns {Promise<Object>} Returns Promise with data (or null if not cached)
     */
    Get(key) {
        // prepend our key to restrict our request to our park's cache (avoid conflicts with other APIs)
        return this.GetGlobal(this.Prefix + key);
    }

    /**
     * Get a globally cached value
     * This is identical to Get, but the requested key will be in scope of the entire library, not just the park that requests the data
     * @param {String} key Key to request associated data for 
     * @returns {Promise<Object>} Returns Promise with data (or null if not cached)
     */
    GetGlobal(key) {
        return GetDB().then(db => {
            return new Promise((resolve, reject) => {
                db.get("SELECT value FROM cache WHERE key = ? AND expires >= ?", [key, Math.floor(new Date().getTime() / 1000)], (err, data) => {
                    if (err) return reject(err);
                    if (!data) return resolve(null);

                    // parse data back into JSON
                    let JSONData;
                    try {
                        JSONData = {
                            // why in a field called data?
                            //  this makes our ParseMomentStrings update fields by reference, instead of constantly replacing the whole object tree
                            data: JSON.parse(data.value)
                        };
                    } catch (err) {
                        return resolve(null);
                    }

                    // re-parse Moment objects
                    ParseMomentStrings(JSONData);

                    return resolve(JSONData.data);
                });
            });
        });
    }

    /**
     * Set a cached value
     * @param {String} key Key to set data for
     * @param {Object} data Data to store in cache
     * @param {Number|Function} [ttl] Time this data should be cached for (in seconds)
     * @returns {Promise} Returns Promise resolving if cached data was successfully set
     */
    Set(key, data, ttl, stringify = true) {
        // add our prefix and pass onto the SetGlobal function
        return this.SetGlobal(this.Prefix + key, data, ttl, stringify);
    }

    /**
     * Set a cached value library-wide
     * Idential to Set, but cached at a library level instead of for the owning park
     * @param {String} key Key to set data for
     * @param {Object} data Data to store in cache
     * @param {Number|Function} [ttl] Time this data should be cached for (in seconds)
     * @returns {Promise} Returns Promise resolving if cached data was successfully set
     */
    SetGlobal(key, data, ttl, stringify = true) {
        return GetDB().then(db => {
            return new Promise((resolve, reject) => {
                // if we have no ttl, use our default value
                if (!ttl) {
                    ttl = Settings.DefaultCacheLength;
                }

                // process as if a promise, so we can handle ttls passed as functions, abuse Promise.all to succeed regardless of ttl variable type
                Promise.all([ttl]).then((ttl) => {
                    if (!ttl || ttl[0] == undefined) {
                        return reject("Failed to get ttl for cacher");
                    }

                    // query database
                    db.get(
                        "INSERT OR REPLACE INTO cache (key, value, expires) VALUES (?, ?, ?)", [
                            key,
                            stringify ? JSON.stringify(data) : data,
                            ttl[0] + (Math.floor(new Date().getTime() / 1000))
                        ],
                        (err) => {
                            if (err) return reject(err);
                            return resolve();
                        });
                });
            });
        });
    }

    /**
     * Wrap a get request and pass a setter to tidy up the usual get/set boilerplate
     * @param {String} key Key to get/set
     * @param {Function} setFunction Function to set data if it is missing from the cache. setFunction should return a Promise
     * @param {Number|Function} [ttl] How long cached result should last. Can be a number (seconds) or a function that will return a value
     */
    Wrap(key, setFunction, ttl) {
        return _Wrap.bind(this)(key, setFunction, this.Get, this.Set, ttl);
    }

    /**
     * Wrap a get request and pass a setter to tidy up the usual get/set boilerplate. This version sits in the global scope, rather than per-park.
     * @param {String} key Key to get/set
     * @param {Function} setFunction Function to set data if it is missing from the cache. setFunction should return a Promise
     * @param {Number|Function} [ttl] How long cached result should last. Can be a number (seconds) or a function that will return a value
     */
    WrapGlobal(key, setFunction, ttl) {
        return _Wrap.bind(this)(key, setFunction, this.GetGlobal, this.SetGlobal, ttl);
    }

    /**
     * Bulk set cache data
     * @param {Object} data Object of cachekey => data
     * @param {Number|Function} [ttl] How long this data should last in the cache (seconds). Calculated once for bulk query
     */
    SetBulk(data, ttl, ignoreCacheKey = false) {
        return GetDB().then(db => {
            return new Promise((resolve, reject) => {
                // if we have no ttl, use our default value
                if (!ttl) {
                    ttl = Settings.DefaultCacheLength;
                }

                // process as if a promise, so we can handle ttls passed as functions, abuse Promise.all to succeed regardless of ttl variable type
                Promise.all([ttl]).then((ttl) => {
                    if (!ttl || ttl[0] == undefined) {
                        return reject("Failed to get ttl for cacher");
                    }

                    // bulk import data
                    db.serialize(() => {
                        // wrap this around "begin transaction" so this doesn't take forever!
                        db.run("begin transaction");
                        const cacheInsertStatement = db.prepare("INSERT OR REPLACE INTO cache (key, value, expires) VALUES (?, ?, ?)");
                        for (let key in data) {
                            cacheInsertStatement.run(ignoreCacheKey ? key : this.Prefix + key, JSON.stringify(data[key]), ttl[0] + (Math.floor(new Date().getTime() / 1000)));
                        }
                        // commit the inserts
                        db.run("commit");
                        // finish using the insert statement
                        cacheInsertStatement.finalize(() => {
                            resolve();
                        });
                    });
                });
            });

        });
    }

    /**
     * Bulk get cache data
     * @param {Array} keys Array of keys to fetch
     * @param {Number|Function} [ttl] How long this data should last in the cache (seconds). Calculated once for bulk query
     */
    GetBulk(keys, ignoreCacheKey = false) {
        // add our prefix to all the keys unless we're ignoring it (for global bulk gets)
        if (!ignoreCacheKey) {
            for (let i = 0; i < keys.length; i++) {
                keys[i] = this.Prefix + keys[i];
            }
        }

        return GetDB().then(db => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT key, value FROM cache WHERE key IN (${Array(keys.length).fill("?").join(", ")})`, keys, (err, rows) => {
                    if (err) {
                        return reject(`Error bulk fetching keys: ${err}`);
                    }

                    const returnObj = {};
                    for (let i = 0; i < rows.length; i++) {
                        try {
                            const JSONData = JSON.parse(rows[i].value);
                            returnObj[JSONData._id] = JSONData;
                        } catch (err) {
                            // TODO - throw error somewhere
                        }
                    }
                    resolve(returnObj);
                });
            });

        });
    }
}

// Internal wrap helper to not copy/paste logic for global and local-scope wraps
function _Wrap(key, setFunction, _cacheGetter, _cacheSetter, ttl) {
    return new Promise((resolve, reject) => {
        // attempt to get the requested key (note, no prefix here, it's attached in the Get function)
        //  pass success directly through to resolve
        _cacheGetter.bind(this)(key).then((data) => {
            if (data == null) {
                // if cache miss, call the setFunction to get the new value we want
                setFunction().then((dataToCache) => {
                    // store in cache
                    _cacheSetter.bind(this)(key, dataToCache, ttl).then(() => {
                        // resolve with newly cached data
                        resolve(dataToCache);
                    }, reject);
                }, reject);
            } else {
                return resolve(data);
            }
        });
    });
}

// override Moment JSON writer to store the timezone too
Moment.fn.toJSON = function() {
    // clone the object first, otherwise calling ".utc()" modifies the original object
    return "TZ|" + this.clone().utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") + "|" + this.tz();
};

// search for objects with serialized MomentJS data and restore it back into a MomentJS object
const tzRegex = /^TZ\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/;
const ParseMomentStrings = (obj, lvl = 0) => {
    if (!obj) return;
    if (lvl > 10) return;
    for (let k in obj) {
        if (typeof obj[k] === "string") {
            if (obj[k].match(tzRegex)) {
                const str = obj[k].split("|");
                if (str[2] !== "undefined") {
                    obj[k] = Moment.tz(str[1], str[2]);
                } else {
                    obj[k] = Moment(str[1]);
                }
            }
        } else {
            ParseMomentStrings(obj[k], lvl + 1);
        }
    }
};

// create new cache object and export it
module.exports = Cache;