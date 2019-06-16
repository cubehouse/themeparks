const moment = require('moment-timezone');
const Log = require('./debugPrint');
const settings = require('./settings');
const Cache = require('./cache');

const sScheduleDates = Symbol('Schedule Regular Dates');
const sScheduleDatesSpecial = Symbol('Schedule Special Dates');
const sCache = Symbol('Cache');
const sCachePopulated = Symbol('Cache Populated State');
const sCacheWaitCallbacks = Symbol('Cache Initiated Callbacks');
const sCacheTimer = Symbol('Cache Timer');

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

function dateToDay(date) {
  // calculate the day since Unix Epoch
  //  .unix returns in UTC, so we convert to minutes and add on the utcOffset (then convert from minutes to days)
  //  finally we Math.floor to round downwards to get the current day as an integer
  return Math.floor(((date.unix() / 60) + date.utcOffset()) / 1440);
}

function parseDateTime(dateObject, varName) {
  let returnDate = dateObject;

  // check if it's already a valid Moment object
  if (!moment.isMoment(dateObject)) {
    // try and parse if this is a string
    returnDate = moment(dateObject, [
      moment.ISO_8601,
      settings.DefaultTimeFormat,
      settings.DefaultDateFormat,
      'YYYY-MM-DD',
    ]);

    // check if we ended up with a valid timestamp
    if (!returnDate.isValid()) {
      Log(`Invalid scheduleData.${varName}:`, returnDate);
      return false;
    }
  }

  // we got this far, success! return the new Moment object (or the original one if it was always good!)
  return returnDate;
}

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
    this[sScheduleDates] = new Map();
    // also one for special hours (this is actually int -> data[] to support multiple special times)
    this[sScheduleDatesSpecial] = new Map();

    // setup our cache object
    if (options.id === undefined) throw new Error('No id passed for schedule object');
    this[sCache] = new Cache({
      prefix: `schedule_${options.id}`,
    });
    // store flag of whether we've populated ourselves with cache data yet
    this[sCachePopulated] = false;
    this[sCacheWaitCallbacks] = [];

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
    type = 'Operating',
  }) {
    let newDate = date !== null ? date.clone() : null;
    let newOpeningTime = openingTime !== null ? openingTime.clone() : null;
    let newClosingTime = closingTime !== null ? closingTime.clone() : null;

    // if we haven't been supplied a date, use the opening time
    if (!newDate) newDate = openingTime.clone();

    // check our date is a valid momentjs object
    newDate = parseDateTime(newDate, 'date');

    // special case, if this is a closed date, support not passing in opening and closing times
    if (type === 'Closed') {
      if (!openingTime) newOpeningTime = newDate.startOf('day');
      if (!closingTime) newClosingTime = newDate.endOf('day');
    }

    newOpeningTime = parseDateTime(newOpeningTime, 'openingTime');
    newClosingTime = parseDateTime(newClosingTime, 'closingTime');

    // if any of our dates are invalid, return false
    if (!newDate || !newOpeningTime || !newClosingTime) return false;

    // calculate the days since Unix Epoch
    const day = dateToDay(newDate);

    // make sure opening and closing times are in the correct day!
    const todaySet = {
      year: newDate.year(),
      month: newDate.month(),
      date: newDate.date(),
    };
    newOpeningTime.set(todaySet);
    newClosingTime.set(todaySet);

    // work out if the closing time is in the following day
    if (newClosingTime.isBefore(newOpeningTime)) {
      // add 1 day if the closing time comes before the opening time (implying it's open past midnight!)
      newClosingTime.add(1, 'day');
    }

    // build schedule data object and add it to our schedule map
    if (!specialHours) {
      // check our schedule type is sane
      if (type !== 'Operating' && type !== 'Closed' && type !== 'Refurbishment') {
        Log(`Tried to use invalid schedule type ${type} for standard schedule data (must be Operating, Closed or Refurbishment)`);
        return false;
      }

      const newScheduleData = {
        date: newDate,
        openingTime: newOpeningTime,
        closingTime: newClosingTime,
        type,
      };

      // check if we already have this data for this day (don't invalidate cache etc if it hasn't changed)
      if (this[sScheduleDates].has(day)) {
        const checkDirtyObj = this[sScheduleDates].get(day);
        if (
          checkDirtyObj.date === newScheduleData.date
          && checkDirtyObj.openingTime === newScheduleData.openingTime
          && checkDirtyObj.closingTime === newScheduleData.closingTime
          && checkDirtyObj.type === newScheduleData.type) {
          // data is identical to existing object, don't update
          return false;
        }
      }

      // set this day's schedule data
      this[sScheduleDates].set(day, newScheduleData);

      // we have new data, so mark it as dirty to get cached
      this.RequestCache();
    } else {
      // special hours can't be Operating or Closed, that is for normal hours
      if (type === 'Operating' || type === 'Closed') {
        Log(`Tried to use invalid schedule type ${type} for special schedule data (can't be Operating or Closed)`);
        return false;
      }

      // add a new special hours array if we don't already have one
      if (!this[sScheduleDatesSpecial].has(day)) {
        this[sScheduleDatesSpecial].set(day, []);

        // we have new data, so mark it as dirty to get cached
        this.RequestCache();
      }

      const newSpecialScheduleData = {
        openingTime: newOpeningTime,
        closingTime: newClosingTime,
        type,
      };

      // try to find existing special hours in our date data (so we don't add it multiple times)
      const specialDayArray = this[sScheduleDatesSpecial].get(day);
      const existingEntry = specialDayArray.find((specialDayEntry) => {
        if (specialDayEntry.openingTime.isSame(newSpecialScheduleData.openingTime, 'minute')
          && specialDayEntry.closingTime.isSame(newSpecialScheduleData.closingTime, 'minute')
          && specialDayEntry.type === newSpecialScheduleData.type) {
          return true;
        }
        return false;
      });

      if (existingEntry !== undefined) {
        return false;
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
    type = 'Operating',
  }) {
    // check our input dates are valid
    const newStartDate = parseDateTime(startDate, 'startDate');
    const newEndDate = parseDateTime(endDate, 'endDate');
    const newOpeningTime = parseDateTime(openingTime || startDate, 'openingTime');
    const newClosingTime = parseDateTime(closingTime || endDate, 'closingTime');

    // if any of our dates are invalid, return false
    if (!newStartDate || !newEndDate || !newOpeningTime || !newClosingTime) return false;

    // if any of our dates result in invalid data, return false
    let retValue = true;

    // add each day using SetDate
    for (let m = newStartDate; m.isSameOrBefore(newEndDate); m.add(1, 'days')) {
      const dateOpeningTime = m.clone().hours(newOpeningTime.hours()).minutes(newOpeningTime.minutes());
      const dateClosingTime = m.clone().hours(newClosingTime.hours()).minutes(newClosingTime.minutes());

      // retValue AND= means this becomes false with any one failed result
      //  if we do fail, we also just keep going to try and get as much done as possible :)
      const successfulSet = this.SetDate({
        date: m,
        openingTime: dateOpeningTime,
        closingTime: dateClosingTime,
        specialHours,
        type,
      });

      retValue = retValue && successfulSet;
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
    date = null,
  }) {
    // check our date is valid
    const newDate = parseDateTime(date, 'date');
    if (!newDate) return undefined;

    // do we have this day in our schedule data?
    const day = dateToDay(newDate);

    if (!this[sScheduleDates].has(day)) return undefined;

    const dayData = this[sScheduleDates].get(day);
    // copy data into the return object (otherwise we end up modifying the actual date data!)
    const returnObject = {
      date: dayData.date.format('YYYY-MM-DD'),
      openingTime: dayData.openingTime.format(),
      closingTime: dayData.closingTime.format(),
      type: dayData.type,
    };

    // add special schedules if we have any!
    if (this[sScheduleDatesSpecial].has(day)) {
      const specialHours = this[sScheduleDatesSpecial].get(day);

      returnObject.special = [];
      specialHours.forEach((specialHour) => {
        returnObject.special.push({
          openingTime: specialHour.openingTime.format(),
          closingTime: specialHour.closingTime.format(),
          type: specialHour.type,
        });
      });
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
    const newStartDate = parseDateTime(startDate, 'startDate');
    const newEndDate = parseDateTime(endDate, 'endDate');
    if (!newStartDate || !newEndDate) return [];

    // fetch each day of the range and add it to our result
    const returnArray = [];
    for (let m = newStartDate; m.isSameOrBefore(newEndDate); m.add(1, 'days')) {
      const dateSchedule = this.GetDate({
        date: m,
      });
      if (dateSchedule !== undefined) {
        returnArray.push(dateSchedule);
      }
    }

    return returnArray;
  }

  /**
   * Return today's park schedule
   * This function will take into account park hours going past midnight
   */
  GetCurrentParkSchedule() {
    const now = moment.tz(this.Timezone);
    const anHourAgo = now.clone().subtract(1, 'hour');
    const yesterday = now.clone().subtract(1, 'day');
    const yesterdaysCalendar = this.GetDate({
      date: yesterday,
    });

    // test if we're still within an hour of yesterday's calendar
    if (yesterdaysCalendar !== undefined && moment(yesterdaysCalendar.closingTime).isAfter(anHourAgo)) {
      return yesterdaysCalendar;
    }

    // test if we're still within an hour of today's calendar
    const todaysCalendar = this.GetDate({
      date: now,
    });
    if (todaysCalendar !== undefined && moment(todaysCalendar.closingTime).isAfter(anHourAgo)) {
      return todaysCalendar;
    }

    // otherwise, return tomorrow's calendar
    return this.GetDate({
      date: now.clone().add(1, 'day'),
    });
  }

  /**
   * Get our cache object
   */
  get Cache() {
    return this[sCache];
  }

  /**
   * Request a cache to happen at the next best opportunity
   */
  RequestCache() {
    // if other caching was queued up, skip it
    if (this[sCacheTimer] !== undefined) {
      clearTimeout(this[sCacheTimer]);
    }

    // schedule caching in half a second
    this[sCacheTimer] = setTimeout(this.WriteToCache.bind(this), 500);
  }

  /**
   * Write schedule data to the cache
   */
  WriteToCache() {
    // if any timer exists for caching, clear it out, we're caching right now
    if (this[sCacheTimer] !== undefined) {
      clearTimeout(this[sCacheTimer]);
    }

    // delete old data (older than 3 days to be safe)
    const threeDaysAgo = dateToDay(moment().subtract(3, 'days'));
    const checkMapForDelete = (value, key, map) => {
      if (key <= threeDaysAgo) {
        map.delete(key);
      }
    };
    this[sScheduleDates].forEach(checkMapForDelete);
    this[sScheduleDatesSpecial].forEach(checkMapForDelete);

    // write data to cache
    return this.Cache.Set('dates', {
      // serialize Map as an array
      dates: [...this[sScheduleDates]],
      special: [...this[sScheduleDatesSpecial]],
    }, 60 * 60 * 6);
  }

  /**
   * Check the cache has been setup. Returns resolved Promise once it is
   */
  CheckCacheStatus() {
    if (this[sCachePopulated]) return Promise.resolve();

    return new Promise((resolve) => {
      // add our Promise resolve to our callback stack
      this[sCacheWaitCallbacks].push(resolve);

      // if we're the first to request the cache state, then actually do it...
      if (this[sCacheWaitCallbacks].length === 1) {
        // request cache read
        this.ReadFromCache().then(() => {
          // fire callbacks if they are present
          if (this[sCacheWaitCallbacks] && this[sCacheWaitCallbacks].length) {
            this[sCacheWaitCallbacks].forEach((cb) => {
              cb();
            });
            this[sCacheWaitCallbacks] = [];
          }
        });
      }
    });
  }

  /**
   * Read data from cache
   */
  ReadFromCache() {
    return this.Cache.Get('dates').then((data) => {
      // mark cache as populated so we don't try and read again
      this[sCachePopulated] = true;

      // if data is valid, update our internal state
      if (data && data.dates && data.special) {
        this[sScheduleDates] = Object.getPrototypeOf(data.dates) === Map.prototype ? data.dates : new Map(data.dates);
        this[sScheduleDatesSpecial] = Object.getPrototypeOf(data.special) === Map.prototype ? data.special : new Map(data.special);
      }

      return Promise.resolve(data);
    });
  }
}

module.exports = Schedule;
