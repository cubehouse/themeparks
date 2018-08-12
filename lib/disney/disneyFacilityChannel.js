const Moment = require('moment-timezone');
const CouchbaseChannelDisney = require('./couchbaseChannelDisney');
const Cache = require('../cache');
const DebugLog = require('../debugPrint.js');
const DisneyUtil = require('./disneyUtil');

const sChannel = Symbol('Channel');
const sCache = Symbol('Cache');
const sSynced = Symbol('Synced Status');
const sStarted = Symbol('Stated Status');
const sResortID = Symbol('Resort ID');
const sFacilityNames = Symbol('Facility Name Cache');
const sFacilityCacheDBWrite = Symbol('Cached Facility Database Writes');
const sCalendarDBWrite = Symbol('Cached Calendar Database Writes');
const sStartPromise = Symbol('Start() Promise');
const sUseOffline = Symbol('Use this channel offline');

function CalendarDocDate(doc) {
  const today = Moment();

  const docDate = Moment(`${today.format('YYYY')}-${doc.id}`, 'YYYY-DD-MM');
  // if this date occured before today, this is actually for next year!
  if (docDate.isBefore(today, 'day')) {
    docDate.add(1, 'year');
  }

  return docDate.format('YYYY-MM-DD');
}

class FacilityChannel {
  constructor(options = {}) {
    if (options.resortId === undefined) {
      throw new Error('Must pass a resortId (eg. wdw) to FacilityChannel constructor');
    }
    this[sResortID] = options.resortId;
    this[sSynced] = false;

    this[sUseOffline] = options.useOffline || false;

    const locale = options.locale !== undefined ? options.locale : 'en_us';
    const version = options.version !== undefined ? options.version : '1_0';

    // build our Couchbase Channel
    this[sChannel] = new CouchbaseChannelDisney({
      dbName: `facilities_${options.resortId}`,
      // subscribe to facilities and calendar entries
      channel: `${options.resortId}.facilities.${version}.${locale},${options.resortId}.calendar.${version}`,
    });

    // subscribe to facility updates
    this[sChannel].on('updated', this.OnFacilityUpdated.bind(this));
    this[sChannel].on('error', this.Log.bind(this));

    // setup our own cache object to store our metadata
    this[sCache] = new Cache({
      prefix: `facilitychannel_${options.resortId}`,
    });

    // build a memory cache of facility names
    this[sFacilityNames] = {};
    // when we're fetching initial state, we want store our data in one batch
    //  otherwise when we're getting a large initial payload, it will slow down disk IO too much
    //  store these until we're synced, then batch send them to the cache
    this[sFacilityCacheDBWrite] = [];
    this[sCalendarDBWrite] = [];

    this[sStarted] = false;
  }

  /**
   * Get this facility channel's cache object
   */
  get Cache() {
    return this[sCache];
  }

  /**
   * Is this channel synced?
   */
  get Synced() {
    return this[sSynced];
  }

  /**
   * Setup this channel. Returns a Promise when synced and fetching live updates.
   */
  Start() {
    if (this[sSynced] || this[sUseOffline]) return Promise.resolve();

    // return start Promise if one already exists
    if (this[sStartPromise] !== undefined) {
      return this[sStartPromise];
    }

    // start channel, then bulk store new docs before marking as synced
    this[sStartPromise] = this[sChannel].Start().then(this.BulkUpdateFacilityData.bind(this)).then(this.BulkUpdateCalendarData.bind(this)).then(() => {
      // mark ourselves as synced and return
      this[sSynced] = true;

      return Promise.resolve();
    });

    return this[sStartPromise];
  }

