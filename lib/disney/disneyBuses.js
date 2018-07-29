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

class DisneyLiveBusTimes extends EventEmitter {
  constructor(options = {}) {
    super();

    this[sParkID] = options.park_id === undefined ? 'wdw' : options.park_id;
    this[sBusVersion] = options.version === undefined ? '1_0' : options.version;

    // how often to poll for bus time updates (in seconds)
    this[sPollInterval] = options.pollinterval === undefined ? 10 : options.pollinterval;

    // setup our facilities channel, we need this to sync before we get our bus times
    this[sFacilities] = new Facilities({
      resort_id: this[sParkID],
    });

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
                from: name,
                from_id: id,
                to: dest.name,
                to_id: DisneyUtil.CleanID(dest.id),
                atStop: arrival.atStop,
                atStopHuman: arrival.atStop_human,
                atDestination: arrival.atDestination,
                atDestinationHuman: arrival.atDestination_human,
                frequency: dest.frequency,
                frequencyHuman: dest.frequency_human,
              });
            });
          } else {
            // emit event with boring "every 20 minutes" update
            this.emit('busupdate', {
              from: name,
              from_id: id,
              to: dest.name,
              to_id: DisneyUtil.CleanID(dest.id),
              frequency: dest.frequency,
              frequencyHuman: dest.frequency_human,
            });
          }
        });
      });
    });
  }

  ParseDestination(destination) {
    return this[sFacilities].GetFacilityName(destination.id).then((name) => {
      destination.name = name;

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

      return Promise.resolve(destination);
    });
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
          return this.GetChannelNames().then((channels) => {
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
          });
        }

        return Promise.resolve();
      });
    }

    return Promise.resolve();
  }

  GetChannelNames() {
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
