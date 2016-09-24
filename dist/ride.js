"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// our schedule library
var Schedule = require("./schedule");
var Moment = require("moment-timezone");

// symbols
var s_rideID = Symbol();
var s_rideName = Symbol();
var s_currentWaitTime = Symbol();
var s_fastPassAvailable = Symbol();
var s_lastTimeUpdate = Symbol();
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

var Ride = function () {
    /**
     * Create a new Ride object
     * @param {Object} options New ride data
     * @param {String} options.ride_id Ride's Unique ID
     * @param {String} options.ride_name Ride name
     */
    function Ride() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {
            ride_id: null,
            ride_name: null
        } : arguments[0];

        _classCallCheck(this, Ride);

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


    _createClass(Ride, [{
        key: "toJSON",
        value: function toJSON() {
            // try to extract schedule data for this ride
            var openingHours = this[s_scheduleData].GetDate({
                date: Moment()
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

    }, {
        key: "fromJSON",
        value: function fromJSON(rideData) {
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

    }, {
        key: "Name",
        get: function get() {
            return this[s_rideName];
        }

        /**
         * Set this ride's wait time
         * @type {Number}
         */

    }, {
        key: "WaitTime",
        set: function set(value) {
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
        ,
        get: function get() {
            // always return positive ints for the wait time, even when inactive or not defined yet
            if (this[s_currentWaitTime] === undefined || this[s_currentWaitTime] < 0) return 0;

            return this[s_currentWaitTime];
        }

        /**
         * Set this ride's fast pass availability
         * @type {Boolean}
         */

    }, {
        key: "FastPass",
        set: function set(value) {
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
        ,
        get: function get() {
            return this[s_fastPassAvailable];
        }

        /**
         * Is this ride currently running?
         * @type {Boolean}
         */

    }, {
        key: "Active",
        get: function get() {
            // if we have no data yet, assume ride is inactive
            if (this[s_currentWaitTime] === undefined) return false;

            return this[s_currentWaitTime] >= 0;
        }

        /**
         * String status for this ride
         * Can only ever be either "Operating", "Closed", or "Refurbishment"
         * @type {String}
         */

    }, {
        key: "Status",
        get: function get() {
            // first, check the schedule for non-operating types
            //  refurbishment/closed schedule overrules all other statuses, as this is planned maintenance
            //  i.e, rides don't usually schedule maintenance and then randomly open mid-day 
            var todaysSchedule = this.Schedule.GetDate({
                date: Moment()
            });
            if (todaysSchedule && todaysSchedule.type != "Operating") {
                return todaysSchedule.type;
            }

            // otherwise, return a string matching current Active status
            return this.Active ? "Operating" : "Closed";
        }

        /**
         * Get this ride's last wait time update time.
         * Note: Can be undefined
         * @type {Number}
         */

    }, {
        key: "LastUpdate",
        get: function get() {
            return this[s_lastTimeUpdate];
        }

        /**
         * Get this ride's schedule object
         * @type {Schedule}
         */

    }, {
        key: "Schedule",
        get: function get() {
            return this[s_scheduleData];
        }
    }]);

    return Ride;
}();

// export the Ride class


module.exports = Ride;
//# sourceMappingURL=ride.js.map