const EventEmitter = require('events');

const moment = require('moment');
const CouchbaseChannelDisney = require('./couchbaseChannelDisney');
const Facilities = require('./disneyFacilityChannel');
const DebugLog = require('../debugPrint.js');
const Cache = require('../cache');

const DisneyUtil = require('./disneyUtil');

const sParkID = Symbol('Park ID');
const sChannel = Symbol('Channel');
const sFacilities = Symbol('Facilities');
const sBusVersion = Symbol('Bus Version');
const sPollInterval = Symbol('Polling Interval');
const sResorts = Symbol('Specific resorts to sync');
const sInitialiseWithOldData = Symbol('Broadcast old data when starting channel');

class DisneyLiveBusTimes extends EventEmitter {
  constructor(options = {}) {
    super();

    this[sParkID] = options.parkId === undefined ? 'wdw' : options.parkId;
    this[sBusVersion] = options.version === undefined ? '1_0' : options.version;

    // how often to poll for bus time updates (in seconds)
    this[sPollInterval] = options.pollinterval === undefined ? 10 : options.pollinterval;

    // setup our facilities channel, we need this to sync before we get our bus times
    this[sFacilities] = new Facilities({
      resortId: this[sParkID],
    });

    this[sResorts] = options.resorts || undefined;

    this[sInitialiseWithOldData] = !!options.initWithOldData;

    // NOTE - whilst there is a live channel for "Outpost Depot at Disney's Fort Wilderness Resort & Campground"
    //  our list of resorts doesn't return the ID 144943 needed to subscribe
    //  However, channel 80010408 has exactly the same data, so we're getting it via the "The Cabins at Disney's Fort Wilderness Resort" resort instead
  }

  /**
   * Callback for "updated" event from our couchbase channel class
   * @param {Object} doc
   */
  OnDocUpdated(doc) {
    // console.log(JSON.stringify(doc, null, 2));
    const id = DisneyUtil.CleanID(doc.id);
    const {
      lastUpdate,
    } = doc;

    this[sFacilities].GetFacilityName(id).then((name) => {
      if (doc.destinations === undefined) {
        return;
      }

      // add human-readable times and names to each destination
      const destinationPromises = [];
      doc.destinations.forEach((dest) => {
        destinationPromises.push(this.ParseDestination(dest));
      });
      Promise.all(destinationPromises).then((destinations) => {
        // emit events for each updated bus stop
        // console.log(JSON.stringify(destinations, null, 2));

        destinations.forEach((dest) => {
          if (dest.arrivals !== undefined) {
            dest.arrivals.forEach((arrival) => {
              this.emit('busupdate', {
                lastUpdate,
                from: name,
                from_id: Number(id),
                to: dest.name,
                to_id: Number(DisneyUtil.CleanID(dest.id)),
                atStop: arrival.atStop,
                atStopHuman: arrival.atStop_human,
                atDestination: arrival.atDestination,
                atDestinationHuman: arrival.atDestination_human,
                frequency: dest.frequency,
                frequencyHuman: dest.frequency_human,
                transfers: dest.transfers,
                transfersHuman: dest.transfers_human,
                alternativeServices: dest.services || [],
              });
            });
          } else {
            // emit event with boring "every 20 minutes" update
            this.emit('busupdate', {
              lastUpdate,
              from: name,
              from_id: Number(id),
              to: dest.name,
              to_id: Number(DisneyUtil.CleanID(dest.id)),
              frequency: dest.frequency,
              frequencyHuman: dest.frequency_human,
              transfers: dest.transfers,
              transfersHuman: dest.transfers_human,
              alternativeServices: dest.services || [],
            });
          }
        });
      });
    });
  }

  ParseDestination(destination) {
    return this[sFacilities].GetFacilityName(destination.id).then((name) => {
      // remove superfluous "Disney's" and "Theme Park" from destination names
      destination.name = name.replace(/\s?(?:Theme|Water)?\sPark$/, '').replace(/^Disney's /, '');

      // use moment to make some human-readable times
      const now = moment();

      if (destination.frequency !== undefined) {
        const busFrequency = now.clone().add(destination.frequency, 'seconds');
        destination.frequency_human = `every ${busFrequency.from(now, true)}`;
      }

      // add human-readable strings to each arrival
      if (destination.arrivals !== undefined) {
        destination.arrivals.forEach((arrival) => {
          arrival.atStop_human = moment(arrival.atStop).from(now);
          arrival.atDestination_human = moment(arrival.atDestination).from(now);
        });
      }

      // resolve transfer destination names if they exist
      if (destination.transfers && destination.transfers.length > 0) {
        return Promise.all(destination.transfers.map(x => this.ParseDestination(x))).then((transfers) => {
          destination.transfers = [];
          transfers.forEach((t) => {
            destination.transfers.push(t.name);
          });

          destination.transfers_human = `Transfer at ${(destination.transfers.length > 1 ? destination.transfers.join(', ') : destination.transfers[0])}`;

          return Promise.resolve(destination);
        });
      }

      return Promise.resolve(destination);
    });
  }

  GetCurrentBusState() {
    if (!this[sInitialiseWithOldData]) {
      return Promise.resolve();
    }

    return Cache.DB().then(db => new Promise((resolve, reject) => {
      db.all('SELECT body FROM couchbasesync WHERE dbName = ?', [`${this[sParkID]}_buses`], (err, rows) => {
        if (err) {
          return reject(new Error(`Fetching current bus state: ${err}`));
        }

        // process existing couchbase docs as if they were new
        rows.map(x => JSON.parse(x.body)).forEach(this.OnDocUpdated.bind(this));

        return resolve();
      });
    }));
  }

  /**
   * Start fetching live bus time updates
   */
  Start() {
    if (!this[sFacilities].Synced) {
      // start facilities syncing,
      return this[sFacilities].Start().then(() => {
        if (this[sChannel] === undefined) {
          // set this to something in case multiple callbacks arrive before we set it up
          this[sChannel] = 1;

          // find all our resorts and build channel names
          return this.GetCurrentBusState().then(() => this.GetChannelNames().then((channels) => {
            // create our channel for fetching bus times
            this[sChannel] = new CouchbaseChannelDisney({
              dbName: `${this[sParkID]}_buses`,
              channel: channels.join(','),
              longpollDelay: this[sPollInterval], // delay each longpoll by 10 seconds (to avoid constant flooding of updates)
            });

            // setup puller hooks for document updates
            this[sChannel].on('updated', this.OnDocUpdated.bind(this));
            this[sChannel].on('error', this.Log.bind(this));

            // start the channel fetching documents
            this[sChannel].Start();
          }));
        }

        return Promise.resolve();
      });
    }

    return Promise.resolve();
  }

  GetChannelNames() {
    if (this[sResorts] !== undefined) {
      return Promise.resolve([].concat(this[sResorts]).map(x => `${this[sParkID]}.arrivals.${x};entityType=resort.${this[sBusVersion]}`));
    }

    return Cache.DB().then(db => new Promise((resolve, reject) => {
      db.all('SELECT id, name FROM disneyFacilities WHERE entityType = ? AND resort_code = ?', ['resort', this[sParkID]], (err, rows) => {
        if (err) {
          return reject(err);
        }

        const channels = [];
        rows.forEach((row) => {
          channels.push(`${this[sParkID]}.arrivals.${row.id};entityType=resort.${this[sBusVersion]}`);
        });

        return resolve(channels);
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

module.exports = DisneyLiveBusTimes;
