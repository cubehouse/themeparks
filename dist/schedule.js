"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Schedule = function () {
    /**
     * Create a new Schedule object
     * @param {Object} scheduleConfig
     * @param {String} [scheduleConfig.dateFormat] Moment.js compatible format string to return dates as. See http://momentjs.com/docs/#/displaying/format/
     * @param {String} [scheduleConfig.timeFormat] Moment.js compatible format string to return times as. See http://momentjs.com/docs/#/displaying/format/
     */
    function Schedule() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref$dateFormat = _ref.dateFormat;
        var dateFormat = _ref$dateFormat === undefined ? null : _ref$dateFormat;
        var _ref$timeFormat = _ref.timeFormat;
        var timeFormat = _ref$timeFormat === undefined ? null : _ref$timeFormat;

        _classCallCheck(this, Schedule);

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


    _createClass(Schedule, [{
        key: "toJSON",
        value: function toJSON() {
            return {
                dates: this[s_scheduleDates],
                datesSpecial: this[s_scheduleDatesSpecial]
            };
        }

        /**
         * Restore schedule data state from a JSON object
         * @param {Object} Object from toJSON to restore data from
         */

    }, {
        key: "fromJSON",
        value: function fromJSON(scheduleData) {
            this[s_scheduleDates] = scheduleData.dates;
            this[s_scheduleDatesSpecial] = scheduleData.datesSpecial;
        }

        /**
         * Whether the data needs to be cached
         * @type {Boolean}
         */

    }, {
        key: "SetDate",


        /**
         * Set schedule data for a date
         * @param {Object} scheduleData
         * @param {Moment|String} [scheduleData.date=scheduleData.openingTime] Moment.js date object (or a valid date String to be parsed by Moment JS). Will use openingTime if this is not supplied
         * @param {Moment|String} scheduleData.openingTime Moment.js date object of this day's opening time (or a valid date String to be parsed by Moment JS)
         * @param {Moment|String} scheduleData.closingTime Moment.js date object of this day's closing time (or a valid date String to be parsed by Moment JS)
         * @param {Boolean} [scheduleData.specialHours=false] Is this schedule data part of schedule special hours?
         * @param {String} [scheduleData.type=Operating] The schedule type. Normal schedules should always be "Operating", "Closed" or "Refurbishment". Special schedules can be any String (eg. Extra Magic Hours).
         * @returns {Boolean} success Returns true if the operation was a success and the data was actually changed
         */
        value: function SetDate(_ref2) {
            var _ref2$date = _ref2.date;
            var date = _ref2$date === undefined ? null : _ref2$date;
            var _ref2$openingTime = _ref2.openingTime;
            var openingTime = _ref2$openingTime === undefined ? null : _ref2$openingTime;
            var _ref2$closingTime = _ref2.closingTime;
            var closingTime = _ref2$closingTime === undefined ? null : _ref2$closingTime;
            var _ref2$specialHours = _ref2.specialHours;
            var specialHours = _ref2$specialHours === undefined ? false : _ref2$specialHours;
            var _ref2$type = _ref2.type;
            var type = _ref2$type === undefined ? "Operating" : _ref2$type;

            // if we haven't been supplied a date, use the opening time
            if (!date) date = openingTime;

            // check our date is a valid momentjs object
            date = parseDateTime(date, "date");
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
                    Log("Tried to use invalid schedule type " + type + " for standard schedule data (must be Operating, Closed or Refurbishment)");
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
                    if (checkDirtyObj.date == newScheduleData.date && checkDirtyObj.openingTime == newScheduleData.openingTime && checkDirtyObj.closingTime == newScheduleData.closingTime && checkDirtyObj.type == newScheduleData.type) {
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
                    Log("Tried to use invalid schedule type " + type + " for special schedule data (can't be Operating or Closed)");
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

    }, {
        key: "SetRange",
        value: function SetRange(_ref3) {
            var _ref3$startDate = _ref3.startDate;
            var startDate = _ref3$startDate === undefined ? null : _ref3$startDate;
            var _ref3$endDate = _ref3.endDate;
            var endDate = _ref3$endDate === undefined ? null : _ref3$endDate;
            var _ref3$openingTime = _ref3.openingTime;
            var openingTime = _ref3$openingTime === undefined ? null : _ref3$openingTime;
            var _ref3$closingTime = _ref3.closingTime;
            var closingTime = _ref3$closingTime === undefined ? null : _ref3$closingTime;
            var _ref3$specialHours = _ref3.specialHours;
            var specialHours = _ref3$specialHours === undefined ? false : _ref3$specialHours;
            var _ref3$type = _ref3.type;
            var type = _ref3$type === undefined ? "Operating" : _ref3$type;

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

    }, {
        key: "GetDate",
        value: function GetDate(_ref4) {
            var _ref4$date = _ref4.date;
            var date = _ref4$date === undefined ? null : _ref4$date;

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

    }, {
        key: "GetDateRange",
        value: function GetDateRange(_ref5) {
            var _ref5$startDate = _ref5.startDate;
            var startDate = _ref5$startDate === undefined ? null : _ref5$startDate;
            var _ref5$endDate = _ref5.endDate;
            var endDate = _ref5$endDate === undefined ? null : _ref5$endDate;

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
    }, {
        key: "IsDirty",
        get: function get() {
            return this[s_scheduleIsDirty];
        }

        /**
         * Set the data as dirty
         */
        // TODO - bring this as a private property and make schedules handle their own caching
        ,
        set: function set(value) {
            this[s_scheduleIsDirty] = value;
        }
    }]);

    return Schedule;
}();

function parseDateTime(dateObject, varName) {
    // check if it's already a valid Moment object
    if (!moment.isMoment(dateObject)) {
        // try and parse if this is a string
        var newDate = moment(dateObject, [moment.ISO_8601, settings.DefaultTimeFormat, settings.DefaultDateFormat, "YYYY-MM-DD"]);

        // check if we ended up with a valid timestamp
        if (!newDate.isValid()) {
            Log("Invalid scheduleData." + varName + ":", dateObject);
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
    return Math.floor((date.unix() / 60 + date.utcOffset()) / 1440);
}

module.exports = Schedule;
//# sourceMappingURL=schedule.js.map