"use strict";

var Log = require("./debugPrint");
var moment = require("moment-timezone");
var Promise = require("bluebird");

var s_scheduleDates = Symbol();
var s_scheduleDatesSpecial = Symbol();

/**
 * Schedule class to hold opening and closing times for parks and rides etc.
 * Supports standard and "special" opening times
 * @class
 */
class Schedule {
    constructor() {
        // use Map for better structure (int -> data)
        //  int is the number of days since Unix Epoch
        this[s_scheduleDates] = new Map();
        // also one for special hours (this is actually int -> data[] to support multiple special times)
        this[s_scheduleDatesSpecial] = new Map();
    }

    /**
     * Set schedule data for a date
     * @param {Object} scheduleData
     * @param {Moment} scheduleData.date Moment.js date object
     * @param {Moment} scheduleData.openingTime Moment.js date object of this day's opening time
     * @param {Moment} scheduleData.closingTime Moment.js date object of this day's closing time
     * @param {Boolean} [scheduleData.specialHours=false] Is this schedule data part of schedule special hours?
     */
    SetDate({
        // the day to set the schedule data for
        // TODO - do I need this if I have the opening time???
        date = null,
        // opening time for this day
        openingTime = null,
        // closing time for this day
        closingTime = null,
        // is this special hours data? (default: false)
        specialHours = false,
    }) {
        // check our date is a valid momentjs object
        if (!moment.isMoment(date)) return false;

        // calculate the day since Unix Epoch
        //  .unix returns in UTC, so we convert to minutes and add on the utcOffset (then convert from minutes to days)
        //  finally we Math.floor to round downwards to get the current day as an integer
        var day = Math.floor(((date.unix() / 60) + date.utcOffset()) / 1440);

        // TODO - build schedule data object and make it returnable
        if (!specialHours) {
            // set this day's schedule data
            this[s_scheduleDates].set(day, {});
        } else {
            // add a new special hours array if we don't already have one
            if (!this[s_scheduleDatesSpecial].has(day)) {
                this[s_scheduleDatesSpecial].set(day, []);
            }

            // add our new data to the specials array
            this[s_scheduleDatesSpecial].get(day).push({});
        }

        return true;
    }

    SetRange() {

    }
}

module.exports = Schedule;