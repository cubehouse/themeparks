const EventEmitter = require('events');

const crypto = require('crypto');
const needle = require('needle');
const uuid = require('uuid/v4');

const Cache = require('../cache');
const DebugLog = require('../debugPrint.js');

const sCache = Symbol('Cache');
const sBaseURL = Symbol('Base Couchbase URL');
const sChannel = Symbol('Channel');
const sAuthHeader = Symbol('Auth Header');
const sPrivateUUID = Symbol('Private UUID');
const sLastSequence = Symbol('Last Sequence ID');
const sLastSequenceRevision = Symbol('Last Sequence Revision');
const sLongPollActive = Symbol('Long Polling Active?');
const sSynced = Symbol('Synced State');
// return a single promise for multiple Start requests before the initialisation completes
const sInitialStatePromise = Symbol('Initial State Promise');
const sLongPollFunction = Symbol('Long Poller');
const sLongPollErrorTimeout = Symbol('Long Poll Timeout');
const sDocumentBodyFetchQueue = Symbol('Document Fetch Queue');
const sForceRefresh = Symbol('Force Refresh');
const sDbName = Symbol('Database Name');
const sEnableLongPoll = Symbol('Long Polling Enabled');
const sEnableRemoteSequence = Symbol('Store Sequence Remotely?');
const sLongPollDelay = Symbol('Long Poll Restart Delay');
const sLongPollTimeout = Symbol('Long Poll Timeout (in ms)');

// size of batches to fetch docs in
const docFetchBatchSize = 500;

// current (< 2.x) User-Agent
//  https://github.com/couchbase/couchbase-lite-android/blob/5bffb9f80db52946b543d6dec03f1cb2d7b6de50/shared/src/main/java/com/couchbase/lite/internal/replicator/CBLWebSocket.java#L351
const CouchbaseLiteUserAgent = 'CouchbaseLite/2.7.1-6 (Java; Android 9) CE/release, Commit/2fb25069+ Core/2.7.1 (6)';
// >= 2.x User-Agent https://github.com/couchbase/couchbase-lite-android/blob/8683fedd2354323a86fe2143b014c904acdf3ed2/shared/src/main/java/com/couchbase/lite/ReplicatorConfiguration.java#L263

function DoLongPoll() {
  // first, get our last sequence ID
  return this.GetLastSequence().then((lastSequenceID) => {
    this.Log(`Starting long-poll from sequence ${lastSequenceID}`);

    return needle('POST', `${this.BaseURL}/_changes?feed=longpoll&heartbeat=30000&style=all_docs&since=${lastSequenceID}&filter=sync_gateway%2Fbychannel`, {
      channels: this[sChannel],
      style: 'all_docs',
      filter: 'sync_gateway/bychannel',
      feed: 'longpoll',
      heartbeat: 30000,
      // "active_only": true,
      since: lastSequenceID,
    }, {
      json: true,
      headers: this.HTTPHeaders,
      response_timeout: this[sLongPollTimeout],
      read_timeout: this[sLongPollTimeout],
    }).then((resp) => {
      // check for success
      if (resp.statusCode !== 200) {
        this.Log(`Long poll returned error code ${resp.statusCode}`);
        return Promise.reject(new Error(`HTTP ${resp.body.error}`));
      }

      if (resp.body.results === undefined) {
        this.Log('Long poll returned no results');
        return Promise.reject(new Error('No long-poll results'));
      }

      this.Log(`Long-poll returned ${resp.body.results.length} updated documents`);

      // skip processing if there are no results
      if (resp.body.results.length > 0) {
        // get full doc revisions
        return this.ProcessDocChanges(resp.body.results).then(() => {
          // got the full doc revisions! store sequence and continue polling
          if (!resp.body.last_seq) {
            return Promise.reject(new Error(`No last_seq found: ${JSON.stringify(resp.body)}`));
          }

          // store new sequence number
          return this.SetLastSequence(resp.body.last_seq).then(() => {
            // reset error timeout time
            this[sLongPollErrorTimeout] = 0;

            return Promise.resolve();
          });
        });
      }

      return Promise.resolve();
    }).catch((err) => {
      // extend error timeout time
      if (this[sLongPollErrorTimeout] === 0) {
        // start at 10 seconds
        this[sLongPollErrorTimeout] = 10;
      } else {
        // double, until we get to 5 minutes
        this[sLongPollErrorTimeout] = Math.min(this[sLongPollErrorTimeout] * 2, 60 * 5);
      }

      this.Log(`Long-Polling dropped: ${err} (starting long-poll again in ${this[sLongPollErrorTimeout]} seconds}`);
    });
  }).then(() => {
    // queue-up next long-poll once we've successfully got a new coc, or error'd
    //  doing this after the then().catch().then() will hopefully ensure we're always long-polling

    // this[sLongPollErrorTimeout] will be zero if the first then() (a success was hit)
    const longPollTimeoutSeconds = this[sLongPollErrorTimeout] > 0 ? this[sLongPollErrorTimeout] : this[sLongPollDelay];

    this.Log(`Re-starting long-poll in ${longPollTimeoutSeconds} seconds`);

    setTimeout(
      this[sLongPollFunction],
      longPollTimeoutSeconds * 1000
    );
  });
}

