"use strict";

const CouchbaseChannelDisney = require("./couchbaseChannelDisney");
const Cache = require("../cache");
const DebugLog = require("../debugPrint.js");
const DisneyUtil = require("./disneyUtil");
const Moment = require("moment-timezone");

const s_Channel = Symbol();
const s_Cache = Symbol();
const s_Synced = Symbol();
const s_Started = Symbol();
const s_ResortID = Symbol();
const s_FacilityNames = Symbol();
const s_FacilityCacheDBWrite = Symbol();
const s_CalendarDBWrite = Symbol();
const s_StartCallbacks = Symbol();

class FacilityChannel {
    constructor(options = {}) {
        if (options.resort_id === undefined) {
            throw new Error("Must pass a resort_id (eg. wdw) to FacilityChannel constructor");
        }
        this[s_ResortID] = options.resort_id;
        this[s_Synced] = false;

        const locale = options.locale !== undefined ? options.locale : "en_us";
        const version = options.version !== undefined ? options.version : "1_0";

        // build our Couchbase Channel
        this[s_Channel] = new CouchbaseChannelDisney({
            dbName: `facilities_${options.resort_id}`,
            // subscribe to facilities and calendar entries
            channel: `${options.resort_id}.facilities.${version}.${locale},${options.resort_id}.calendar.${version}`
        });

        // subscribe to facility updates
        this[s_Channel].on("updated", this.OnFacilityUpdated.bind(this));
        this[s_Channel].on("error", this.Log.bind(this));

        // setup our own cache object to store our metadata
        this[s_Cache] = new Cache({
            prefix: `facilitychannel_${options.resort_id}`
        });

        // build a memory cache of facility names
        this[s_FacilityNames] = {};
        // when we're fetching initial state, we want store our data in one batch
        //  otherwise when we're getting a large initial payload, it will slow down disk IO too much
        //  store these until we're synced, then batch send them to the cache
        this[s_FacilityCacheDBWrite] = [];
        this[s_CalendarDBWrite] = [];

        this[s_Started] = false;

        this[s_StartCallbacks] = [];
    }

    /**
     * Get this facility channel's cache object
     */
    get Cache() {
        return this[s_Cache];
    }

    /**
     * Is this channel synced?
     */
    get Synced() {
        return this[s_Synced];
    }

    /**
     * Setup this channel. Returns a Promise when synced and fetching live updates.
     */
    Start() {
        if (this[s_Synced]) return Promise.resolve();

        // if we've already started, just call Start on channel, so the second attempt doesn't run any further actions
        if (this[s_Started]) {
            return new Promise((resolve) => {
                if (this[s_Synced]) {
                    return resolve();
                }
                this[s_StartCallbacks].push(resolve);
            });
        }
        this[s_Started] = true;

        // start channel, then bulk store new docs before marking as synced
        return this[s_Channel].Start().then(this.BulkUpdateFacilityData.bind(this)).then(this.BulkUpdateCalendarData.bind(this)).then(() => {
            // mark ourselves as synced and return
            this[s_Synced] = true;

            // call any callbacks from further requests for Start
            for (let i = 0; i < this[s_StartCallbacks].length; i++) {
                this[s_StartCallbacks][i]();
            }
            this[s_StartCallbacks] = [];

            return Promise.resolve();
        });
    }

