"use strict";

const CouchbaseChannelDisney = require("./couchbaseChannelDisney");
const Cache = require("../cache");
const DebugLog = require("../debugPrint.js");

const s_Channel = Symbol();
const s_Cache = Symbol();
const s_Synced = Symbol();
const s_Started = Symbol();
const s_ResortID = Symbol();
const s_FacilityNames = Symbol();
const s_FacilityCacheDBWrite = Symbol();

class FacilityChannel {
    constructor(options = {}) {
        if (options.resort_id === undefined) {
            throw new Error("Must pass a resort_id (eg. wdw) to FacilityChannel constructor");
        }
        this[s_ResortID] = options.resort_id;
        this[s_Synced] = false;

        // build our Couchbase Channel
        this[s_Channel] = new CouchbaseChannelDisney({
            dbName: `facilities_${options.resort_id}`,
            channel: `${options.resort_id}.facilities.${options.version === undefined ? "1_0" : options.version}.${options.version === undefined ? "en_us" : options.version}`
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

        this[s_Started] = false;
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
        if (this[s_Started]) return this[s_Channel].Start();
        this[s_Started] = true;

        return this[s_Channel].Start().then(() => {
            // now we're synced, batch send our data to the cache
            return this.BulkUpdateFacilityData().then(() => {
                // mark ourselves as synced and return
                this[s_Synced] = true;

                return Promise.resolve();
            });
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

    /**
     * (internal) Called by channel when a facility document has been updated
     * @param {Object} doc Updated document
     */
    OnFacilityUpdated(doc) {
        // extract doc ID and entityType
        const capture = regexExtractIDAndType.exec(doc.id);
        if (capture && capture.length > 1) {

            if (!this.Synced) {
                // save to s_FacilityCacheDBWrite object to write later once we're synced
                this[s_FacilityCacheDBWrite].push({
                    id: capture[1],
                    name: doc.name,
                    entityType: capture[2],
                    docKey: doc._id,
                    park_id: Number(TidyDisneyID(doc.ancestorThemeParkId)) || 0,
                    resort_id: Number(TidyDisneyID(doc.ancestorResortId)) || 0,
                    resort_area_id: Number(TidyDisneyID(doc.ancestorResortAreaId)) || 0,
                });
            } else {
                // we're running live, store metadata update
                Cache.DB().then(db => {
                    db.run("INSERT OR REPLACE INTO disneyFacilities (id, name, entityType, docKey, resort_code, park_id, resort_id, resort_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                        capture[1],
                        doc.name,
                        capture[2],
                        doc._id,
                        this[s_ResortID],
                        Number(TidyDisneyID(doc.ancestorThemeParkId)) || 0,
                        Number(TidyDisneyID(doc.ancestorResortId)) || 0,
                        Number(TidyDisneyID(doc.ancestorResortAreaId)) || 0,
                    ], (err) => {
                        if (err) {
                            this.Log(`Error updating live disneyFacilities update: ${err}`);
                        }
                    });
                });
            }

            // remember this facility's name
            this[s_FacilityNames][capture[1]] = doc.name;
        } else {
            this.Log(`Error reading ID foc facility: ${doc.id} / ${doc._id}`);
        }
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
    GetFacilitiesData(facilityIDs, filters = {}) {
        // make sure we're initialised first
        return this.Start().then(() => {
            // get the raw DB handler so we can make a SQL JOIN
            return Cache.DB().then((db) => {
                return new Promise((resolve, reject) => {
                    const SQLValues = [];

                    for (let i = 0; i < facilityIDs.length; i++) {
                        SQLValues.push(TidyDisneyID(facilityIDs[i]));
                    }

                    const filterSQLs = ["C.dbName = ?"];
                    SQLValues.push("facilities_" + this[s_ResortID]);
                    for (let key in filters) {
                        filterSQLs.push(`F.${key} = ?`);
                        SQLValues.push(filters[key]);
                    }

                    const SQL = `SELECT C.body FROM disneyFacilities AS F INNER JOIN couchbasesync AS C ON C.id = F.docKey WHERE F.id IN (${Array(facilityIDs.length).fill("?").join(", ")}) AND ${filterSQLs.join(" AND ")};`

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
                                this[s_FacilityNames][TidyDisneyID(JSONData.id)] = JSONData.name;
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

    /**
     * Get the name of a facility, given it's Disney API ID
     */
    GetFacilityName(facilityID) {
        const tidyID = TidyDisneyID(facilityID);

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

const regexTidyID = /^([^;]+)/;
const regexExtractIDAndType = /^([^;]+);entityType=([^;:]+)/;

function TidyDisneyID(id) {
    const capture = regexTidyID.exec(id);
    if (capture && capture.length > 1) {
        return capture[1];
    }
    return id;
}

module.exports = FacilityChannel;

if (!module.parent) {
    // setup facility channel
    const Fac = new FacilityChannel({
        resort_id: "wdw"
    });

    Fac.Start().then(() => {
        console.log("Start 1");
        // get Magic Kingdom's name
        Fac.GetFacilityName(80007944).then((name) => {
            console.log(name);
            return Fac.GetFacilityName(80007944).then((name) => {
                console.log(name);
            });
        }).catch(e => {
            console.error(e);
        });
    });

    Fac.Start().then(() => {
        console.log("Start 2");
        Fac.Start().then(() => {
            // get Magic Kingdom's name
            Fac.GetFacilityName(80007944).then((name) => {
                console.log(name);
                return Fac.GetFacilityName(80007944).then((name) => {
                    console.log(name);
                });
            }).catch(e => {
                console.error(e);
            });
        });
    });
}