const regexRevToInt = /^([0-9]+)-[a-f0-9]+$/;

function RevisionToInt(rev) {
  const match = regexRevToInt.exec(rev);
  if (match && match[1]) {
    return Number(match[1]);
  }
  return 0;
}

/**
 * A basic NodeJS implementation of a Couchbase Lite Channel
 * Pull-only
 */
class CouchbaseChannel extends EventEmitter {
  constructor(options = {}) {
    super();

    if (options.url === undefined) throw new Error('No Couchbase Lite Sync Gateway supplied');
    if (options.dbName === undefined) throw new Error('No database name supplied');
    if (options.channel === undefined) throw new Error('No Couchbase Lite channel supplied');

    this[sBaseURL] = options.url;
    this[sChannel] = options.channel;
    this[sDbName] = options.dbName;

    // do we want this channel to long poll? or fetch manually?
    this[sEnableLongPoll] = options.longpoll === undefined ? true : options.longpoll;

    // delay in starting next longpoll (in seconds) - default: 3
    this[sLongPollDelay] = options.longpollDelay === undefined ? 3 : options.longpollDelay;

    // do we want to store our last sequence ID on the server? or locally in our cache?
    this[sEnableRemoteSequence] = options.remoteSequence === undefined ? false : options.remoteSequence;

    this[sForceRefresh] = !!options.forceRefresh;

    // setup our cache object
    this[sCache] = new Cache({
      prefix: `couchdb_${this[sDbName]}`,
    });

    this[sLastSequence] = 0;
    this[sLastSequenceRevision] = '';

    // track if we're already long-polling
    this[sLongPollActive] = false;
    // track if we have our initial state
    this[sSynced] = false;
    // setup a private long-poll function bound to this object
    this[sLongPollFunction] = DoLongPoll.bind(this);
    // error timeout (this will increase with subsequent errors)
    this[sLongPollErrorTimeout] = 0;
    // how long before longpoll request times out
    this[sLongPollTimeout] = options.longPollTimeout === undefined ? 1000 * 60 * 15 : options.longPollTimeout; // timeout time, default: 15 minutes

    // queue of document IDs we want to fetch (they have changes we need to get)
    this[sDocumentBodyFetchQueue] = [];

    if (options.auth !== undefined) {
      this.Auth = options.auth;
    }
  }

  /**
   * Generate a random UUID in Couchbase-Lite format
   */
  static GenerateUUID() {
    // https://github.com/couchbase/couchbase-lite-net/blob/995053a919d30ec59a0d03e680160aca191018f5/src/Couchbase.Lite.Shared/Util/Misc.cs#L44
    const buffer = Buffer.from(new Array(16));
    uuid(null, buffer, 0);
    return `-${buffer.toString('base64').replace(/\//g, '_').replace(/\+/g, '-').substring(0, 22)}`;
  }

  /**
   * Generate a checkpoint ID from a private UUID string
   * @param {String} uuid
   */
  static GenerateCheckpointID(fromUUID) {
    // https://github.com/couchbase/couchbase-lite-core/blob/579a0068ee001fcdfd7c2a0bb14f7b5f73caeeca/Replicator/DBWorker.cc#L160
    // couchbase-lite uses fleece to build a SHA1 digest out of a private UUID and various other values
    //  BUT, I can't get fleece for nodejs, so I can't replicate this perfectly
    //  HOWEVER, since my private UUID will be random and unknown to anybody else, you can't know this isn't a real couchbase-lite client

    return crypto.createHash('sha1').update(fromUUID).digest('hex');
  }

  /**
   * The base URL used for this Database
   */
  get BaseURL() {
    return this[sBaseURL];
  }

