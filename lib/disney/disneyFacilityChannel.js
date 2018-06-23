"use strict";

const CouchbaseChannel = require("./couchbaseDatabase");
const DisneyDBSettings = require("./disneyCouchbaseSettings");
const Cache = require("../cache");
const DebugLog = require("../debugPrint.js");

const s_Channel = Symbol();
const s_Cache = Symbol();
const s_Synced = Symbol();
const s_ParkID = Symbol();
const s_FacilityNames = Symbol();
const s_FacilityCacheDBWrite = Symbol();

const docCacheTime = 60 * 60 * 24 * 30 * 12 * 10; // 10 years in seconds

class FacilityChannel {
    constructor(park_id) {
        if (park_id === undefined) {
            throw new Error("Must pass a park_id (eg. wdw) to FacilityChannel constructor");
        }
        this[s_ParkID] = park_id;
        this[s_Synced] = false;

        // build our Couchbase Channel
        this[s_Channel] = new CouchbaseChannel(
            DisneyDBSettings.URL,
            `facilities_${park_id}`,
            `${park_id}.facilities.${DisneyDBSettings.FacilitiesVersion}.${DisneyDBSettings.FacilitiesCulture}`
        );
        this[s_Channel].Auth = DisneyDBSettings.Auth;

        // subscribe to facility updates
        this[s_Channel].on("updated", this.OnFacilityUpdated.bind(this));
        this[s_Channel].on("error", this.Log.bind(this));

        // setup our own cache object to store our metadata
        this[s_Cache] = new Cache({
            prefix: `facilitychannel_${park_id}`
        });

        // build a memory cache of facility names
        this[s_FacilityNames] = {};
        // when we're fetching initial state, we want store our data in one batch
        //  otherwise when we're getting a large initial payload, it will slow down disk IO too much
        //  store these until we're synced, then batch send them to the cache
        this[s_FacilityCacheDBWrite] = [];
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
    Initialise() {
        if (this[s_Synced]) return Promise.resolve();

        return this[s_Channel].GetInitialStateThenLongPoll().then(() => {
            // now we're synced, batch send our data to the cache
            return this.BulkUpdateFacilityData().then(() => {
                // mark ourselves as synced and return
                this[s_Synced] = true;

                return Promise.resolve();
            });
        });
    }

    BulkUpdateFacilityData() {
        return Cache.DB().then(db => {
            return new Promise((resolve) => {
                // bulk import data
                db.serialize(() => {
                    // wrap this around "begin transaction" so this doesn't take forever!
                    db.run("begin transaction");
                    const cacheInsertStatement = db.prepare("INSERT OR REPLACE INTO disneyFacilities (id, name, entityType, docKey, park) VALUES (?, ?, ?, ?, ?)");

                    for (let i = 0, q; q = this[s_FacilityCacheDBWrite][i++];) {
                        cacheInsertStatement.run(q.id, q.name, q.entityType, q.docKey, this[s_ParkID]);
                    }

                    // commit the inserts
                    db.run("commit");
                    // finish using the insert statement
                    cacheInsertStatement.finalize(() => {
                        // clear out cache write
                        this[s_FacilityCacheDBWrite] = [];

                        resolve();
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
                    docKey: this[s_Channel].Cache.Prefix + "doc_" + doc._id
                });
            } else {
                // we're running live, store metadata update
                Cache.DB().then(db => {
                    db.run("INSERT OR REPLACE INTO disneyFacilities (id, name, entityType, docKey, park) VALUES (?, ?, ?, ?, ?)", [
                        capture[1],
                        doc.name,
                        capture[2],
                        this[s_Channel].Cache.Prefix + "doc_" + doc._id,
                        this[s_ParkID]
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
    GetFacilityData(facilityID) {
        // make sure we're initialised first
        return this.Initialise().then(() => {
            // get the raw DB handler so we can make a SQL JOIN
            return Cache.DB().then((db) => {
                return new Promise((resolve, reject) => {
                    const tidyID = TidyDisneyID(facilityID);
                    db.get("SELECT C.key, C.value FROM disneyFacilities AS F INNER JOIN cache AS C ON C.key = F.docKey WHERE F.id = ?;", [tidyID], (err, row) => {
                        if (err) {
                            return reject(`Error getting cached facility data from channel for ${facilityID}: ${err}`);
                        }

                        if (!row) {
                            this.Log(`Unable to find facilities data for ${tidyID}`);
                            return Promise.resolve("?");
                        }

                        // parse response
                        let JSONData = null;
                        try {
                            JSONData = JSON.parse(row.value);

                            // if we've successfully parsed this doc, use this opportunity to cache the facility's name
                            this[s_FacilityNames][tidyID] = JSONData.name;
                        } catch (e) {
                            return reject(`Unable to parse JSON object for facility ${facilityID} :: ${row.value}`);
                        }
                        return resolve(JSONData);
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
            return this.GetFacilityData(tidyID).then((doc) => {
                return Promise.resolve(doc.name);
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
const regexExtractIDAndType = /^([^;]+);entityType=([^;]+)/;

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
    const Fac = new FacilityChannel("wdw");

    // get Magic Kingdom's name
    Fac.GetFacilityName(80007944).then((name) => {
        console.log(name);
        return Fac.GetFacilityName(80007944).then((name) => {
            console.log(name);
        });
    }).catch(e => {
        console.error(e);
    });
}