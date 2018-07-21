// our schedule library
const Moment = require('moment-timezone');
const Schedule = require('./schedule');

const Location = require('./location');

// symbols
const sRideID = Symbol('Ride ID');
const sRideName = Symbol('Ride Name');
const sCurrentWaitTime = Symbol('Wait Time');
const sFastPassAvailable = Symbol('Fade Pass Available');
const sFastPassReturnTimeAvailable = Symbol('Fast Pass Return Time Available');
const sFastPassReturnTimeStart = Symbol('Fast Pass Return Time Start');
const sFastPassReturnTimeEnd = Symbol('Fast Pass Return Time End');
const sLastTimeUpdate = Symbol('Last Update');
const sLastTimeFastPassUpdate = Symbol('Last Fast Pass Update');
const sScheduleData = Symbol('Schedule');
const sCustomProperties = Symbol('Custom Ride Properties');

/**
 * @typedef RideData
 * @type Object
 * @property {String} id Unique Ride ID
 * @property {String} name The ride's name
 * @property {Bool} active Is this ride currently operating?
 * @property {Number} wait_time Ride's current queue time
 * @property {Number} last_update Last time this Ride has a wait time change (in milliseconds)
 */

/**
 * Ride Class
 * Each ride object represents one ride at a theme park.
 * This object will hold the ride's current state.
 * @class
 */
class Ride extends Location {
  /**
   * Create a new Ride object
   * @param {Object} options
   * @param {String} options.rideId Ride's Unique ID
   */
  constructor(options = {}) {
    super(options);

    if (!options.rideId) throw new Error('No ride ID supplied to new ride object');
    this[sRideID] = options.rideId;

    // by default, rides don't support fastpass
    this[sFastPassAvailable] = false;

    // make our own schedule data object!
    this[sScheduleData] = new Schedule({
      id: this[sRideID],
    });
  }

  /**
   * Serialize this object (automatically called by JSON.stringify etc.)
   * @returns {Object} Current ride state
   */
  toJSON() {
    // try to extract schedule data for this ride
    const openingHours = this[sScheduleData].GetDate({
      date: Moment(),
    });

    const jsonData = {};

    // start with custom properties by adding them to a field "meta"
    if (this[sCustomProperties] !== undefined) {
      jsonData.meta = this[sCustomProperties];
    }

    // populate with basic data
    jsonData.id = this[sRideID];
    jsonData.name = this.Name;
    jsonData.active = this.Active;
    jsonData.waitTime = this.WaitTime;
    jsonData.fastPass = this.FastPass;
    jsonData.lastUpdate = this.LastUpdate;
    jsonData.status = this.Status;

    // add fastPass return times (if available)
    if (this[sFastPassReturnTimeAvailable]) {
      jsonData.fastPassReturnTime = {
        startTime: this.FastPassReturnTimeStart,
        endTime: this.FastPassReturnTimeEnd,
        lastUpdate: this[sLastTimeFastPassUpdate],
      };
    }

    // add opening hours to ride data if we actually have any!
    if (openingHours) {
      jsonData.schedule = openingHours;
    }

    return jsonData;
  }

  /**
   * Parse a JSON object and update this ride object's state
   * @param {Object} input
   */
  fromJSON(input) {
    // restore name
    if (input.name !== undefined) {
      this[sRideName] = input.name;
    }

    // restore fastPass status
    if (input.fastPass !== undefined) {
      this[sFastPassAvailable] = input.fastPass;
    }

    // re-add any custom properties
    if (input.meta !== undefined) {
      Object.keys(input.meta).forEach((key) => {
        this.AddCustomProperty(key, input.meta[key]);
      });
    }

    // restore wait time
    const prevWaitTime = this[sCurrentWaitTime];
    if (input.status !== undefined && input.status !== 'Operating') {
      // if status isn't "Operating", wait time must be a negative number. Restore correctly
      this[sCurrentWaitTime] = input.status === 'Closed' ? -1 : -2;
    } else if (input.waitTime !== undefined) {
      // otherwise, restore the actual wait time
      this[sCurrentWaitTime] = input.waitTime;
    }
    const waitTimeChanged = prevWaitTime !== this[sCurrentWaitTime];

    // restore last update time
    if (input.lastUpdate !== undefined) {
      this[sLastTimeUpdate] = input.lastUpdate;
    } else if (waitTimeChanged) {
      // wait time changed, mark change
      this[sLastTimeUpdate] = new Date().toISOString();
    }

    // TODO - restore ride schedule correctly
    // TODO - restore ride fastpass return time correctly
  }

  /**
   * Get this ride's name
   * Note: Will attempt to return in English, but will fallback to park's local locale if English isn't available
   * @type {String}
   */
  get Name() {
    return this[sRideName];
  }

  /**
   * Set this ride's wait time
   * Set to -1 when ride is Closed
   * Set to -2 when ride is Down
   * @type {Number}
   */
  set WaitTime(value) {
    // check for updated (or brand new) wait time for this ride
    if (this[sCurrentWaitTime] === undefined || this[sCurrentWaitTime] !== value) {
      // update our last updated time to now
      this[sLastTimeUpdate] = Date.now();
      // update our wait time for this ride
      this[sCurrentWaitTime] = value;
    }

    // value hasn't changed, don't do anything
  }

