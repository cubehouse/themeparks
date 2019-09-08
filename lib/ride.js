const Location = require('./location');

// symbols
const sRideID = Symbol('Ride ID');
const sRideName = Symbol('Ride Name');
const sCurrentWaitTime = Symbol('Wait Time');
const sFastPassAvailable = Symbol('Fade Pass Available');
const sLastTimeUpdate = Symbol('Last Update');
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
  }

  /**
   * Serialize this object (automatically called by JSON.stringify etc.)
   * @returns {Object} Current ride state
   */
  toJSON() {
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
    let metaDataChanged = false;
    if (input.meta !== undefined) {
      Object.keys(input.meta).forEach((key) => {
        if (this.AddCustomProperty(key, input.meta[key])) {
          metaDataChanged = true;
        }
      });
    }

    // restore wait time
    const prevWaitTime = this[sCurrentWaitTime];
    if (input.status !== undefined && input.status !== 'Operating') {
      // if status isn't "Operating", wait time must be a negative number. Restore correctly
      if (input.status === 'Refurbishment') {
        this[sCurrentWaitTime] = -3;
      } else if (input.status === 'Down') {
        this[sCurrentWaitTime] = -2;
      } else {
        this[sCurrentWaitTime] = -1;
      }
    } else if (input.waitTime !== undefined) {
      // otherwise, restore the actual wait time
      this[sCurrentWaitTime] = input.waitTime;
    }
    const waitTimeChanged = prevWaitTime !== this[sCurrentWaitTime];

    // restore last update time
    if (input.lastUpdate !== undefined) {
      this[sLastTimeUpdate] = input.lastUpdate;
    } else if (waitTimeChanged || metaDataChanged) {
      // wait time changed, mark change
      this[sLastTimeUpdate] = new Date().toISOString();
    }
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
   * Set to -3 when ride is under Refurbishment
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
   * Can only ever be either "Operating", "Down", "Closed", or "Refurbishment"
   * @type {String}
   */
  get Status() {
    // wait time set to -2 when ride is Down
    if (this[sCurrentWaitTime] === -2) return 'Down';
    // wait time set to -3 when ride is down for refurb
    if (this[sCurrentWaitTime] === -3) return 'Refurbishment';

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
   * Add a custom property to this ride (eg. a thrill rating, or a custom setting a specific park implements)
   * @param {String} name Name (field) of property to add to this ride
   * @param {object} value Value of property
   * @returns {Boolean} Returns true if adding the property changed the object, false if there was no change
   */
  AddCustomProperty(name, value) {
    if (this[sCustomProperties] === undefined) {
      this[sCustomProperties] = {};
    }

    if (this[sCustomProperties][name] !== value) {
      this[sCustomProperties][name] = value;

      return true;
    }

    return false;
  }
}

// export the Ride class
module.exports = Ride;