  /**
   * The last sequence this database was synced to
   */
  get LastSequence() {
    return this[sLastSequence];
  }

  /**
   * Authentication
   */
  set Auth(value) {
    if (value && value.user && value.password) {
      this[sAuthHeader] = `Basic ${Buffer.from(`${value.user}:${value.password}`).toString('base64')}`;
    } else {
      this[sAuthHeader] = null;
    }
  }

  /**
   * HTTP headers being used for this Database
   */
  get HTTPHeaders() {
    return {
      Authorization: this[sAuthHeader] || null,
      'User-Agent': CouchbaseLiteUserAgent,
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
    };
  }

  /**
   * Get this Database's Cache object
   */
  get Cache() {
    return this[sCache];
  }

  /**
   * Get this database's private UUID
   */
  GetPrivateUUID() {
    if (!this[sPrivateUUID]) {
      // search our local cache for a previously generated UUID
      return this.Cache.Wrap('UUID_Private', () => Promise.resolve(CouchbaseChannel.GenerateUUID())).then((cachedID) => {
        this[sPrivateUUID] = cachedID;
        return Promise.resolve(cachedID);
      });
    }
    return Promise.resolve(this[sPrivateUUID]);
  }

  /**
   * Get this database's checkpoint ID
   */
  GetCheckpointID() {
    return this.GetPrivateUUID().then(ID => CouchbaseChannel.GenerateCheckpointID(ID));
  }

  /**
   * Get last sequence ID
   */
  GetLastSequence() {
    if (!this[sEnableRemoteSequence]) {
      // get our sequence from our local cache
      return this.Cache.Get('lastSequence').then((lastSequence) => {
        let returnLastSequence = lastSequence;

        // default to 0
        if (returnLastSequence === null) {
          returnLastSequence = 0;
        }

        this[sLastSequence] = returnLastSequence;

        return Promise.resolve(returnLastSequence);
      });
    }
    // get our checkpoint ID
    return this.GetCheckpointID().then(checkpointID => needle('GET', `${this.BaseURL}/_local/${checkpointID}`, null, {
      headers: this.HTTPHeaders,
    }).then((resp) => {
      if (resp.statusCode === 404) {
        // document doesn't exist! return 0 as our last sequence
        return 0;
      }
      // we have a document! validate it
      if (resp.body && resp.body.lastSequence !== undefined) {
        // store last sequence and revision number
        this[sLastSequence] = resp.body.lastSequence;
        /* eslint-disable no-underscore-dangle */
        this[sLastSequenceRevision] = resp.body._rev;
        /* eslint-enable no-underscore-dangle */

        // return lastSequence stored on server
        return Promise.resolve(this.LastSequence);
      }
      return Promise.reject(new Error(`Failed to find lastSequence in response: ${JSON.stringify(resp.body)}`));
    }));
  }

  /**
   * Update the last sequence number we have synced to, both locally and in the couchbase-lite sync gateway
   */
  SetLastSequence(newLastSequence) {
    if (!this[sEnableRemoteSequence]) {
      this.Log(`Setting last sequence locally to ${newLastSequence.toString()}`);

      // store locally only (don't bother putting on server)
      //  store for ~6 months
      return this.Cache.Set('lastSequence', newLastSequence, 60 * 60 * 24 * 180);
    }
    // get our checkpoint ID
    return this.GetCheckpointID().then(checkpointID => needle('PUT', `${this.BaseURL}/_local/${checkpointID}`, {
      // WDW appears to store these as strings, so follow suit (we parse back to number in GetLastSequence)
      lastSequence: newLastSequence.toString(),
      _rev: this[sLastSequenceRevision],
    }, {
      json: true,
      headers: this.HTTPHeaders,
    }).then((resp) => {
      if (resp.statusCode === 409) {
        return Promise.reject(new Error(`Conflict error storing lastSequence: ${resp.statusCode} ${resp.body.error}`));
      }
      if (resp.statusCode !== 201) {
        return Promise.reject(new Error(`Error storing lastSequence: ${resp.statusCode}`));
      }
      if (resp.body && resp.body.ok) {
        this.Log(`Set last sequence to ${newLastSequence.toString()}`);

        // success!
        return Promise.resolve();
      }
      if (resp.body && resp.body.error && resp.body.reason) {
        return Promise.reject(new Error(`Failed to store lastSequence: ${resp.body.error}: ${resp.body.reason}`));
      }
      return Promise.reject(new Error('Failed to store lastSequence'));
    }));
  }