    BulkUpdateFacilityData() {
        // skip if we have no data to bulk write
        if (this[s_FacilityCacheDBWrite].length == 0) {
            this.Log("No new facility data to bulk write to DB, skipping write");
            return Promise.resolve();
        }

        return Cache.DB().then(db => {
            return new Promise((resolve) => {
                // bulk import data
                db.serialize(() => {
                    // wrap this around "begin transaction" so this doesn't take forever!
                    db.run("begin transaction");
                    const cacheInsertStatement = db.prepare("INSERT OR REPLACE INTO disneyFacilities (id, name, entityType, docKey, resort_code, park_id, resort_id, resort_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

                    this.Log(`Bulk updating ${this[s_FacilityCacheDBWrite].length} documents from initial state`);

                    for (let i = 0, q; q = this[s_FacilityCacheDBWrite][i++];) {
                        cacheInsertStatement.run(q.id, q.name, q.entityType, q.docKey, this[s_ResortID], q.park_id, q.resort_id, q.resort_area_id);
                    }

                    // commit the inserts
                    db.run("commit", () => {
                        // finish using the insert statement
                        cacheInsertStatement.finalize(() => {
                            // clear out cache write
                            this[s_FacilityCacheDBWrite] = [];

                            resolve();
                        });
                    });
                });
            });
        });
    }

    BulkUpdateCalendarData() {
        // skip if we have no data to bulk write
        if (this[s_CalendarDBWrite].length == 0) {
            this.Log("No new calendar data to bulk write to DB, skipping write");
            return Promise.resolve();
        }

        return Cache.DB().then(db => {
            return new Promise((resolve) => {
                // bulk import data
                db.serialize(() => {
                    // wrap this around "begin transaction" so this doesn't take forever!
                    db.run("begin transaction");
                    const cacheInsertStatement = db.prepare("INSERT OR REPLACE INTO disneyCalendar (date, docKey, resort_code) VALUES (?, ?, ?)");

                    this.Log(`Bulk updating ${this[s_CalendarDBWrite].length} calendar documents from initial state`);

                    for (let i = 0, q; q = this[s_CalendarDBWrite][i++];) {
                        cacheInsertStatement.run(q.date, q.docKey, this[s_ResortID]);
                    }

                    // commit the inserts
                    db.run("commit", () => {
                        // finish using the insert statement
                        cacheInsertStatement.finalize(() => {
                            // clear out cache write
                            this[s_CalendarDBWrite] = [];

                            resolve();
                        });
                    });
                });
            });
        });
    }

    /**
     * (internal) Called by channel when a facility document has been updated
     * @param {Object} doc Updated document
     */
    OnFacilityUpdated(doc) {
        // detect if this is a facility doc or calendar
        let facilityDoc = false;
        let calendarDoc = false;
        for (let i = 0; i < doc.channels.length; i++) {
            if (doc.channels[i].indexOf(".facilities.") >= 0) {
                facilityDoc = true;
                break;
            } else if (doc.channels[i].indexOf(".calendar.") >= 0) {
                calendarDoc = true;
                break;
            }
        }

        if (facilityDoc) {
            const idAndType = DisneyUtil.ExtractIDAndType(doc.id);

            // this is a facility doc
            if (!this.Synced) {
                // save to s_FacilityCacheDBWrite object to write later once we're synced
                this[s_FacilityCacheDBWrite].push({
                    id: idAndType.id,
                    name: doc.name,
                    entityType: idAndType.type,
                    docKey: doc._id,
                    park_id: Number(DisneyUtil.CleanID(doc.ancestorThemeParkId)) || 0,
                    resort_id: Number(DisneyUtil.CleanID(doc.ancestorResortId)) || 0,
                    resort_area_id: Number(DisneyUtil.CleanID(doc.ancestorResortAreaId)) || 0,
                });
            } else {
                // we're running live, store metadata update
                this.StoreFacilityDocSingle(doc);
            }

            // remember this facility's name
            this[s_FacilityNames][idAndType.id] = doc.name;

        } else if (calendarDoc) {
            // matched a calendar entry! insert into DB
            if (!this.Synced) {
                this[s_CalendarDBWrite].push({
                    date: CalendarDocDate(doc),
                    docKey: doc._id,
                });
            } else {
                this.StoreCalendarDocSingle(doc);
            }

        } else {
            this.Log(`Error reading ID foc facility: ${doc.id} / ${doc._id}`);
        }
    }

    StoreFacilityDocSingle(doc) {
        const idAndType = DisneyUtil.ExtractIDAndType(doc.id);

        Cache.DB().then(db => {
            db.run("INSERT OR REPLACE INTO disneyFacilities (id, name, entityType, docKey, resort_code, park_id, resort_id, resort_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                idAndType.id,
                doc.name,
                idAndType.type,
                doc._id,
                this[s_ResortID],
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
        Cache.DB().then(db => {
            // figure out doc date from ID
            const docDate = CalendarDocDate(doc);

            db.run("INSERT OR REPLACE INTO disneyCalendar (date, docKey, resort_code) VALUES (?, ?, ?)", [
                docDate,
                doc._id,
                this[s_ResortID],
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
        return this.GetFacilitiesData([facilityID], filters).then((results) => {
            return Promise.resolve(results && results.length ? results[0] : null);
        });
    }

    /**
     * Get the facility doc for the given Disney facility IDs
     * @param {String[]} facilityIDs Array of facility IDs to get
     * @param {Object} filters Object of key -> value filters to apply to the database (eg. park_id)
     */
    GetFacilitiesData(facilityIDs = [], filters = {}) {
        // make sure we're initialised first
        return this.Start().then(() => {
            // get the raw DB handler so we can make a SQL JOIN
            return Cache.DB().then((db) => {
                return new Promise((resolve, reject) => {
                    const SQLValues = ["facilities_" + this[s_ResortID]];
                    const filterSQLs = ["C.dbName = ?"];

                    if (facilityIDs.length) {
                        filterSQLs.push(`F.id IN (${Array(facilityIDs.length).fill("?").join(", ")})`);
                        for (let i = 0; i < facilityIDs.length; i++) {
                            SQLValues.push(DisneyUtil.CleanID(facilityIDs[i]));
                        }
                    }

                    for (let key in filters) {
                        filterSQLs.push(`F.${key} = ?`);
                        SQLValues.push(filters[key]);
                    }

                    const SQL = `SELECT C.body FROM disneyFacilities AS F INNER JOIN couchbasesync AS C ON C.id = F.docKey WHERE ${filterSQLs.join(" AND ")};`;

                    db.all(SQL, SQLValues, (err, rows) => {
                        if (err) {
                            return reject(`Error getting cached facility datas from channel: ${err}`);
                        }

                        if (!rows) {
                            return Promise.resolve([]);
                        }

                        const results = [];
                        for (let i = 0, row; row = rows[i++];) {
                            // parse response
                            let JSONData = null;
                            try {
                                JSONData = JSON.parse(row.body);

                                results.push(JSONData);

                                // if we've successfully parsed this doc, use this opportunity to cache the facility's name
                                this[s_FacilityNames][DisneyUtil.CleanID(JSONData.id)] = JSONData.name;
                            } catch (e) {
                                return reject(`Unable to parse JSON object for a facility. ${row.body} :: ${e}`);
                            }
                        }

                        return resolve(results);
                    });
                });
            });
        });
    }

    GetCalendarDates(dates = [], filters = {}) {
        if (dates.length == 0) return Promise.resolve([]);

        return this.Start().then(() => {
            // get the raw DB handler so we can make a SQL JOIN
            return Cache.DB().then((db) => {
                return new Promise((resolve, reject) => {
                    const SQLValues = ["facilities_" + this[s_ResortID]];
                    const filterSQLs = ["C.dbName = ?"];

                    if (dates.length) {
                        filterSQLs.push(`X.date IN (${Array(dates.length).fill("?").join(", ")})`);
                        for (let i = 0; i < dates.length; i++) {
                            SQLValues.push(dates[i]);
                        }
                    }

                    for (let key in filters) {
                        filterSQLs.push(`F.${key} = ?`);
                        SQLValues.push(filters[key]);
                    }

                    const SQL = `SELECT C.body FROM disneyCalendar AS X INNER JOIN couchbasesync AS C ON C.id = X.docKey WHERE ${filterSQLs.join(" AND ")};`;

                    db.all(SQL, SQLValues, (err, rows) => {
                        if (err) {
                            return reject(`Error getting cached calendar datas from channel: ${err}`);
                        }

                        if (!rows) {
                            return Promise.resolve([]);
                        }

                        const results = [];
                        for (let i = 0, row; row = rows[i++];) {
                            // parse response
                            let JSONData = null;
                            try {
                                JSONData = JSON.parse(row.body);

                                // add calendar date to results
                                JSONData._date = CalendarDocDate(JSONData);

                                results.push(JSONData);
                            } catch (e) {
                                return reject(`Unable to parse JSON object for a calendar. ${row.body} :: ${e}`);
                            }
                        }

                        return resolve(results);
                    });
                });
            });
        });
    }

    /**
     * Get the name of a facility, given it's Disney API ID
     */
    GetFacilityName(facilityID) {
        const tidyID = DisneyUtil.CleanID(facilityID);

        if (this[s_FacilityNames][tidyID] !== undefined) {
            // we already have this cached in memory, so return it
            return Promise.resolve(this[s_FacilityNames][tidyID]);
        } else {
            // not cached already, fetch
            return new Promise((resolve, reject) => {
                return Cache.DB().then((db) => {
                    db.get("SELECT name FROM disneyFacilities WHERE id = ?", [tidyID], (err, row) => {
                        if (err) {
                            return reject(err);
                        }

                        if (row) {
                            this[s_FacilityNames][tidyID] = row.name;
                            return resolve(row.name);
                        } else {
                            return resolve("?");
                        }
                    });
                });
            });
        }
    }

    /**
     * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
     * @param {...*} ToPrint Objects/strings to print
     * */
    Log() {
        return DebugLog(`${this.constructor.name}:`, ...arguments);
    }
}

function CalendarDocDate(doc) {
    const today = Moment();

    const docDate = Moment(`${today.format("YYYY")}-${doc.id}`, "YYYY-DD-MM");
    // if this date occured before today, this is actually for next year!
    if (docDate.isBefore(today, "day")) {
        docDate.add(1, "year");
    }

    return docDate.format("YYYY-MM-DD");
}

module.exports = FacilityChannel;