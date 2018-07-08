"use strict";

const Log = require("./debugPrint");
const moment = require("moment-timezone");
const settings = require("./settings");
const Cache = require("./cache");

const s_scheduleDates = Symbol();
const s_scheduleDatesSpecial = Symbol();
const s_cache = Symbol();
const s_cachePopulated = Symbol();
const s_cacheWaitCallbacks = Symbol();
const s_cacheTimer = Symbol();

/**
 * @typedef ScheduleData
 * @type Object
 * @property {Moment} date Date this schedule data applies to
 * @property {Moment} openingTime Opening time for this date
 * @property {Moment} closingTime Closing time for this date
 * @property {String} type Whether this schedule data refers to an "Operating", "Closed" or "Refurbishment" status
 * @property {SpecialScheduleData[]} special Won't exist if no special times exist for this date
 */

/**
 * @typedef SpecialScheduleData
 * @type Object
 * @property {Moment} openingTime Opening time for this special schedule data
 * @property {Moment} closingTime Closing time for this special schedule data
 * @property {String} type Type of special schedule this is (eg. "Extra Magic Hours")
 */

/**
 * Schedule class to hold opening and closing times for parks and rides etc.
 * Supports standard and "special" opening times
 * @class
 */
class Schedule {
    /**
     * Create a new Schedule object
     * @param {Object} options
     * @param {String} options.id Unique Schedule ID for caching keys
     */
    constructor(options = {}) {
        // use Map for better structure (int -> data)
        //  int is the number of days since Unix Epoch
        this[s_scheduleDates] = new Map();
        // also one for special hours (this is actually int -> data[] to support multiple special times)
        this[s_scheduleDatesSpecial] = new Map();

        // setup our cache object
        if (options.id === undefined) throw new Error("No id passed for schedule object");
        this[s_cache] = new Cache({
            prefix: `schedule_${options.id}`
        });
        // store flag of whether we've populated ourselves with cache data yet
        this[s_cachePopulated] = false;
        this[s_cacheWaitCallbacks] = [];

        // try and populate cache
        this.CheckCacheStatus();
    }

    /**
     * Set schedule data for a date
     * @param {Object} scheduleData
     * @param {Moment|String} [scheduleData.date=scheduleData.openingTime] Moment.js date object (or a valid date String to be parsed by Moment JS). Will use openingTime if this is not supplied
     * @param {Moment|String} [scheduleData.openingTime] Moment.js date object of this day's opening time (or a valid date String to be parsed by Moment JS) (can be ignored if type is Closed)
     * @param {Moment|String} [scheduleData.closingTime] Moment.js date object of this day's closing time (or a valid date String to be parsed by Moment JS) (can be ignored if type is Closed)
     * @param {Boolean} [scheduleData.specialHours=false] Is this schedule data part of schedule special hours?
     * @param {String} [scheduleData.type=Operating] The schedule type. Normal schedules should always be "Operating", "Closed" or "Refurbishment". Special schedules can be any String (eg. Extra Magic Hours).
     * @returns {Boolean} success Returns true if the operation was a success and the data was actually changed
     */
    SetDate({
        // the day to set the schedule data for
        date = null,
        // opening time for this day
        openingTime = null,
        // closing time for this day
        closingTime = null,
        // is this special hours data? (default: false)
        specialHours = false,
        // the type of this schedule date (default: Operating)
        type = "Operating"
    }) {
        // if we haven't been supplied a date, use the opening time
        if (!date) date = openingTime;

        // check our date is a valid momentjs object
        date = parseDateTime(date, "date");

        // special case, if this is a closed date, support not passing in opening and closing times
        if (type == "Closed") {
            if (!openingTime) openingTime = date.startOf("day");
            if (!closingTime) closingTime = date.endOf("day");
        }

        openingTime = parseDateTime(openingTime, "openingTime");
        closingTime = parseDateTime(closingTime, "closingTime");

        // if any of our dates are invalid, return false
        if (!date || !openingTime || !closingTime) return false;

        // calculate the days since Unix Epoch
        const day = dateToDay(date);

        // make sure opening and closing times are in the correct day!
        const todaySet = {
            "year": date.year(),
            "month": date.month(),
            "date": date.date()
        };
        openingTime.set(todaySet);
        closingTime.set(todaySet);

        // work out if the closing time is in the following day
        if (closingTime.isBefore(openingTime)) {
            // add 1 day if the closing time comes before the opening time (implying it's open past midnight!)
            closingTime.add(1, "day");
        }

        // build schedule data object and add it to our schedule map
        if (!specialHours) {
            // check our schedule type is sane
            if (type != "Operating" && type != "Closed" && type != "Refurbishment") {
                Log(`Tried to use invalid schedule type ${type} for standard schedule data (must be Operating, Closed or Refurbishment)`);
                return false;
            }

            const newScheduleData = {
                "date": date,
                "openingTime": openingTime,
                "closingTime": closingTime,
                "type": type
            };

            // check if we already have this data for this day (don't invalidate cache etc if it hasn't changed)
            if (this[s_scheduleDates].has(day)) {
                const checkDirtyObj = this[s_scheduleDates].get(day);
                if (
                    checkDirtyObj.date == newScheduleData.date &&
                    checkDirtyObj.openingTime == newScheduleData.openingTime &&
                    checkDirtyObj.closingTime == newScheduleData.closingTime &&
                    checkDirtyObj.type == newScheduleData.type) {
                    // data is identical to existing object, don't update
                    return false;
                }
            }

            // set this day's schedule data
            this[s_scheduleDates].set(day, newScheduleData);

            // we have new data, so mark it as dirty to get cached
            this.RequestCache();
        } else {
            // special hours can't be Operating or Closed, that is for normal hours
            if (type == "Operating" || type == "Closed") {
                Log(`Tried to use invalid schedule type ${type} for special schedule data (can't be Operating or Closed)`);
                return false;
            }

            // add a new special hours array if we don't already have one
            if (!this[s_scheduleDatesSpecial].has(day)) {
                this[s_scheduleDatesSpecial].set(day, []);

                // we have new data, so mark it as dirty to get cached
                this.RequestCache();
            }

            const newSpecialScheduleData = {
                "openingTime": openingTime,
                "closingTime": closingTime,
                "type": type
            };

            // check we don't already have this special data in our array
            const newDataStringified = JSON.stringify(newSpecialScheduleData);
            const specialDayArray = this[s_scheduleDatesSpecial].get(day);
            for (let i = 0, checkData; checkData = specialDayArray[i++];) {
                if (JSON.stringify(checkData) == newDataStringified) {
                    // this object already exists, so bail out
                    return false;
                }
            }

            // add our new data to the specials array
            specialDayArray.push(newSpecialScheduleData);

            // we have new data, so mark it as dirty to get cached
            this.RequestCache();
        }

        return true;
    }

