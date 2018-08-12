/**
 * Caching module using sqlite
 */

const sqlite3 = require('sqlite3');
const Moment = require('moment-timezone');
const Settings = require('./settings');
const DebugLog = require('./debugPrint');

let sqldb = null;
let pendingSetup = false;
let readyCallbacks = [];

const pendingWrapPromises = {};

function ExecSQLInOrder(db, sqlArr) {
  return new Promise((resolve, reject) => {
    const step = () => {
      const query = sqlArr.shift();

      if (!query) return resolve();

      return db.run(query, (err) => {
        if (err) return reject(err);
        return process.nextTick(step);
      });
    };

    process.nextTick(step);
  });
}

const DBUpgrades = {
  1(db) {
    // version 1 adds the core cache table and disneyRides for storing ride data
    return ExecSQLInOrder(db, [
      'CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, expires INTEGER NOT NULL)', // general cache table
      'CREATE TABLE IF NOT EXISTS disneyRides (id INT PRIMARY KEY, waitMinutes INTEGER, status INTEGER, document TEXT)', // couchbase-lite Disney documents
    ]);
  },
  2(db) {
    // version 2 adds separate facilities table for easy access to disney facilities
    //  used by disneyFaciliyChannel
    return ExecSQLInOrder(db, [
      'CREATE TABLE IF NOT EXISTS disneyFacilities (id INTEGER PRIMARY KEY, name TEXT, entityType TEXT, docKey TEXT, park TEXT)', // facility meta data
    ]);
  },
  3(db) {
    return ExecSQLInOrder(db, [
      'CREATE TABLE IF NOT EXISTS couchbasesync (id TEXT PRIMARY KEY, rev TEXT, body TEXT, dbName TEXT)', // store couchbase documents in their own table
      'CREATE INDEX couchbasesync_dbName ON couchbasesync (dbName);', // create index of dbName, since we'll be filtering on this all the time
    ]);
  },
  4(db) {
    return ExecSQLInOrder(db, [
      'DROP TABLE disneyFacilities',
      'CREATE TABLE IF NOT EXISTS disneyFacilities (id INTEGER PRIMARY KEY, name TEXT, entityType TEXT, docKey TEXT, resort_code TEXT, park_id INT, resort_id INT, resort_area_id INT)',
      'CREATE INDEX disneyFacilities_resort_code ON disneyFacilities (resort_code);',
      'CREATE INDEX disneyFacilities_park_id ON disneyFacilities (park_id);',
      'CREATE INDEX disneyFacilities_resort_id ON disneyFacilities (resort_id);',
      'CREATE INDEX disneyFacilities_resort_area_id ON disneyFacilities (resort_area_id);',
      // nuke out any facilities sequence ID so we fetch it all again fresh
      'DELETE FROM cache WHERE key LIKE "couchdb_facilities%"',
      'DELETE FROM couchbasesync WHERE dbName LIKE "facilities_%"',
    ]);
  },
  5(db) {
    return ExecSQLInOrder(db, [
      // store date -> couchbase document for each resort
      'CREATE TABLE IF NOT EXISTS disneyCalendar (date TEXT PRIMARY KEY, docKey TEXT, resort_code TEXT)',
      'CREATE INDEX disneyCalendar_park_id ON disneyCalendar (docKey);',
      'CREATE INDEX disneyCalendar_resort_code ON disneyCalendar (resort_code);',
    ]);
  },
};

// current database version, used for any future database scheme changes
//  take highest key value of DBUpgrades
const currentDBVersion = Object.keys(DBUpgrades).reduce((a, b) => (a > b ? a : b));

/**
 * Setup database tables
 */
