"use strict";

var Log = require("./debugPrint");
var moment = require("moment-timezone");
var settings = require("./settings");

var s_scheduleDates = Symbol();
var s_scheduleDatesSpecial = Symbol();
var s_scheduleDateFormat = Symbol();
var s_scheduleTimeFormat = Symbol();

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
    }

    /**
     * Set schedule data for a date
     * @param {Object} scheduleData
     * @param {Moment} [scheduleData.date=scheduleData.openingTime] Moment.js date object (will use openingTime if this is not supplied)
     * @param {Moment} scheduleData.openingTime Moment.js date object of this day's opening time
     * @param {Moment} scheduleData.closingTime Moment.js date object of this day's closing time
     * @param {Boolean} [scheduleData.specialHours=false] Is this schedule data part of schedule special hours?
     * @param {String} [scheduleData.scheduleType=Operating] The schedule type. Normal schedules should always be "Operating" or "Closed". Special schedules can be any String (eg. Extra Magic Hours). 
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
        scheduleType = "Operating"
    }) {
        // if we haven't been supplied a date, use the opening time
        if (!date) date = openingTime;

        // check our date is a valid momentjs object
        if (!moment.isMoment(date)) {
            Log("Invalid scheduleData.date passed to SetDate", date);
            return false;
        }
        // check opening and closing times
        if (!moment.isMoment(openingTime)) {
            Log("Invalid scheduleData.openingTime passed to SetDate", date);
            return false;
        }
        if (!moment.isMoment(closingTime)) {
            Log("Invalid scheduleData.closingTime passed to SetDate", date);
            return false;
        }

        // calculate the day since Unix Epoch
        //  .unix returns in UTC, so we convert to minutes and add on the utcOffset (then convert from minutes to days)
        //  finally we Math.floor to round downwards to get the current day as an integer
        var day = Math.floor(((date.unix() / 60) + date.utcOffset()) / 1440);

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
            if (scheduleType != "Operating" && scheduleType != "Closed") {
                Log(`Tried to use invalid schduleType ${scheduleType} for standard schedule data (must be Operating or Closed)`);
                return false;
            }

            // set this day's schedule data
            this[s_scheduleDates].set(day, {
                "date": date.format(this[s_scheduleDateFormat]),
                "openingTime": openingTime.format(this[s_scheduleTimeFormat]),
                "closingTime": closingTime.format(this[s_scheduleTimeFormat]),
                "type": scheduleType
            });
        } else {
            // add a new special hours array if we don't already have one
            if (!this[s_scheduleDatesSpecial].has(day)) {
                this[s_scheduleDatesSpecial].set(day, []);
            }

            // add our new data to the specials array
            this[s_scheduleDatesSpecial].get(day).push({
                "openingTime": openingTime.format(this[s_scheduleTimeFormat]),
                "closingTime": closingTime.format(this[s_scheduleTimeFormat]),
                "type": scheduleType
            });
        }

        return true;
    }

    /**
     * Set a range of dates with the same schedule data
     * @param {Object} scheduleData
     * @param {Moment} scheduleData.startDate Moment.js date object to start schedule date range
     * @param {Moment} scheduleData.endDate Moment.js date object to end schedule date range
     * @param {Moment} scheduleData.openingTime Moment.js date object of this day's opening time
     * @param {Moment} scheduleData.closingTime Moment.js date object of this day's closing time
     * @param {Boolean} [scheduleData.specialHours=false] Is this schedule data part of schedule special hours?
     * @param {String} [scheduleData.scheduleType=Operating] The schedule type. Normal schedules should always be "Operating" or "Closed". Special schedules can be any String (eg. Extra Magic Hours). 
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
        scheduleType = "Operating"
    }) {
        if (!moment.isMoment(startDate)) {
            Log("Invalid scheduleData.startDate passed to SetRange", startDate);
            return false;
        }
        if (!moment.isMoment(endDate)) {
            Log("Invalid scheduleData.endDate passed to SetRange", endDate);
            return false;
        }
        if (!moment.isMoment(openingTime)) {
            Log("Invalid scheduleData.openingTime passed to SetRange", openingTime);
            return false;
        }
        if (!moment.isMoment(closingTime)) {
            Log("Invalid scheduleData.openingTime passed to SetRange", closingTime);
            return false;
        }

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
                scheduleType: scheduleType
            });
        }

        return retValue;
    }
}

module.exports = Schedule;