"use strict";

var Log = require("./debugPrint");
var moment = require("moment-timezone");
var settings = require("./settings");

var s_scheduleDates = Symbol();
var s_scheduleDatesSpecial = Symbol();
var s_scheduleDateFormat = Symbol();
var s_scheduleTimeFormat = Symbol();
var s_scheduleIsDirty = Symbol();

/**
 * @typedef ScheduleData
 * @type Object
 * @property {String} date Date this schedule data applies to (formatted by DateFormat)
 * @property {String} openingTime Opening time for this date (formatted by TimeFormat)
 * @property {String} closingTime Closing time for this date (formatted by TimeFormat)
 * @property {String} type Whether this schedule data refers to an "Operating", "Closed" or "Refurbishment" status
 * @property {SpecialScheduleData[]} special Won't exist if no special times exist for this date
 */

/**
 * @typedef SpecialScheduleData
 * @type Object
 * @property {String} openingTime Opening time for this special schedule data (formatted by TimeFormat)
 * @property {String} closingTime Closing time for this special schedule data (formatted by TimeFormat)
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
     * @param {Object} scheduleConfig
     * @param {String} [scheduleConfig.dateFormat] Moment.js compatible format string to return dates as. See http://momentjs.com/docs/#/displaying/format/
     * @param {String} [scheduleConfig.timeFormat] Moment.js compatible format string to return times as. See http://momentjs.com/docs/#/displaying/format/
     */
    constructor({
        dateFormat = null,
        timeFormat = null,
    } = {}) {
        // use Map for better structure (int -> data)
        //  int is the number of days since Unix Epoch
        this[s_scheduleDates] = new Map();
        // also one for special hours (this is actually int -> data[] to support multiple special times)
        this[s_scheduleDatesSpecial] = new Map();
        // this schedule's date print format
        this[s_scheduleDateFormat] = dateFormat || settings.DefaultDateFormat;
        // this schedule's time print format
        this[s_scheduleTimeFormat] = timeFormat || settings.DefaultTimeFormat;

        // initially, our data is empty, so not really dirty (we don't want to save empty data by mistake)
        this[s_scheduleIsDirty] = false;
    }

    /**
     * Write schedule data to a JSON object
     * @returns {Object} Current schedule data
     */
    toJSON() {
        return {
            dates: this[s_scheduleDates],
            datesSpecial: this[s_scheduleDatesSpecial],
        };
    }

    /**
     * Restore schedule data state from a JSON object
     * @param {Object} Object from toJSON to restore data from
     */
    fromJSON(scheduleData) {
        this[s_scheduleDates] = scheduleData.dates;
        this[s_scheduleDatesSpecial] = scheduleData.datesSpecial;
    }

    /**
     * Whether the data needs to be cached
     * @type {Boolean}
     */
    get IsDirty() {
        return this[s_scheduleIsDirty];
    }

    /**
     * Set the data as dirty
     */
    // TODO - bring this as a private property and make schedules handle their own caching
    set IsDirty(value) {
        this[s_scheduleIsDirty] = value;
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
        var day = dateToDay(date);

        // make sure opening and closing times are in the correct day!
        var todaySet = {
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

            var newScheduleData = {
                "date": date.format(this[s_scheduleDateFormat]),
                "openingTime": openingTime.format(this[s_scheduleTimeFormat]),
                "closingTime": closingTime.format(this[s_scheduleTimeFormat]),
                "type": type
            };

            // check if we already have this data for this day (don't invalidate cache etc if it hasn't changed)
            if (this[s_scheduleDates].has(day)) {
                var checkDirtyObj = this[s_scheduleDates].get(day);
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
            this.IsDirty = true;
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
                this.IsDirty = true;
            }

            var newSpecialScheduleData = {
                "openingTime": openingTime.format(this[s_scheduleTimeFormat]),
                "closingTime": closingTime.format(this[s_scheduleTimeFormat]),
                "type": type
            };

            // check we don't already have this special data in our array
            var newDataStringified = JSON.stringify(newSpecialScheduleData);
            var specialDayArray = this[s_scheduleDatesSpecial].get(day);
            for (var i = 0, checkData; checkData = specialDayArray[i++];) {
                if (JSON.stringify(checkData) == newDataStringified) {
                    // this object already exists, so bail out
                    return false;
                }
            }

            // add our new data to the specials array
            specialDayArray.push(newSpecialScheduleData);

            // we have new data, so mark it as dirty to get cached
            this.IsDirty = true;
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
        var retValue = true;

        // add each day using SetDate
        for (var m = startDate; m.isSameOrBefore(endDate); m.add(1, "days")) {
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
        var day = dateToDay(date);
        if (!this[s_scheduleDates].has(day)) return false;

        var dayData = this[s_scheduleDates].get(day);
        // copy data into the return object (otherwise we end up modifying the actual date data!)
        var returnObject = {
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
        var returnArray = [];
        for (var m = startDate; m.isSameOrBefore(endDate); m.add(1, "days")) {
            var dateSchedule = this.GetDate({
                date: m
            });
            if (dateSchedule) {
                returnArray.push(dateSchedule);
            }
        }

        return returnArray;
    }
}

function parseDateTime(dateObject, varName) {
    // check if it's already a valid Moment object
    if (!moment.isMoment(dateObject)) {
        // try and parse if this is a string
        var newDate = moment(dateObject, [
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