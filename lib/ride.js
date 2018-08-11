// our schedule library
var Schedule = require("./schedule");
var Moment = require("moment-timezone");

// symbols
var s_rideID = Symbol();
var s_rideName = Symbol();
var s_currentWaitTime = Symbol();
var s_fastPassAvailable = Symbol();
var s_fastPassReturnTimeAvailable = Symbol();
var s_fastPassReturnTimeStart = Symbol();
var s_fastPassReturnTimeEnd = Symbol();
var s_lastTimeUpdate = Symbol();
var s_lastTimeFastPassUpdate = Symbol();
var s_scheduleData = Symbol();

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
    /**
     * Create a new Ride object
     * @param {Object} options New ride data
     * @param {String} options.ride_id Ride's Unique ID
     * @param {String} options.ride_name Ride name
     */
    constructor(options = {
        ride_id: null,
        ride_name: null
    }) {
        if (!options.ride_id) throw new Error("No ride ID supplied to new ride object");
        if (!options.ride_name || options.ride_name == "") throw new Error("No ride name supplied to new ride object");

        this[s_rideID] = options.ride_id;
        this[s_rideName] = options.ride_name;

        // by default, rides don't support fastpass
        this[s_fastPassAvailable] = false;

        // make our own schedule data object!
        this[s_scheduleData] = new Schedule();
    }

    /**
     * Serialize this object (automatically called by JSON.stringify etc.)
     * @returns {RideData} Current ride state
     */
    toJSON() {
        // try to extract schedule data for this ride
        var openingHours = this[s_scheduleData].GetDate({
            date: Moment(),
        });
        var jsonData = {
            id: this[s_rideID],
            name: this.Name,
            active: this.Active,
            waitTime: this.WaitTime,
            fastPass: this.FastPass,
            lastUpdate: this.LastUpdate,
            status: this.Status
        };

        // add fastPass return times (if available)
        if (this[s_fastPassReturnTimeAvailable]) {
            jsonData.fastPassReturnTime = {
                startTime: this.FastPassReturnTimeStart,
                endTime: this.FastPassReturnTimeEnd,
                lastUpdate: this[s_lastTimeFastPassUpdate]
            };
        }

        // add opening hours to ride data if we actually have any!
        if (openingHours) {
            jsonData.schedule = openingHours;
        }

        return jsonData;
    }

    /** 
     * Restore a state from a JSON object
     * Mainly used to restore ride data from cached data
     * @param {RideData} rideData Ride data to restore (ideally created using toJSON)
     */
    fromJSON(rideData) {
        // restore base ride data
        this[s_rideID] = rideData.id;
        this[s_rideName] = rideData.name;
        this[s_lastTimeUpdate] = rideData.lastUpdate;
        this[s_fastPassAvailable] = rideData.fastPass;

        // .Active is inferred by WaitTime
        if (!rideData.active) {
            // set WaitTime to -1 if the ride isn't active
            this[s_currentWaitTime] = -1;
        } else {
            this[s_currentWaitTime] = rideData.waitTime;
        }

        // import any schedule data (if we have any)
        if (rideData.schedule) {
            this[s_scheduleData].SetDate(rideData.schedule);

            // also re-import special schedule data (if we have any)
            if (rideData.schedule.special && rideData.schedule.special.length > 0) {
                for (var i, specialSchedule; specialSchedule = rideData.schedule.special[i++];) {
                    this[s_scheduleData].SetDate({
                        date: specialSchedule.date,
                        openingTime: specialSchedule.openingTime,
                        closingTime: specialSchedule.closingTime,
                        type: specialSchedule.type,
                        specialHours: true
                    });
                }
            }
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
     * Set to -1 when ride is Closed
     * Set to -2 when ride is Down
     * @type {Number}
     */
    set WaitTime(value) {
        // check for updated (or brand new) wait time for this ride
        if (this[s_currentWaitTime] === undefined || this[s_currentWaitTime] != value) {
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
     * Set this ride's fast pass availability
     * @type {Boolean}
     */
    set FastPass(value) {
        if (this[s_fastPassAvailable] != value) {
            // update our last updated time to now
            this[s_lastTimeUpdate] = Date.now();
            // update fastpass status
            this[s_fastPassAvailable] = value;
        }
    }

    /**
     * Get this ride's fast pass availability
     * @type {Boolean}
     */
    get FastPass() {
        return this[s_fastPassAvailable];
    }

    /**
     * Set whether we have valid fast pass return times or not
     * Setting start/end times automatically sets this to true, only need to call this if fastPass availability has ran out
     * @type {Boolean}
     */
    set FastPassReturnTimeAvailable(value) {
        if (value != this[s_fastPassReturnTimeAvailable]) {
            // update availability
            this[s_fastPassReturnTimeAvailable] = value;
            // update our last fastPass updated time to now
            this[s_lastTimeFastPassUpdate] = Date.now();
        }
    }

    /**
     * Does this ride have a fastPass return time available?
     */
    get FastPassReturnTimeAvailable() {
        return this[s_fastPassReturnTimeAvailable];
    }

    /**
     * Set this ride's fastPass return time window start
     * @type {Moment} Time
     */
    set FastPassReturnTimeStart(value) {
        // check if this fastPass is 
        if (!value.isSame(this[s_fastPassReturnTimeStart])) {
            // mark this as true so we know to add this to our JSON object
            this[s_fastPassReturnTimeAvailable] = true;
            // update our last fastPass updated time to now
            this[s_lastTimeFastPassUpdate] = Date.now();
            // use new fastPass return start time
            this[s_fastPassReturnTimeStart] = value;
        }
    }

    /**
     * Get this ride's fast pass return time start
     * @type {String} Time in format of "HH:mm"
     */
    get FastPassReturnTimeStart() {
        return this[s_fastPassReturnTimeStart].format("HH:mm");
    }

    /**
     * Set this ride's fastPass return time window end
     * @type {Moment} Time
     */
    set FastPassReturnTimeEnd(value) {
        // check if this fastPass is 
        if (!value.isSame(this[s_fastPassReturnTimeEnd])) {
            // mark this as true so we know to add this to our JSON object
            this[s_fastPassReturnTimeAvailable] = true;
            // update our last fastPass updated time to now
            this[s_lastTimeFastPassUpdate] = Date.now();
            // use new fastPass return end time
            this[s_fastPassReturnTimeEnd] = value;
        }
    }

    /**
     * Get this ride's fast pass return time emd
     * @type {String} Time in format of "HH:mm"
     */
    get FastPassReturnTimeEnd() {
        return this[s_fastPassReturnTimeEnd].format("HH:mm");
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
     * String status for this ride
     * Can only ever be either "Operating", "Down", "Closed", or "Refurbishment"
     * @type {String}
     */
    get Status() {
        // first, check the schedule for non-operating types
        //  refurbishment/closed schedule overrules all other statuses, as this is planned maintenance
        //  i.e, rides don't usually schedule maintenance and then randomly open mid-day 
        var todaysSchedule = this.Schedule.GetDate({
            date: Moment()
        });
        if (todaysSchedule && todaysSchedule.type != "Operating") {
            return todaysSchedule.type;
        }

        // wait time set to -3 when ride is down for Refurbishment
        if (this[s_currentWaitTime] == -3) return "Refurbishment";        
        
        // wait time set to -2 when ride is Down
        if (this[s_currentWaitTime] == -2) return "Down";

        // otherwise, return a string matching current Active status
        return (this.Active ? "Operating" : "Closed");
    }

    /**
     * Get this ride's last wait time update time.
     * Note: Can be undefined
     * @type {Number}
     */
    get LastUpdate() {
        return this[s_lastTimeUpdate];
    }

    /**
     * Get this ride's schedule object
     * @type {Schedule}
     */
    get Schedule() {
        return this[s_scheduleData];
    }
}

// export the Ride class
module.exports = Ride;
