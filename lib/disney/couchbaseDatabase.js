"use strict";

const EventEmitter = require("events");

const crypto = require("crypto");
const needle = require("needle");
const uuid = require("uuid/v4");

const Cache = require("../cache");

const s_cache = Symbol();
const s_baseURL = Symbol();
const s_channel = Symbol();
const s_authHeader = Symbol();
const s_privateUUID = Symbol();
const s_lastSequence = Symbol();
const s_lastSequenceRevision = Symbol();
const s_longPollActive = Symbol();
const s_longPollFunction = Symbol();
const s_longPollErrorTimeout = Symbol();
const s_documentBodyFetchQueue = Symbol();

const docCacheTime = 60 * 60 * 24 * 30 * 12 * 10; // 10 years in seconds
// current (< 2.x) User-Agent
//  https://github.com/couchbase/couchbase-lite-android/blob/5bffb9f80db52946b543d6dec03f1cb2d7b6de50/shared/src/main/java/com/couchbase/lite/internal/replicator/CBLWebSocket.java#L351
const CouchbaseLiteUserAgent = "CouchbaseLite/1.3 (1.4.0/0cad2e32ad20b70332717bc42c4e56c1fa41393d)";
// >= 2.x User-Agent https://github.com/couchbase/couchbase-lite-android/blob/8683fedd2354323a86fe2143b014c904acdf3ed2/shared/src/main/java/com/couchbase/lite/ReplicatorConfiguration.java#L263

function DoLongPoll() {
    // first, get our last sequence ID
    this.GetLastSequence().then((lastSequenceID) => {
        // start long-polling for new changes...
        return needle("POST", `${this.BaseURL}/_changes?feed=longpoll&heartbeat=30000&style=all_docs&since=${lastSequenceID}&active_only=true&filter=sync_gateway%2Fbychannel`, {
            "channels": this[s_channel],
            "style": "all_docs",
            "filter": "sync_gateway/bychannel",
            "feed": "longpoll",
            "heartbeat": 30000,
            //"active_only": true,
            "since": lastSequenceID
        }, {
            json: true,
            headers: this.HTTPHeaders
        }).then((resp) => {
            // check for success
            if (resp.statusCode != 200) {
                return Promise.reject(`HTTP ${resp.body.error}`);
            } else if (!resp.body.results) {
                return Promise.reject("No long-poll results");
            } else {
                //console.log(JSON.stringify(resp.body, null, 2));

                // get full doc revisions
                return this.ProcessDocChanges(resp.body.results).then(() => {
                    // got the full doc revisions! store sequence and continue polling
                    if (!resp.body.last_seq) {
                        return Promise.reject(`No last_seq found: ${JSON.stringify(resp.body)}`);
                    }

                    // store new sequence number
                    return this.SetLastSequence(resp.body.last_seq).then(() => {
                        // successs! restart Longpoll next tick
                        process.nextTick(this[s_longPollFunction]);

                        // reset error timeout time
                        this[s_longPollErrorTimeout] = 0;
                    });
                });
            }
        });
    }).catch((err) => {
        // extend error timeout time
        if (this[s_longPollErrorTimeout] == 0) {
            // start at 10 seconds
            this[s_longPollErrorTimeout] = 10;
        } else {
            // double, until we get to 5 minutes
            this[s_longPollErrorTimeout] = Math.min(this[s_longPollErrorTimeout] * 2, 60 * 5);
        }

        // emit error
        this.emit("error", `Long-Polling error: ${err} (starting long-poll again in ${this[s_longPollErrorTimeout]} seconds}`);

        // restart long-poll for more changes in 10 seconds
        setTimeout(this[s_longPollFunction], this[s_longPollErrorTimeout] * 1000);
    });
}

/**
 * A very basic implementation of Couchbase Lite
 * Pull-only
 */
class CouchbaseLiteDatabase extends EventEmitter {