  /**
   * Is this channel synced?
   */
  get Synced() {
    return this[sSynced];
  }

  /**
   * Start database puller
   */
  Start() {
    if (this[sSynced]) return Promise.resolve();

    if (this[sInitialStatePromise] !== undefined) {
      return this[sInitialStatePromise];
    }

    this[sLongPollActive] = true;

    // get initial state before starting to long-poll
    //  store this promise so we can return it if further requests are made before we're initialised
    this[sInitialStatePromise] = this.GetInitialState().then(() => {
      // we have our initial state!
      this[sSynced] = true;

      // if we want to long-poll, start polling now
      if (this[sEnableLongPoll]) {
        this.Log('Starting long-poll for live updates');

        // start longpoll-ing
        process.nextTick(this[sLongPollFunction]);
      }

      return Promise.resolve();
    }).catch((err) => {
      this.emit('error', `Error getting initial state: ${err}\n${err.stack}`);

      // try again in a minute
      setTimeout(this.Start, 60 * 1000);
    });

    return this[sInitialStatePromise];
  }

  /**
   * Manually request an update (only available if not using long-poll)
   */
  Poll() {
    if (this[sEnableLongPoll]) return Promise.resolve();

    this.Log('Performing manual poll');

    // just call GetInitialState to fetch latest documents
    return this.GetInitialState();
  }

  /**
   * Get initial database state
   */
  GetInitialState() {
    // first, get our last sequence ID
    return this.GetLastSequence().then((lastSequenceID) => {
      const requestBody = {
        channels: this[sChannel],
        style: 'all_docs',
        filter: 'sync_gateway/bychannel',
        feed: 'normal',
        heartbeat: 30000,
      };

      if (this[sForceRefresh]) {
        this.Log('Forcing refresh of channel data, getting all document revisions again');
        requestBody.since = 0;
        this[sForceRefresh] = false;
      } else if (lastSequenceID !== 0) {
        this.Log(`Fetching initial state since ${lastSequenceID}`);
        requestBody.since = lastSequenceID;
      } else {
        this.Log('Fetching full state from nothing');
      }

      return needle('POST', `${this.BaseURL}/_changes?feed=normal&heartbeat=30000&style=all_docs&filter=sync_gateway%2Fbychannel`, requestBody, {
        json: true,
        headers: this.HTTPHeaders,
      }).then((resp) => {
        if (resp.statusCode !== 200) {
          return Promise.reject(new Error(`Initial state status code: ${resp.statusCode} [${JSON.stringify(resp.body)}]`));
        }
        if (!resp.body) {
          return Promise.reject(new Error(`Error getting initial state body: ${resp.statusCode}`));
        }

        this.Log(`Initial state returned ${resp.body.results.length} document updates`);

        // skip processing if we have no results
        if (resp.body.results.length > 0) {
          // fetch all document bodies
          return this.ProcessDocChanges(resp.body.results).then(() => this.SetLastSequence(resp.body.last_seq));
        }
        return Promise.resolve();
      });
    });
  }

  /**
   * Process new/deleted document revisions
   */
  ProcessDocChanges(documents) {
    // process document changes to build a list of documents for us to fetch in batches
    const docRequest = [];

    documents.forEach((doc) => {
      if (doc.deleted) {
        // TODO - remove document from database?

        // emit document deleted event
        this.emit('deleted', doc);
      } else if (doc.changes !== undefined && doc.changes.length) {
        let AlreadyHaveChange = false;
        docRequest.forEach((docRequested) => {
          if (docRequested.id === doc.id) {
            AlreadyHaveChange = true;

            // compare revision numbers
            if (RevisionToInt(doc.changes[0].rev) > RevisionToInt(docRequested.rev)) {
              // if this revision is greater than our existing one, replace
              docRequested.rev = doc.changes[0].rev;
            }

            // don't break out of for-loop in case there are even more revision in the changelist
          }
        });

        // push new change if we haven't already got one for this document ID in our list
        if (!AlreadyHaveChange) {
          docRequest.push({
            atts_since: null,
            rev: doc.changes[0].rev,
            id: doc.id,
          });
        }
      }
    });

    if (docRequest.length === 0) {
      this.Log('Extracted 0 document changes, skipping fetch');

      return Promise.resolve();
    }
    this.Log(`Extracted ${docRequest.length} document changes to fetch`);

    // filter out document revisions we already have
    return this.FilterAlreadyGotRevisions(docRequest).then((filteredDocRequest) => {
      this.Log(`After filtering on already-got revisions, left with ${filteredDocRequest.length} documents to fetch`);

      // split document requests into batches of docFetchBatchSize size
      const batches = [];
      while (filteredDocRequest.length > 0) {
        batches.push(filteredDocRequest.splice(0, Math.min(docFetchBatchSize, filteredDocRequest.length)));
      }

      this.Log(`Split document changes into ${batches.length} batches`);

      // resolve promises with each batch in order
      return batches.reduce((prev, cur) => prev.then(() => this.ProcessDocChangeBatch(cur)), Promise.resolve()).then(() => Promise.resolve());
    });
  }