  /**
   * Get this ride's current wait time. Will always be >= 0.
   * Use .Active to determine ride's open status
   * @type {Number}
   */
  get WaitTime() {
    // always return positive ints for the wait time, even when inactive or not defined yet
    if (this[sCurrentWaitTime] === undefined || this[sCurrentWaitTime] < 0) return 0;

    return this[sCurrentWaitTime];
  }

  /**
   * Set this ride's fast pass availability
   * @type {Boolean}
   */
  set FastPass(value) {
    if (this[sFastPassAvailable] !== value) {
      // update our last updated time to now
      this[sLastTimeUpdate] = Date.now();
      // update fastpass status
      this[sFastPassAvailable] = value;
    }
  }

  /**
   * Get this ride's fast pass availability
   * @type {Boolean}
   */
  get FastPass() {
    return this[sFastPassAvailable];
  }

  /**
   * Set whether we have valid fast pass return times or not
   * Setting start/end times automatically sets this to true, only need to call this if fastPass availability has ran out
   * @type {Boolean}
   */
  set FastPassReturnTimeAvailable(value) {
    if (value !== this[sFastPassReturnTimeAvailable]) {
      // update availability
      this[sFastPassReturnTimeAvailable] = value;
      // update our last fastPass updated time to now
      this[sLastTimeFastPassUpdate] = Date.now();
    }
  }

  /**
   * Does this ride have a fastPass return time available?
   */
  get FastPassReturnTimeAvailable() {
    return this[sFastPassReturnTimeAvailable];
  }

  /**
   * Set this ride's fastPass return time window start
   * @type {Moment}
   */
  set FastPassReturnTimeStart(value) {
    // check if this fastPass is
    if (!value.isSame(this[sFastPassReturnTimeStart])) {
      // mark this as true so we know to add this to our JSON object
      this[sFastPassReturnTimeAvailable] = true;
      // update our last fastPass updated time to now
      this[sLastTimeFastPassUpdate] = Date.now();
      // use new fastPass return start time
      this[sFastPassReturnTimeStart] = value;
    }
  }

  /**
   * Get this ride's fast pass return time start in format of "HH:mm"
   * @type {String}
   */
  get FastPassReturnTimeStart() {
    return this[sFastPassReturnTimeStart].format('HH:mm');
  }

  /**
   * Set this ride's fastPass return time window end
   * @type {Moment}
   */
  set FastPassReturnTimeEnd(value) {
    // check if this fastPass is
    if (!value.isSame(this[sFastPassReturnTimeEnd])) {
      // mark this as true so we know to add this to our JSON object
      this[sFastPassReturnTimeAvailable] = true;
      // update our last fastPass updated time to now
      this[sLastTimeFastPassUpdate] = Date.now();
      // use new fastPass return end time
      this[sFastPassReturnTimeEnd] = value;
    }
  }

  /**
   * Get this ride's fast pass return time emd in format of "HH:mm"
   * @type {String}
   */
  get FastPassReturnTimeEnd() {
    return this[sFastPassReturnTimeEnd].format('HH:mm');
  }

  /**
   * Is this ride currently running?
   * @type {Boolean}
   */
  get Active() {
    // if we have no data yet, assume ride is inactive
    if (this[sCurrentWaitTime] === undefined) return false;

    return this[sCurrentWaitTime] >= 0;
  }

  /**
   * String status for this ride
   * Can only ever be either "Operating", "Down", or "Closed"
   * @type {String}
   */
  get Status() {
    // first, check the schedule for non-operating types
    //  refurbishment/closed schedule overrules all other statuses, as this is planned maintenance
    //  i.e, rides don't usually schedule maintenance and then randomly open mid-day
    const todaysSchedule = this.Schedule.GetDate({
      date: Moment(),
    });
    if (todaysSchedule && todaysSchedule.type !== 'Operating') {
      return todaysSchedule.type;
    }

    // wait time set to -2 when ride is Down
    if (this[sCurrentWaitTime] === -2) return 'Down';

    // otherwise, return a string matching current Active status
    return (this.Active ? 'Operating' : 'Closed');
  }

  /**
   * Get this ride's last wait time update time.
   * Note: Can be undefined
   * @type {Number}
   */
  get LastUpdate() {
    return this[sLastTimeUpdate];
  }

  /**
   * Get this ride's schedule object
   * @type {Schedule}
   */
  get Schedule() {
    return this[sScheduleData];
  }

  /**
   * Add a custom property to this ride (eg. a thrill rating, or a custom setting a specific park implements)
   * @param {String} name Name (field) of property to add to this ride
   * @param {object} value Value of property
   */
  AddCustomProperty(name, value) {
    if (this[sCustomProperties] === undefined) this[sCustomProperties] = {};
    this[sCustomProperties][name] = value;
  }
}

// export the Ride class
module.exports = Ride;