function SetupDB(db) {
  // setup DB adds the initial meta table, which holds our database version
  return ExecSQLInOrder(db, [
    'CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)', // meta table, holds version data etc.
  ]);
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
      if (version >= currentDBVersion) {
        return resolve();
      }

      DebugLog(`Database version out-of-date. Got: ${version}, wants: ${currentDBVersion}`);

      // bump version, upgrade database, and mark DB version number
      const step = () => {
        version += 1;

        // bump version number in database, and resolve if we're at the correct version
        const upgradeDBVersion = () => {
          db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('version', ?)", [version], (upgradeDbErr) => {
            if (upgradeDbErr) return reject(upgradeDbErr);

            if (version >= currentDBVersion) {
              return resolve();
            }

            return process.nextTick(step);
          });
        };

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

      return process.nextTick(step);
    });
  });
}

/**
 * Clear out expired entries from our cache
 */
function ClearCache() {
  return new Promise((resolve, reject) => {
    sqldb.run('DELETE FROM cache WHERE expires < ?', [Math.floor(new Date().getTime() / 1000)], (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

// get (or initialise) the cache database
function GetDB() {
  /* eslint-disable consistent-return */
  return new Promise((resolve) => {
    /* eslint-enable consistent-return */
    if (sqldb !== null) {
      return resolve(sqldb);
    }

    // no setup yet, add our resolve to list of callbacks once db is ready
    readyCallbacks.push(resolve);

    // if we're already setting up elsewhere, return now and wait for our callback
    if (!pendingSetup) {
      pendingSetup = true;

      // no db setup yet, set one up
      DebugLog(`Setting up database "${Settings.Cache}"`);
      const newdb = new sqlite3.Database(Settings.Cache, (err) => {
        if (err) {
          throw new Error(`Unable to initialise sqlite database: ${err}`);
        }

        if (process.env.DEBUG_DB) {
          newdb.on('trace', (query) => {
            DebugLog('SQLite:', query);
          });
        }

        // create cache table
        SetupDB(newdb).then(() => UpgradeDB(newdb)).then(() => {
          // setup successful! store database reference for later and callback
          sqldb = newdb;

          // callback to all systems waiting for the database to be ready
          readyCallbacks.forEach((cb) => {
            cb(sqldb);
          });

          readyCallbacks = [];

          /* clear the cache every 5 minutes
           *  what is .unref()? this unreferences from Node's event queue
           *   so any apps using themeparks won't be stopped from closing if they run out of tasks
           *  we only want to do this clearout if the program is actually running,
           *   so we let this go if nothing else is going on
           * */
          setInterval(ClearCache, 1000 * 60 * 5).unref();
          // kick-off an initial cache clear next tick
          process.nextTick(ClearCache);
        }).catch((sqlSetupErr) => {
          throw new Error(`Failed to setup sqlite database: ${sqlSetupErr}`);
        });
      });
    }
  });
}

// override Moment JSON writer to store the timezone too
Moment.fn.toJSON = function CacheMomentJSON() {
  return `TZ|${this.clone().utc().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')}|${this.tz()}`;
};

// search for objects with serialized MomentJS data and restore it back into a MomentJS object
const tzRegex = /^TZ\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/;
const ParseMomentStrings = (obj, lvl = 0) => {
  if (!obj) return;
  if (lvl > 10) return;
  const keys = Object.keys(obj);
  keys.forEach((k) => {
    if (typeof obj[k] === 'string') {
      if (obj[k].match(tzRegex)) {
        const str = obj[k].split('|');
        /* eslint-disable no-param-reassign */
        if (str[2] !== 'undefined') {
          obj[k] = Moment.tz(str[1], str[2]);
        } else {
          obj[k] = Moment(str[1]);
        }
        /* eslint-enable no-param-reassign */
      }
    } else {
      ParseMomentStrings(obj[k], lvl + 1);
    }
  });
};

// handle serialising Maps
function replacer(key, value) {
  if (value === undefined || value === null) return value;
  if (Object.getPrototypeOf(value) === Map.prototype) {
    return {
      cacheMappedType: 'map',
      map: [...value],
    };
  }
  return value;
}

function reviver(key, value) {
  if (value.cacheMappedType === 'map') return new Map(value.map);
  return value;
}

/**
 * Get a globally cached value
 * This is identical to Get, but the requested key will be in scope of the entire library,
 *  not just the park that requests the data
 * @param {String} key Key to request associated data for
 * @returns {Promise<Object>} Returns Promise with data (or null if not cached)
 */
function GetGlobal(key) {
  return GetDB().then(db => new Promise((resolve, reject) => {
    db.get('SELECT value FROM cache WHERE key = ? AND expires >= ?', [key, Math.floor(new Date().getTime() / 1000)], (err, data) => {
      if (err) return reject(err);
      if (!data) return resolve(null);

      // parse data back into JSON
      let JSONData;
      try {
        JSONData = {
          /*
           * why in a field called data?
           * this makes our ParseMomentStrings update fields by reference,
           *  instead of constantly replacing the whole object tree
           * */
          data: JSON.parse(data.value, reviver),
        };
      } catch (JSONParseErr) {
        return resolve(null);
      }

      // re-parse Moment objects
      ParseMomentStrings(JSONData);

      return resolve(JSONData.data);
    });
  }));
}

/**
 * Set a cached value library-wide
 * Idential to Set, but cached at a library level instead of for the owning park
 * @param {String} key Key to set data for
 * @param {Object} data Data to store in cache
 * @param {Number|Function} [ttl] Time this data should be cached for (in seconds)
 * @returns {Promise} Returns Promise resolving if cached data was successfully set
 */
function SetGlobal(key, data, ttl, stringify = true) {
  return GetDB().then(db => new Promise((resolve, reject) => {
    // if we have no ttl, use our default value
    let timeToLive = ttl;
    if (!timeToLive) {
      timeToLive = Settings.DefaultCacheLength;
    }

    const ttlResolver = typeof timeToLive === 'function' ? timeToLive : () => Promise.resolve(timeToLive);

    /* Process as if a promise, so we can handle ttls passed as functions.
     * Abuse Promise.all to succeed regardless of ttl variable type
     * */
    ttlResolver().then((evaluatedTimeToLive) => {
      if (!evaluatedTimeToLive) {
        return reject(new Error('Failed to get ttl for cacher'));
      }

      // query database
      return db.get(
        'INSERT OR REPLACE INTO cache (key, value, expires) VALUES (?, ?, ?)', [
          key,
          stringify ? JSON.stringify(data, replacer) : data,
          evaluatedTimeToLive + (Math.floor(new Date().getTime() / 1000)),
        ],
        (err) => {
          if (err) return reject(err);
          return resolve();
        }
      );
    });
  }));
}

const sCachePrefix = Symbol('Cache Prefix');

class Cache {
  /**
   * Create Cache object
   * This object will handle caching data for later use
   * @param {Object} [options]
   * @param {String} [options.prefix] Preface to prepend to all cache keys for this instance
   */
  constructor(options = {}) {
    // setup cache configuration
    this[sCachePrefix] = options.prefix || '';
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
    return `${this[sCachePrefix]}_`;
  }

  /**
   * Get a cached value
   * @param {String} key Key to request associated data for
   * @returns {Promise<Object>} Returns Promise with data (or null if not cached)
   */
  Get(key) {
    /* prepend our key to restrict our request to our park's cache
     * (avoid conflicts with other APIs)
     */
    return GetGlobal(this.Prefix + key);
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
    return SetGlobal(this.Prefix + key, data, ttl, stringify);
  }

  /**
   * Wrap a get request and pass a setter to tidy up the usual get/set boilerplate
   * @param {String} key Key to get/set
   * @param {Function} setFunction Function to set data if it is missing from the cache.
   * setFunction should return a Promise
   * @param {Number|Function} [ttl] How long cached result should last.
   * Can be a number (seconds) or a function that will return a value
   */
  Wrap(key, setFunction, ttl) {
    return Cache.WrapGlobal(this.Prefix + key, setFunction, ttl);
  }

  /**
   * Wrap a get request and pass a setter to tidy up the usual get/set boilerplate.
   * This version sits in the global scope, rather than per-park.
   * @param {String} key Key to get/set
   * @param {Function} setFunction Function to set data if it is missing from the cache.
   * setFunction should return a Promise
   * @param {Number|Function} [ttl] How long cached result should last.
   * Can be a number (seconds) or a function that will return a value
   */
  static WrapGlobal(key, setFunction, ttl) {
    // check for any pending Promises
    if (pendingWrapPromises[key] !== undefined) {
      return pendingWrapPromises[key];
    }

    // setup Promise to get/set cache entry
    //  store Promise ref, so if multiple requests are made before we return,
    //  we can return the same result to all the requests at once
    pendingWrapPromises[key] = GetGlobal(key).then((data) => {
      if (data !== null) {
        return Promise.resolve(data);
      }

      // if cache miss, call the setFunction to get the new value we want
      return setFunction().then(
        dataToCache => SetGlobal(key, dataToCache, ttl).then(
          () => Promise.resolve(dataToCache)
        )
      );
    });

    // clear out pending Promise once done
    //  we then(), catch(), then() to replicate finally(), which isn't in NodeJS yet
    pendingWrapPromises[key].then().catch().then(() => {
      delete pendingWrapPromises[key];
    });

    // return stored promise
    return pendingWrapPromises[key];
  }

  /**
   * Bulk set cache data
   * @param {Object} data Object of cachekey => data
   * @param {Number|Function} [ttl] How long this data should last in the cache (seconds).
   * Calculated once for bulk query
   */
  SetBulk(data, ttl, ignoreCacheKey = false, stringify = true) {
    return GetDB().then(db => new Promise((resolve, reject) => {
      // if we have no ttl, use our default value
      let timeToLive = ttl;
      if (!timeToLive) {
        timeToLive = Settings.DefaultCacheLength;
      }

      /* process as if a promise, so we can handle ttls passed as functions.
       * abuse Promise.all to succeed regardless of ttl variable type
       * */
      Promise.all([timeToLive]).then((evaluatedTimeToLive) => {
        if (!evaluatedTimeToLive || evaluatedTimeToLive[0] === undefined) {
          return reject(new Error('Failed to get ttl for cacher'));
        }

        // bulk import data
        return db.serialize(() => {
          // wrap this around "begin transaction" so this doesn't take forever!
          db.run('begin transaction');
          const cacheInsertStatement = db.prepare('INSERT OR REPLACE INTO cache (key, value, expires) VALUES (?, ?, ?)');
          const keys = Object.keys(data);
          keys.forEach((key) => {
            cacheInsertStatement.run(
              ignoreCacheKey ? key : this.Prefix + key,
              stringify ? JSON.stringify(data[key]) : data[key],
              ttl[0] + (Math.floor(new Date().getTime() / 1000))
            );
          });
          // commit the inserts
          db.run('commit', () => {
            // finish using the insert statement
            cacheInsertStatement.finalize(() => {
              resolve();
            });
          });
        });
      });
    }));
  }

  /**
   * Bulk get cache data
   * @param {Array} keys Array of keys to fetch
   * @param {Number|Function} [ttl] How long this data should last in the cache (seconds).
   * Calculated once for bulk query
   */
  GetBulk(keys, ignoreCacheKey = false) {
    const inKeys = keys;
    // add our prefix to all the keys unless we're ignoring it (for global bulk gets)
    if (!ignoreCacheKey) {
      inKeys.forEach((key, i) => {
        inKeys[i] = this.Prefix + key;
      });
    }

    return GetDB().then(db => new Promise((resolve, reject) => {
      db.all(`SELECT key, value FROM cache WHERE key IN (${Array(inKeys.length).fill('?').join(', ')})`, inKeys, (err, rows) => {
        if (err) {
          return reject(new Error(`Error bulk fetching keys: ${err}`));
        }

        const returnObj = {};
        rows.forEach((row) => {
          try {
            const JSONData = JSON.parse(row.value);
            returnObj[JSONData.key] = JSONData;
          } catch (JSONParseErr) {
            // TODO - throw error somewhere
          }
        });
        return resolve(returnObj);
      });
    }));
  }
}

// create new cache object and export it
module.exports = Cache;