  FilterAlreadyGotRevisions(docRequest) {
    const batches = [];
    while (docRequest.length > 0) {
      batches.push(this.BatchFilterAlreadyGotRevisions(docRequest.splice(0, Math.min(docFetchBatchSize, docRequest.length))));
    }

    return Promise.all(batches).then(docs => Promise.resolve([].concat(...docs)));
  }

  BatchFilterAlreadyGotRevisions(docRequest) {
    const docIDs = [];
    docRequest.forEach((doc) => {
      docIDs.push(doc.id);
    });

    return this.GetCouchbaseDocuments(docIDs).then((existingDocs) => {
      const newDocRequests = [];
      docRequest.forEach((doc) => {
        // try to find an existing doc in our database for this ID
        const oldDoc = existingDocs[doc.id];

        // if we haven't got an older version of this document
        // OR the existing revision is lower than our new one
        if (oldDoc === undefined || RevisionToInt(oldDoc.rev) < RevisionToInt(doc.rev)) {
          newDocRequests.push(doc);
        }
      });
      return Promise.resolve(newDocRequests);
    });
  }

  ProcessDocChangeBatch(docRequest) {
    // early out if no docs were updated
    if (docRequest.length === 0) {
      return Promise.resolve([]);
    }

    const cacheDocIds = [];
    docRequest.forEach((doc) => {
      cacheDocIds.push(doc.id);
    });

    // get existing documents so we can see if they have actually changed
    return this.GetCouchbaseDocuments(cacheDocIds).then(oldDocs => this.FetchDocuments(docRequest).then((docs) => {
      // emit new documents
      docs.forEach((doc) => {
        /* eslint-disable no-underscore-dangle */

        // emit new (and old doc)
        if (oldDocs[doc._id] !== undefined) {
          // check the revision has changed
          if (oldDocs[doc._id].rev !== doc._rev) {
            // revisions don't match! emit updated event
            this.emit('updated', doc, oldDocs[doc._id].doc);
          }
        } else {
          // couldn't find previously cached version of document, emit new event
          this.emit('updated', doc);
        }

        /* eslint-enable no-underscore-dangle */
      });

      return Promise.resolve(docs);
    }));
  }