  BulkUpdateFacilityData() {
    // skip if we have no data to bulk write
    if (this[sFacilityCacheDBWrite].length === 0) {
      this.Log('No new facility data to bulk write to DB, skipping write');
      return Promise.resolve();
    }

    return Cache.DB().then(db => new Promise((resolve) => {
      // bulk import data
      db.serialize(() => {
        // wrap this around "begin transaction" so this doesn't take forever!
        db.run('begin transaction');
        const cacheInsertStatement = db.prepare('INSERT OR REPLACE INTO disneyFacilities (id, name, entityType, docKey, resort_code, park_id, resort_id, resort_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

        this.Log(`Bulk updating ${this[sFacilityCacheDBWrite].length} documents from initial state`);

        this[sFacilityCacheDBWrite].forEach((q) => {
          cacheInsertStatement.run(q.id, q.name, q.entityType, q.docKey, this[sResortID], q.park_id, q.resort_id, q.resort_area_id);
        });

        // commit the inserts
        db.run('commit', () => {
          // finish using the insert statement
          cacheInsertStatement.finalize(() => {
            // clear out cache write
            this[sFacilityCacheDBWrite] = [];

            resolve();
          });
        });
      });
    }));
  }

  BulkUpdateCalendarData() {
    // skip if we have no data to bulk write
    if (this[sCalendarDBWrite].length === 0) {
      this.Log('No new calendar data to bulk write to DB, skipping write');
      return Promise.resolve();
    }

    return Cache.DB().then(db => new Promise((resolve) => {
      // bulk import data
      db.serialize(() => {
        // wrap this around "begin transaction" so this doesn't take forever!
        db.run('begin transaction');
        const cacheInsertStatement = db.prepare('INSERT OR REPLACE INTO disneyCalendar (date, docKey, resort_code) VALUES (?, ?, ?)');

        this.Log(`Bulk updating ${this[sCalendarDBWrite].length} calendar documents from initial state`);

        this[sCalendarDBWrite].forEach((q) => {
          cacheInsertStatement.run(q.date, q.docKey, this[sResortID]);
        });

        // commit the inserts
        db.run('commit', () => {
          // finish using the insert statement
          cacheInsertStatement.finalize(() => {
            // clear out cache write
            this[sCalendarDBWrite] = [];

            resolve();
          });
        });
      });
    }));
  }

  /**
   * (internal) Called by channel when a facility document has been updated
   * @param {Object} doc Updated document
   */
  OnFacilityUpdated(doc) {
    // detect if this is a facility doc or calendar
    let facilityDoc = false;
    let calendarDoc = false;
    for (let i = 0; i < doc.channels.length; i += 1) {
      if (doc.channels[i].indexOf('.facilities.') >= 0) {
        facilityDoc = true;
        break;
      } else if (doc.channels[i].indexOf('.calendar.') >= 0) {
        calendarDoc = true;
        break;
      }
    }

    if (facilityDoc) {
      const idAndType = DisneyUtil.ExtractIDAndType(doc.id);

      // this is a facility doc
      if (!this.Synced) {
        // save to s_FacilityCacheDBWrite object to write later once we're synced
        this[sFacilityCacheDBWrite].push({
          id: idAndType.id,
          name: doc.name,
          entityType: idAndType.type,
          /* eslint-disable no-underscore-dangle */
          docKey: doc._id,
          /* eslint-enable no-underscore-dangle */
          park_id: Number(DisneyUtil.CleanID(doc.ancestorThemeParkId)) || 0,
          resort_id: Number(DisneyUtil.CleanID(doc.ancestorResortId)) || 0,
          resort_area_id: Number(DisneyUtil.CleanID(doc.ancestorResortAreaId)) || 0,
        });
      } else {
        // we're running live, store metadata update
        this.StoreFacilityDocSingle(doc);
      }

      // remember this facility's name
      this[sFacilityNames][idAndType.id] = doc.name;
    } else if (calendarDoc) {
      // matched a calendar entry! insert into DB
      if (!this.Synced) {
        this[sCalendarDBWrite].push({
          date: CalendarDocDate(doc),
          /* eslint-disable no-underscore-dangle */
          docKey: doc._id,
          /* eslint-enable no-underscore-dangle */
        });
      } else {
        this.StoreCalendarDocSingle(doc);
      }
    } else {
      /* eslint-disable no-underscore-dangle */
      this.Log(`Error reading ID foc facility: ${doc.id} / ${doc._id}`);
      /* eslint-enable no-underscore-dangle */
    }
  }

  StoreFacilityDocSingle(doc) {
    const idAndType = DisneyUtil.ExtractIDAndType(doc.id);

    Cache.DB().then((db) => {
      db.run('INSERT OR REPLACE INTO disneyFacilities (id, name, entityType, docKey, resort_code, park_id, resort_id, resort_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        idAndType.id,
        doc.name,
        idAndType.type,
        /* eslint-disable no-underscore-dangle */
        doc._id,
        /* eslint-enable no-underscore-dangle */
        this[sResortID],
        Number(DisneyUtil.CleanID(doc.ancestorThemeParkId)) || 0,
        Number(DisneyUtil.CleanID(doc.ancestorResortId)) || 0,
        Number(DisneyUtil.CleanID(doc.ancestorResortAreaId)) || 0,
      ], (err) => {
        if (err) {
          this.Log(`Error updating live disneyFacilities update: ${err}`);
        }
      });
    });
  }

  StoreCalendarDocSingle(doc) {
    Cache.DB().then((db) => {
      // figure out doc date from ID
      const docDate = CalendarDocDate(doc);

      db.run('INSERT OR REPLACE INTO disneyCalendar (date, docKey, resort_code) VALUES (?, ?, ?)', [
        docDate,
        /* eslint-disable no-underscore-dangle */
        doc._id,
        /* eslint-enable no-underscore-dangle */
        this[sResortID],
      ], (err) => {
        if (err) {
          this.Log(`Error updating live disneyCalendar update: ${err}`);
        }
      });
    });
  }

  /**
   * Get the facility doc for the given Disney facility ID
   * @param {String} facilityID
   */
  GetFacilityData(facilityID, filters = {}) {
    return this.GetFacilitiesData([facilityID], filters).then(results => Promise.resolve(results && results.length ? results[0] : null));
  }