    constructor(url, dbName, channel) {
        super();

        if (!url) throw new Error("No Couchbase Lite Sync Gateway supplied");
        if (!channel) throw new Error("No Couchbase Lite channel supplied");

        this[s_baseURL] = url;
        this[s_channel] = channel;

        // setup our cache object
        this[s_cache] = new Cache({
            prefix: `couchdb_${dbName}`
        });

        this[s_lastSequence] = 0;
        this[s_lastSequenceRevision] = "";

        // track if we're already long-polling
        this[s_longPollActive] = false;
        // setup a private long-poll function bound to this object
        this[s_longPollFunction] = DoLongPoll.bind(this);
        // error timeout (this will increase with subsequent errors)
        this[s_longPollErrorTimeout] = 0;

        // queue of document IDs we want to fetch (they have changes we need to get)
        this[s_documentBodyFetchQueue] = [];
    }

    /**
     * Generate a random UUID in Couchbase-Lite format
     */
    static GenerateUUID() {
        // https://github.com/couchbase/couchbase-lite-net/blob/995053a919d30ec59a0d03e680160aca191018f5/src/Couchbase.Lite.Shared/Util/Misc.cs#L44
        const buffer = new Buffer(new Array(16));
        uuid(null, buffer, 0);
        return "-" + buffer.toString("base64").replace(/\//g, "_").replace(/\+/g, "-").substring(0, 22);
    }

    /**
     * Generate a checkpoint ID from a private UUID string
     * @param {String} uuid 
     */
    static GenerateCheckpointID(uuid) {
        // https://github.com/couchbase/couchbase-lite-core/blob/579a0068ee001fcdfd7c2a0bb14f7b5f73caeeca/Replicator/DBWorker.cc#L160
        // couchbase-lite uses fleece to build a SHA1 digest out of a private UUID and various other values
        //  BUT, I can't get fleece for nodejs, so I can't replicate this perfectly
        //  HOWEVER, since my private UUID will be random and unknown to anybody else, you can't know this isn't a real couchbase-lite client

        return crypto.createHash("sha1").update(uuid).digest("hex");
    }

    /**
     * The base URL used for this Database
     */
    get BaseURL() {
        return this[s_baseURL];
    }

    /**
     * The last sequence this database was synced to
     */
    get LastSequence() {
        return this[s_lastSequence];
    }

    /**
     * Authentication
     */
    set Auth(value) {
        if (value && value.user && value.password) {
            this[s_authHeader] = "Basic " + Buffer.from(value.user + ":" + value.password).toString("base64");
        } else {
            this[s_authHeader] = null;
        }
    }

    /**
     * HTTP headers being used for this Database
     */
    get HTTPHeaders() {
        return {
            Authorization: this[s_authHeader] || null,
            "User-Agent": CouchbaseLiteUserAgent
        };
    }

    /**
     * Get this Database's Cache object
     */
    get Cache() {
        return this[s_cache];
    }

    /**
     * Get this database's private UUID
     */
    GetPrivateUUID() {
        if (!this[s_privateUUID]) {
            // search our local cache for a previously generated UUID
            return this.Cache.Wrap("UUID_Private", () => {
                // no UUID in cache, generate a new one
                return Promise.resolve(CouchbaseLiteDatabase.GenerateUUID());
            }).then((cachedID) => {
                this[s_privateUUID] = cachedID;
                return Promise.resolve(cachedID);
            });
        } else {
            return Promise.resolve(this[s_privateUUID]);
        }
    }

    /**
     * Get this database's checkpoint ID
     */
    GetCheckpointID() {
        return this.GetPrivateUUID().then(ID => {
            return CouchbaseLiteDatabase.GenerateCheckpointID(ID);
        });
    }

    /**
     * Get last sequence ID
     */
    GetLastSequence() {
        // get our checkpoint ID
        return this.GetCheckpointID().then(checkpointID => {
            // fetch our checkpoint ID's document
            return needle("GET", `${this.BaseURL}/_local/${checkpointID}`, null, {
                headers: this.HTTPHeaders
            }).then((resp) => {
                if (resp.statusCode == 404) {
                    // document doesn't exist! return 0 as our last sequence
                    return 0;
                } else {
                    // we have a document! validate it
                    if (resp.body && resp.body.lastSequence !== undefined) {
                        // store last sequence and revision number
                        this[s_lastSequence] = resp.body.lastSequence;
                        this[s_lastSequenceRevision] = resp.body._rev;

                        // return lastSequence stored on server
                        return Promise.resolve(this.LastSequence);
                    } else {
                        return Promise.reject(`Failed to find lastSequence in response: ${JSON.stringify(resp.body)}`);
                    }
                }
            });
        });
    }

    /**
     * Update the last sequence number we have synced to, both locally and in the couchbase-lite sync gateway
     */
    SetLastSequence(newLastSequence) {
        // get our checkpoint ID
        return this.GetCheckpointID().then(checkpointID => {
            // store out new sequence
            return needle("PUT", `${this.BaseURL}/_local/${checkpointID}`, {
                // WDW appears to store these as strings, so follow suit (we parse back to number in GetLastSequence)
                lastSequence: newLastSequence.toString(),
                _rev: this[s_lastSequenceRevision]
            }, {
                json: true,
                headers: this.HTTPHeaders
            }).then((resp) => {
                if (resp.statusCode == 409) {
                    return Promise.reject(`Conflict error storing lastSequence: ${resp.statusCode} ${resp.body.error}`);
                } else if (resp.statusCode != 201) {
                    return Promise.reject(`Error storing lastSequence: ${resp.statusCode}`);
                } else {
                    if (resp.body && resp.body.ok) {
                        // success!
                        return Promise.resolve();
                    } else {
                        if (resp.body && resp.body.error && resp.body.reason) {
                            return Promise.reject(`Failed to store lastSequence: ${resp.body.error}: ${resp.body.reason}`);
                        } else {
                            return Promise.reject("Failed to store lastSequence");
                        }
                    }
                }
            });
        });
    }

    /**
     * Start database puller
     */
    Start() {
        if (this[s_longPollActive]) return;
        this[s_longPollActive] = true;

        // get initial state before starting to long-poll
        this.GetInitialState().then(() => {
            // start longpoll-ing
            process.nextTick(this[s_longPollFunction]);
        }).catch((err) => {
            this.emit("error", `Error getting initial state: ${err}`);

            // try again in a minute
            setTimeout(this.Start, 60 * 1000);
        });
    }

    /**
     * Get initial database state
     */
    GetInitialState() {
        // first, get our last sequence ID
        return this.GetLastSequence().then((lastSequenceID) => {
            return needle("POST", `${this.BaseURL}/_changes?feed=normal&heartbeat=30000&style=all_docs&filter=sync_gateway%2Fbychannel`, {
                "channels": this[s_channel],
                "style": "all_docs",
                "filter": "sync_gateway/bychannel",
                "feed": "normal",
                "heartbeat": 30000,
                "since": lastSequenceID
            }, {
                json: true,
                headers: this.HTTPHeaders
            }).then((resp) => {
                if (resp.statusCode != 200) {
                    return Promise.reject(`Initial state status code: ${resp.statusCode} [${JSON.stringify(resp.body)}]`);
                } else if (!resp.body) {
                    return Promise.reject(`Error getting initial state body: ${resp.statusCode}`);
                }

                // fetch all document bodies
                return this.ProcessDocChanges(resp.body.results).then(() => {
                    // if processing docs succeeds, update our sequence ID
                    return this.SetLastSequence(resp.body.last_seq);
                });
            });
        });
    }

    /**
     * Process new/deleted document revisions
     */
    ProcessDocChanges(documents) {
        // build up POST data to request docs
        const docRequest = [];
        const cacheDocIds = [];
        for (let i = 0, doc; doc = documents[i++];) {
            if (doc.deleted) {
                // TODO - remove document from database

                // emit document deleted event
                this.emit("deleted", doc);
            } else {
                // we have a document update! push to our list ready to fetch
                if (doc.changes && doc.changes.length) {
                    cacheDocIds.push("doc_" + doc.id);

                    docRequest.push({
                        atts_since: null,
                        rev: doc.changes[0].rev,
                        id: doc.id
                    });
                }
            }
        }

        // early out if no docs were updated
        if (cacheDocIds.length == 0) {
            return Promise.resolve([]);
        }

        // get existing documents so we can see if they have actually changed
        return this.Cache.GetBulk(cacheDocIds).then((oldDocs) => {
            // fetch updated documents
            return this.FetchDocuments(docRequest).then((docs) => {
                // emit new documents
                for (let i = 0, doc; doc = docs[i++];) {
                    // emit new (and old doc)
                    if (oldDocs[doc._id] !== undefined) {
                        // check the revision has changed
                        if (oldDocs[doc._rev] != doc._rev) {
                            // revisions don't match! emit updated event
                            this.emit("updated", doc, oldDocs[doc._id]);
                        }
                    } else {
                        // couldn't find previously cached version of document, emit new event
                        this.emit("updated", doc);
                    }
                }

                return Promise.resolve(docs);
            });
        });
    }

    /** 
     * Fetch full documents from live db
     *  docRequest is an array of objects:
     *  {rev: doc revision, id: doc ID}
     */
    FetchDocuments(docRequest) {
        // make sure atts_since is set
        for (let i = 0; i < docRequest.length; i++) {
            if (docRequest[i] === undefined) {
                docRequest[i].atts_since = null;
            }
        }

        // we need to POST as JSON, but receive as multipart data (!?)
        //  so, manually set headers rather than let Needle handle JSON for us
        const headers = this.HTTPHeaders;
        headers["Content-Type"] = "application/json";
        headers["Accept"] = "multipart/related";

        return needle("POST", `${this.BaseURL}/_bulk_get?revs=true&attachments=true`, {
            docs: docRequest
        }, {
            headers
        }).then((resp) => {
            // parse out multipart/related data returned
            const boundaryMatch = /boundary="([^"]+)"/.exec(resp.headers["content-type"]);
            if (boundaryMatch && boundaryMatch[1]) {
                const regexString = `${boundaryMatch[1]}\\s*Content-Type:\\s+application\\/json\\s*(.*)`;
                const regexSplit = new RegExp(regexString, "g");

                const respBody = resp.body.toString();

                const JSONResponses = [];

                // parse JSON data from response
                let JSONMatch;
                while ((JSONMatch = regexSplit.exec(respBody)) !== null) {
                    let JSONData;
                    try {
                        JSONData = JSON.parse(JSONMatch[1]);

                        // push data to our response array
                        JSONResponses.push(JSONData);
                    } catch (e) {
                        this.emit("error", `Error parsing couchbase JSON response: ${JSONMatch}: ${e}`);
                    }
                }

                // build object to send to cache library to bulk store
                const docsToCache = {};
                for (let i = 0; i < JSONResponses.length; i++) {
                    docsToCache["doc_" + JSONResponses[i]._id] = JSONResponses[i];
                }

                // set new documents in the cache in one go
                return this.Cache.SetBulk(docsToCache, docCacheTime).then(() => {
                    return Promise.resolve(JSONResponses);
                });
            }

            return Promise.reject(`Failed to fetch documents: ${resp.statusCode}`);
        });
    }
}

//const test = new CouchbaseLiteDatabase("http://192.168.0.12:4984/hello", "C#");

const test = new CouchbaseLiteDatabase("https://realtime-sync-gw.wdprapps.disney.com/park-platform-pub", "ridestatus", "wdw.facilitystatus.1_0");
test.Auth = {
    user: "WDPRO-MOBILE.MDX.WDW.ANDROID-PROD",
    password: "ieNgak4ahph5th",
};

test.on("error", (err) => {
    console.error("Event Error: " + err);
});

test.on("updated", (doc) => {
    console.log("*** DOC UPDATED ***");
    //console.log(doc);
    console.log(`Ride ${parseInt(doc.id, 10)} => ${doc.waitMinutes}`);
});

test.on("deleted", (doc) => {
    console.log("*** DOC DELETED ***");
    console.log(doc);
});

//test.Start();
//test.GetInitialState();

module.exports = CouchbaseLiteDatabase;