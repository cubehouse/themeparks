"use strict";

const CouchbasePuller = require("./couchbaseDatabase");
const Cache = require("../cache");

const s_puller = Symbol();
const s_cache = Symbol();

class DisneyCouchbasePuller {
    constructor(channel) {
        // setup puller
        this[s_puller] = new CouchbasePuller("https://realtime-sync-gw.wdprapps.disney.com/park-platform-pub", channel);
        // setup auth for puller
        this[s_puller].Auth = {
            user: "WDPRO-MOBILE.MDX.WDW.ANDROID-PROD",
            password: "ieNgak4ahph5th",
        };

        // setup puller hooks for document updates
        this[s_puller].on("updated", this.OnDocUpdated);
        //this[s_puller].on("deleted", console.log);
        this[s_puller].on("error", console.log);
    }

    /**
     * Callback for "updated" event from our couchbase puller class
     * @param {Object} doc 
     */
    OnDocUpdated(doc) {
        const rideID = CleanRideID(doc.id);
        if (rideID > 0) {
            console.log(`${rideID} => ${doc.waitMinutes}`);
            Cache.DB().then((db) => {
                db.run("INSERT OR REPLACE INTO disneyRides (id, waitMinutes, status, document) VALUES (?, ?, ?, ?)", [rideID, doc.waitMinutes, StatusToInt(doc.status), JSON.stringify(doc)], (err) => {
                    if (err) {
                        console.error(`Error updating database with Disney ride ${doc.id}: ${err}`);
                        return;
                    }
                });
            });
        }
    }

    Start() {
        this[s_puller].Start();
    }
}

function CleanRideID(ride_id) {
    const capture = /^([^;]+)/.exec(ride_id);
    if (capture && capture.length > 1) {
        return Number(capture[1]);
    }
    return ride_id;
}

function StatusToInt(status) {
    if (status == "Operating") return 1;
    else if (status == "Closed") return 0;
    else if (status == "Down") return -1;
    return -2;
}

const test = new DisneyCouchbasePuller("wdw.facilitystatus.1_0");
test.Start();

module.exports = DisneyCouchbasePuller;