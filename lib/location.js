"use strict";

// our simple geolocation object library
const GeoLocation = require("./geoLocation.js");
// time/date handling library
const moment = require("moment-timezone");

// symbols
const s_Geolocation = Symbol();
const s_Timezone = Symbol();
const s_Name = Symbol();

// print warning when multiple instances of the same location are created
const CreatedLocations = {};

/**
 * Location class used as base for any themeparks object that has a physical location (parks, resorts, restaurants etc.)
 * @class
 */
class Location {
    /**
     * Create a new Location object
     * @param {Object} options
     * @param {String} options.name The name of this location
     * @param {String} options.timezone Location's timezone
     * @param {Number} options.latitude Location's latitude
     * @param {Number} options.longitude Location's longitude
     */
    constructor(options = {}) {
        if (this.constructor === Location) {
            throw new Error("Cannot create Location object directly");
        }

        // create a geolocation object if we've been passed a longitude and latitude
        if (!this[s_Geolocation] && typeof(options.latitude) == "number" && typeof(options.longitude) == "number") {
            this[s_Geolocation] = new GeoLocation({
                longitude: options.longitude,
                latitude: options.latitude
            });
        }

        // validate our geolocation object has been created
        if (!this[s_Geolocation]) {
            throw new Error(`No GeoLocation object created for ${this.constructor.name}. Please supply longitude and latitude.`);
        }

        // timezone
        if (!options.timezone) throw new Error(`No timezone specified for ${this.constructor.name}`);
        this[s_Timezone] = options.timezone;

        // validate timezone with momentjs
        if (!moment.tz.zone(this[s_Timezone])) {
            throw new Error(`Invalid timezone ${this[s_Timezone]} passed to ${this.constructor.name} constructor.`);
        }

        // Location's name
        if (!options.name) throw new Error(`No name specified for ${this.constructor.name}`);
        this[s_Name] = options.name;

        // check if we've constructed this location already
        if (CreatedLocations[this.constructor.name] && !options.force_create) {
            throw new Error(`\n Failed to create second instance of "${this.constructor.name}" object.\n Please only create one instance of each location and re-use it.`);
        }
        CreatedLocations[this.constructor.name] = true;
    }

    /**
     * Get this Location's name in a human-readable form
     * @type {String}
     * */
    get Name() {
        return this[s_Name];
    }

    /**
     * Get this location's geolocation object
     * @type {GeoLocation}
     * */
    get Location() {
        return this[s_Geolocation];
    }

    /**
     * Get this location's Timezone
     * @type {String}
     * */
    get Timezone() {
        return this[s_Timezone];
    }

    /**
     * Get Location's current time
     * @param {Object} timeFormatObject
     * @param {String} [timeFormatObject.timeFormat=YYYY-MM-DDTHH:mm:ssZ] Moment JS format string to return time as
     * @returns {String} Current time
     * */
    TimeNow({
        timeFormat = null
    } = {}) {
        // take time right now, convert now into park's timezone and format it
        //  use a standard time format unless we're passed a format in
        return moment().tz(this.Timezone).format(timeFormat || "YYYY-MM-DDTHH:mm:ssZ");
    }

    /**
     * Get Location's current date
     * @param {Object} dateFormatObject
     * @param {String} [dateFormatObject.dateFormat=YYYY-MM-DD] Moment JS format string to format date as
     * @returns {String} Current date
     * */
    DateNow({
        dateFormat = null
    } = {}) {
        // we're just calling the TimeNow function with a custom date format
        return this.TimeNow({
            timeFormat: dateFormat || "YYYY-MM-DD"
        });
    }
}

module.exports = Location;