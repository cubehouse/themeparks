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
            this[s_Synced] = true;
            return Promise.resolve();
        });
    }

    /**
     * (internal) Called by channel when a facility document has been updated
     * @param {Object} doc Updated document
     */
    OnFacilityUpdated(doc) {
        // tidy up id
        const docID = TidyDisneyID(doc.id);

        // TODO - store cache of doc IDs to names for easy access

        // store a metadata reference of this object's clean Disney ID to it's channel object
        this.Cache.Set(docID, this[s_Channel].Cache.Prefix + "doc_" + doc._id, docCacheTime, false);

        // remember this facility's name
        this[s_FacilityNames][docID] = doc.name;
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
                    db.get("SELECT C2.key, C2.value FROM cache AS C1 INNER JOIN cache AS C2 ON C2.key = trim(C1.value,'\"') WHERE C1.key = ?;", [this.Cache.Prefix + tidyID], (err, row) => {
                        if (err) {
                            return reject(`Error getting cached facility data from channel for ${facilityID}: ${err}`);
                        }

                        // parse response
                        let JSONData = null;
                        try {
                            JSONData = JSON.parse(row.value);

                            // if we've successfully parsed this doc, use this opportunity to cache the facility's name
                            this[s_FacilityNames][tidyID] = JSONData.name;
                        } catch (e) {
                            this.Log(`Unable to parse JSON object for facility ${facilityID}`);
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
        Fac.GetFacilityName(80007944).then((name) => {
            console.log(name);
        });
    });
}