  /**
   * Get the facility doc for the given Disney facility IDs
   * @param {String[]} facilityIDs Array of facility IDs to get
   * @param {Object} filters Object of key -> value filters to apply to the database (eg. park_id)
   */
  GetFacilitiesData(facilityIDs = [], filters = {}) {
    // make sure we're initialised first
    return this.Start().then(() => Cache.DB().then(db => new Promise((resolve, reject) => {
      const SQLValues = [`facilities_${this[sResortID]}`];
      const filterSQLs = ['C.dbName = ?'];

      if (facilityIDs.length) {
        filterSQLs.push(`F.id IN (${Array(facilityIDs.length).fill('?').join(', ')})`);
        facilityIDs.forEach((id) => {
          SQLValues.push(DisneyUtil.CleanID(id));
        });
      }

      Object.keys(filters).forEach((key) => {
        if (filters[key].operator !== undefined && filters[key].value !== undefined) {
          filterSQLs.push(`F.${key} ${filters[key].operator} ?`);
          SQLValues.push(filters[key].value);
        } else {
          filterSQLs.push(`F.${key} = ?`);
          SQLValues.push(filters[key]);
        }
      });

      const SQL = `SELECT C.body FROM disneyFacilities AS F INNER JOIN couchbasesync AS C ON C.id = F.docKey WHERE ${filterSQLs.join(' AND ')};`;

      db.all(SQL, SQLValues, (err, rows) => {
        if (err) {
          return reject(new Error(`Error getting cached facility datas from channel: ${err}`));
        }

        if (!rows) {
          return Promise.resolve([]);
        }

        const results = [];
        const errors = [];
        rows.forEach((row) => {
          // parse response
          let JSONData = null;
          try {
            JSONData = JSON.parse(row.body);

            results.push(JSONData);

            // if we've successfully parsed this doc, use this opportunity to cache the facility's name
            this[sFacilityNames][DisneyUtil.CleanID(JSONData.id)] = JSONData.name;
          } catch (e) {
            errors.push(new Error(`Unable to parse JSON object for a facility. ${row.body} :: ${e}`));
          }
        });

        if (errors.length) {
          return reject(errors);
        }

        return resolve(results);
      });
    })));
  }

  GetCalendarDates(dates = [], filters = {}) {
    if (dates.length === 0) return Promise.resolve([]);

    return this.Start().then(() => Cache.DB().then(db => new Promise((resolve, reject) => {
      const SQLValues = [`facilities_${this[sResortID]}`];
      const filterSQLs = ['C.dbName = ?'];

      if (dates.length) {
        filterSQLs.push(`X.date IN (${Array(dates.length).fill('?').join(', ')})`);
        dates.forEach((date) => {
          SQLValues.push(date);
        });
      }

      Object.keys(filters).forEach((key) => {
        filterSQLs.push(`F.${key} = ?`);
        SQLValues.push(filters[key]);
      });

      const SQL = `SELECT C.body FROM disneyCalendar AS X INNER JOIN couchbasesync AS C ON C.id = X.docKey WHERE ${filterSQLs.join(' AND ')};`;

      db.all(SQL, SQLValues, (err, rows) => {
        if (err) {
          return reject(new Error(`Error getting cached calendar datas from channel: ${err}`));
        }

        if (!rows) {
          return Promise.resolve([]);
        }

        const results = [];
        const errors = [];
        rows.forEach((row) => {
          // parse response
          let JSONData = null;
          try {
            JSONData = JSON.parse(row.body);

            // add calendar date to results
            JSONData.parsedDate = CalendarDocDate(JSONData);

            results.push(JSONData);
          } catch (e) {
            errors.push(new Error(`Unable to parse JSON object for a calendar. ${row.body} :: ${e}`));
          }
        });

        if (errors.length) {
          return reject(errors);
        }

        return resolve(results);
      });
    })));
  }

  /**
   * Get the name of a facility, given it's Disney API ID
   */
  GetFacilityName(facilityID) {
    const tidyID = DisneyUtil.CleanID(facilityID);

    if (this[sFacilityNames][tidyID] !== undefined) {
      // we already have this cached in memory, so return it
      return Promise.resolve(this[sFacilityNames][tidyID]);
    }
    // not cached already, fetch
    return new Promise((resolve, reject) => Cache.DB().then((db) => {
      db.get('SELECT name FROM disneyFacilities WHERE id = ?', [tidyID], (err, row) => {
        if (err) {
          return reject(err);
        }

        if (row) {
          this[sFacilityNames][tidyID] = row.name;
          return resolve(row.name);
        }
        return resolve('?');
      });
    }));
  }

  /**
   * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
   * @param {...*} ToPrint Objects/strings to print
   * */
  Log(...args) {
    return DebugLog.apply(null, [`${this.constructor.name}:`, ...args]);
  }
}

module.exports = FacilityChannel;