    /**
     * Set a range of dates with the same schedule data
     * @param {Object} scheduleData
     * @param {Moment|String} scheduleData.startDate Moment.js date object to start schedule date range (or a valid date String to be parsed by Moment JS)
     * @param {Moment|String} scheduleData.endDate Moment.js date object to end schedule date range (or a valid date String to be parsed by Moment JS)
     * @param {Moment|String} scheduleData.openingTime Moment.js date object of this day's opening time (or a valid date String to be parsed by Moment JS)
     * @param {Moment|String} scheduleData.closingTime Moment.js date object of this day's closing time (or a valid date String to be parsed by Moment JS)
     * @param {Boolean} [scheduleData.specialHours=false] Is this schedule data part of schedule special hours?
     * @param {String} [scheduleData.type=Operating] The schedule type. Normal schedules should always be "Operating", "Closed" or "Refurbishment". Special schedules can be any String (eg. Extra Magic Hours).
     * @returns {Boolean} success 
     */
    SetRange({
        // first date of the range to set schedule for
        startDate = null,
        // first date of the range to set schedule for
        endDate = null,
        // opening time for this day
        openingTime = null,
        // closing time for this day
        closingTime = null,
        // is this special hours data? (default: false)
        specialHours = false,
        // the type of this schedule date (default: Operating)
        type = "Operating"
    }) {
        // check our input dates are valid
        startDate = parseDateTime(startDate, "startDate");
        endDate = parseDateTime(endDate, "endDate");
        openingTime = parseDateTime(openingTime, "openingTime");
        closingTime = parseDateTime(closingTime, "closingTime");

        // if any of our dates are invalid, return false
        if (!startDate || !endDate || !openingTime || !closingTime) return false;

        // if any of our dates result in invalid data, return false
        let retValue = true;

        // add each day using SetDate
        for (let m = startDate; m.isSameOrBefore(endDate); m.add(1, "days")) {
            // retValue AND= means this becomes false with any one failed result
            //  if we do fail, we also just keep going to try and get as much done as possible :) 
            retValue &= this.SetDate({
                date: m,
                openingTime: openingTime,
                closingTime: closingTime,
                specialHours: specialHours,
                type: type
            });
        }

        return retValue;
    }

    /**
     * Get schedule data for a specific date
     * @param {Object} dateData
     * @param {Moment|String} dateData.date Moment.js date object to fetch schedule data for (or a valid date String to be parsed by Moment JS)
     * @return {ScheduleData} scheduleResult Can be false if no data exists for the requested date
     */
    GetDate({
        date = null
    }) {
        // check our date is valid
        date = parseDateTime(date, "date");
        if (!date) return false;

        // do we have this day in our schedule data?
        const day = dateToDay(date);
        if (!this[s_scheduleDates].has(day)) return false;

        const dayData = this[s_scheduleDates].get(day);
        // copy data into the return object (otherwise we end up modifying the actual date data!)
        const returnObject = {
            "date": dayData.date,
            "openingTime": dayData.openingTime,
            "closingTime": dayData.closingTime,
            "type": dayData.type
        };

        // add special schedules if we have any!
        if (this[s_scheduleDatesSpecial].has(day)) {
            returnObject.special = this[s_scheduleDatesSpecial].get(day);
        }

        return returnObject;
    }

