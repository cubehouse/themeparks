// symbols
var s_rideID = Symbol();
var s_rideName = Symbol();
var s_currentWaitTime = Symbol();
var s_lastTimeUpdate = Symbol();

// debug print lib
var DebugLog = require('./debugPrint.js');

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
class Ride {
    constructor(options = {
        ride_id: null,
        ride_name: null
    }) {
        if (!options.ride_id) throw new Error("No ride ID supplied to new ride object");
        if (!options.ride_name || options.ride_name == "") throw new Error("No ride name supplied to new ride object");

        this[s_rideID] = options.ride_id;
        this[s_rideName] = options.ride_name;
    }

    /**
     * Serialize this object (automatically called by JSON.stringify etc.)
     * @returns {RideData} Current ride state
     */
    toJSON() {
        return {
            id: this[s_rideID],
            name: this.Name,
            active: this.Active,
            wait_time: this.WaitTime,
            last_update: this.LastUpdate,
        };
    }

    /** 
     * Restore a state from a JSON object
     * Mainly used to restore ride data from cached data
     * @param {RideData} New ride status object
     */
    fromJSON(rideData) {
        // restore base ride data
        this[s_rideID] = rideData.id;
        this[s_rideName] = rideData.name;
        this[s_lastTimeUpdate] = rideData.last_update;

        // .Active is inferred by WaitTime
        if (!rideData.active) {
            // set WaitTime to -1 if the ride isn't active
            this[s_currentWaitTime] = -1;
        } else {
            this[s_currentWaitTime] = rideData.wait_time;
        }
    }

    /**
     * Get this ride's name
     * Note: Will attempt to return in English, but will fallback to park's local locale if English isn't available
     * @type {String}
     */
    get Name() {
        return this[s_rideName];
    }

    /**
     * Set this ride's wait time
     * @type {Number}
     */
    set WaitTime(value) {
        // check for updated (or brand new) wait time for this ride
        if (this[s_currentWaitTime] === undefined || this[s_currentWaitTime] != value) {
            // ride time has changed!
            //DebugLog(`${this.Name}:`, `Time updated from ${this[s_currentWaitTime]} to ${value}`);

            // update our last updated time to now
            this[s_lastTimeUpdate] = Date.now();
            // update our wait time for this ride
            this[s_currentWaitTime] = value;
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
        if (this[s_currentWaitTime] === undefined || this[s_currentWaitTime] < 0) return 0;

        return this[s_currentWaitTime];
    }

    /**
     * Is this ride currently running?
     * @type {Boolean}
     */
    get Active() {
        // if we have no data yet, assume ride is inactive
        if (this[s_currentWaitTime] === undefined) return false;

        return this[s_currentWaitTime] >= 0;
    }

    /**
     * Get this ride's last wait time update time.
     * Note: Can be undefined
     * @type {Number}
     */
    get LastUpdate() {
        return this[s_lastTimeUpdate];
    }
}

// export the Ride class
module.exports = Ride;