  /**
   * Fetch full documents from live db
   *  docRequest is an array of objects:
   *  {rev: doc revision, id: doc ID}
   */
  FetchDocuments(docRequest) {
    // make sure atts_since is set
    docRequest.forEach((doc) => {
      if (doc.atts_since === undefined) {
        doc.atts_since = null;
      }
    });

    // we need to POST as JSON, but receive as multipart data (!?)
    //  so, manually set headers rather than let Needle handle JSON for us
    const headers = this.HTTPHeaders;
    headers['Content-Type'] = 'application/json';
    headers.Accept = 'multipart/related';

    this.Log(`Fetching ${docRequest.length} document revisions`);

    return needle('POST', `${this.BaseURL}/_bulk_get?revs=true&attachments=true`, {
      docs: docRequest,
    }, {
      headers,
    }).then((resp) => {
      // parse out multipart/related data returned
      const boundaryMatch = /boundary="([^"]+)"/.exec(resp.headers['content-type']);
      if (boundaryMatch && boundaryMatch[1]) {
        const regexString = `${boundaryMatch[1]}[\\s\\n]*Content-Type: application\\/json[^\\n]*[\\s\\n]*([^\\n]*)[\\s\\n]*`;
        const regexSplit = new RegExp(regexString, 'g');

        const respBody = resp.body.toString();

        const JSONResponses = [];

        // parse JSON data from response
        let JSONMatch;
        // eslint-disable-next-line no-cond-assign
        while ((JSONMatch = regexSplit.exec(respBody)) !== null) {
          let JSONData;
          try {
            JSONData = JSON.parse(JSONMatch[1]);

            if (JSONData.error !== undefined) {
              if (JSONData.reason !== undefined && JSONData.reason === 'missing') {
                // TODO - re-queue this document to get correct revision
                this.emit('error', `Requested missing document revision: ${JSONData.id}`, JSONMatch[1]);
              } else {
                this.emit('error', `Error fetching couchbase document: ${JSONData.error} / ${JSONData.id}`, JSONMatch[1]);
              }
            } else {
              // push data to our response array
              JSONResponses.push(JSONData);
            }
          } catch (e) {
            this.emit('error', `Error parsing couchbase JSON response: ${JSONMatch}: ${e}`, respBody);
          }
        }

        this.Log(`Successfully fetched ${JSONResponses.length} document revisions`);

        // insert all documents into database
        return this.SetDocumentsBulk(JSONResponses).then(() => Promise.resolve(JSONResponses));
      }

      return Promise.reject(new Error(`Failed to fetch documents: ${resp.statusCode}`));
    });
  }

  SetDocumentsBulk(docs) {
    return Cache.DB().then(db => new Promise((resolve) => {
      // bulk import data
      db.serialize(() => {
        // wrap this around "begin transaction" so this doesn't take forever!
        db.run('begin transaction');
        const cacheInsertStatement = db.prepare('INSERT OR REPLACE INTO couchbasesync (id, rev, body, dbName) VALUES (?, ?, ?, ?)');
        docs.forEach((doc) => {
          /* eslint-disable no-underscore-dangle */
          const id = doc._id;
          const rev = doc._rev;

          // remove meta from body when storing
          delete doc._rev;
          delete doc._revisions;
          /* eslint-enable no-underscore-dangle */

          cacheInsertStatement.run(id, rev, JSON.stringify(doc), this[sDbName]);
        });

        // commit the inserts
        db.run('commit');
        // finish using the insert statement
        cacheInsertStatement.finalize(() => {
          resolve();
        });
      });
    }));
  }

  /**
   * Get specific documents from this channel
   * Don't request more than 500 IDs at a time
   */
  GetCouchbaseDocuments(docIDs) {
    return Cache.DB().then(db => new Promise((resolve, reject) => {
      db.all(`SELECT id, rev, body FROM couchbasesync WHERE id IN (${Array(docIDs.length).fill('?').join(', ')}) AND dbName = ?`, docIDs.concat(this[sDbName]), (err, rows) => {
        if (err) {
          return reject(err);
        }

        const revisions = {};
        rows.forEach((row) => {
          let JSONData = {};
          try {
            JSONData = JSON.parse(row.body);
          } catch (e) {
            this.emit('error', `Failed to parse JSON object for document body: ${row.id}`);
          }

          revisions[row.id] = {
            id: row.id,
            rev: row.rev,
            doc: JSONData,
          };
        });

        return resolve(revisions);
      });
    }));
  }

  /**
   * Get all documents from this channel
   */
  GetAllDocuments() {
    return this.Start().then(Cache.DB).then(db => new Promise((resolve, reject) => {
      db.all('SELECT id, rev, body FROM couchbasesync WHERE dbName = ?', this[sDbName], (err, rows) => {
        if (err) {
          return reject(err);
        }

        const docs = [];
        rows.forEach((row) => {
          let JSONData = {};
          try {
            JSONData = JSON.parse(row.body);
          } catch (e) {
            this.emit('error', `Failed to parse JSON object for document body: ${row.id}`);
          }

          docs.push({
            id: row.id,
            rev: row.rev,
            doc: JSONData,
          });
        });

        return resolve(docs);
      });
    }));
  }

  /**
   * Get a specific document from this channel
   * Only safe to call this once you have the initial state
   * @param {String} id Document ID to fetch
   */
  GetDocument(id) {
    return this.Start().then(Cache.DB).then(db => new Promise((resolve, reject) => {
      db.get('SELECT body FROM couchbasesync WHERE id = ? AND dbName = ?', [id, this[sDbName]], (err, row) => {
        if (err) {
          return reject(err);
        }

        let JSONData;
        try {
          JSONData = JSON.parse(row.body);
        } catch (e) {
          return reject(new Error(`Failed to parse JSON for ${row.body}: ${e}`));
        }

        return resolve(JSONData);
      });
    }));
  }

  /**
   * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
   * @param {...*} ToPrint Objects/strings to print
   * */
  Log(...args) {
    return DebugLog.apply(null, [`${this.constructor.name}[${this[sDbName]}]:`, ...args]);
  }
}

module.exports = CouchbaseChannel;