    /**
     * Get schedule data for a range of dates
     * @param {Object} dateData
     * @param {Moment|String} dateData.startDate Moment.js date object to fetch schedule data from (or a valid date String to be parsed by Moment JS)
     * @param {Moment|String} dateData.endDate Moment.js date object to fetch schedule data from (or a valid date String to be parsed by Moment JS)
     * @return {ScheduleData[]} scheduleResult Can be an empty array if there is no valid data (won't be null)
     */
    GetDateRange({
        startDate = null,
        endDate = null,
    }) {
        // check start and end date are valid
        startDate = parseDateTime(startDate, "startDate");
        endDate = parseDateTime(endDate, "endDate");
        if (!startDate || !endDate) return [];

        // fetch each day of the range and add it to our result
        const returnArray = [];
        for (let m = startDate; m.isSameOrBefore(endDate); m.add(1, "days")) {
            const dateSchedule = this.GetDate({
                date: m
            });
            if (dateSchedule) {
                returnArray.push(dateSchedule);
            }
        }

        return returnArray;
    }

    /**
     * Get our cache object
     */
    get Cache() {
        return this[s_cache];
    }

    /**
     * Request a cache to happen at the next best opportunity
     */
    RequestCache() {
        // if other caching was queued up, skip it
        if (this[s_cacheTimer] !== undefined) {
            clearTimeout(this[s_cacheTimer]);
        }

        // schedule caching in half a second
        this[s_cacheTimer] = setTimeout(this.WriteToCache.bind(this), 500);
    }

    /**
     * Write schedule data to the cache
     */
    WriteToCache() {
        // if any timer exists for caching, clear it out, we're caching right now
        if (this[s_cacheTimer] !== undefined) {
            clearTimeout(this[s_cacheTimer]);
        }

        // delete old data (older than 3 days to be safe)
        const threeDaysAgo = dateToDay(moment().subtract(3, "days"));
        const checkMapForDelete = (value, key, map) => {
            if (key <= threeDaysAgo) {
                map.delete(key);
            }
        };
        this[s_scheduleDates].forEach(checkMapForDelete);
        this[s_scheduleDatesSpecial].forEach(checkMapForDelete);

        // write data to cache
        return this.Cache.Set("dates", {
            // serialize Map as an array
            dates: [...this[s_scheduleDates]],
            special: [...this[s_scheduleDatesSpecial]]
        }, 60 * 60 * 6);
    }

    /**
     * Check the cache has been setup. Returns resolved Promise once it is
     */
    CheckCacheStatus() {
        if (this[s_cachePopulated]) return Promise.resolve();

        return new Promise((resolve) => {
            // add our Promise resolve to our callback stack
            this[s_cacheWaitCallbacks].push(resolve);

            // if we're the first to request the cache state, then actually do it...
            if (this[s_cacheWaitCallbacks].length == 1) {
                // request cache read
                this.ReadFromCache().then(() => {
                    // fire callbacks if they are present
                    if (this[s_cacheWaitCallbacks] && this[s_cacheWaitCallbacks].length) {
                        for (let i = 0; i < this[s_cacheWaitCallbacks].length; i++) {
                            this[s_cacheWaitCallbacks][i]();
                        }
                        this[s_cacheWaitCallbacks] = [];
                    }
                });
            }
        });
    }

    /**
     * Read data from cache
     */
    ReadFromCache() {
        return this.Cache.Get("dates").then((data) => {
            // mark cache as populated so we don't try and read again
            this[s_cachePopulated] = true;

            // if data is valid, update our internal state
            if (data && data.dates && data.special) {
                this[s_scheduleDates] = data.dates.__proto__ == Map.prototype ? data.dates : new Map(data.dates);
                this[s_scheduleDatesSpecial] = data.special.__proto__ == Map.prototype ? data.special : new Map(data.special);
            }

            return Promise.resolve(data);
        });
    }
}

function parseDateTime(dateObject, varName) {
    // check if it's already a valid Moment object
    if (!moment.isMoment(dateObject)) {
        // try and parse if this is a string
        const newDate = moment(dateObject, [
            moment.ISO_8601,
            settings.DefaultTimeFormat,
            settings.DefaultDateFormat,
            "YYYY-MM-DD",
        ]);

        // check if we ended up with a valid timestamp
        if (!newDate.isValid()) {
            Log(`Invalid scheduleData.${varName}:`, dateObject);
            return false;
        }

        // use our successful string parse!
        dateObject = newDate;
    }

    // we got this far, success! return the new Moment object (or the original one if it was always good!)
    return dateObject;
}

function dateToDay(date) {
    // calculate the day since Unix Epoch
    //  .unix returns in UTC, so we convert to minutes and add on the utcOffset (then convert from minutes to days)
    //  finally we Math.floor to round downwards to get the current day as an integer
    return Math.floor(((date.unix() / 60) + date.utcOffset()) / 1440);
}

module.exports = Schedule;