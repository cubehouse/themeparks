"use strict";

// time/date handling library
const Moment = require("moment-timezone");

// a basic debug log wrapper
const DebugLog = require("./debugPrint.js");

// symbols
const s_Timezone = Symbol();
const s_Name = Symbol();
const s_longitude = Symbol();
const s_latitude = Symbol();
const s_validLocation = Symbol();

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

        // parse longitude and latitude values
        this[s_longitude] = parseFloat(options.longitude);
        this[s_latitude] = parseFloat(options.latitude);

        this[s_validLocation] = (
            (this[s_longitude] !== undefined && typeof(this[s_longitude]) == "number") &&
            (this[s_latitude] !== undefined && typeof(this[s_latitude]) == "number")
        );

        if (this[s_validLocation]) {
            // wrap longitude and latitude around so they are in a standard format for us to use
            //  longitude should be between -180,180
            this[s_longitude] = this[s_longitude] % 360;
            if (this[s_longitude] > 180) this[s_longitude] -= 360;

            //  latitude should be clamped between -90,90 (if we go too far north, we don't want to wrap around to the south)
            this[s_latitude] = Math.max(-90, Math.min(this[s_latitude], 90));
        }

        // timezone
        if (!options.timezone) throw new Error(`No timezone specified for ${this.constructor.name}`);
        this[s_Timezone] = options.timezone;

        // validate timezone with momentjs
        if (!Moment.tz.zone(this[s_Timezone])) {
            throw new Error(`Invalid timezone ${this[s_Timezone]} passed to ${this.constructor.name} constructor.`);
        }

        // Location's name
        this[s_Name] = options.name || "?";

        // check if we've constructed this location already
        if (CreatedLocations[this.constructor.name] && !options.forceCreate) {
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
     * Update this Location's name
     * @type {String}
     */
    set Name(value) {
        this[s_Name] = value;
    }

    /**
     * Get this location's Timezone
     * @type {String}
     * */
    get Timezone() {
        return this[s_Timezone];
    }

    /**
     * Get Location's current date/time
     * @returns {Moment} Current date/time as a Moment object
     * */
    Now() {
        // return current date/time in the target timezone
        return Moment().tz(this.Timezone);
    }

    /**
     * Return whether this location has a valid geolocation
     */
    get IsValid() {
        return this[s_validLocation];
    }

    /**
     * Return the formatted longitude for this location
     * Formatted as XX°YY′ZZ″
     * @type {String}
     * */
    get Longitude() {
        if (!this[s_validLocation]) return "N/A";

        if (this[s_longitude] < 0) {
            return formatNumberToGeoLocation(-this[s_longitude]) + "W";
        } else {
            return formatNumberToGeoLocation(this[s_longitude]) + "E";
        }
    }

    /**
     * Return the raw numeric value of this position's longitude
     * @type {Number}
     * */
    get LongitudeRaw() {
        return this[s_longitude];
    }

    /**
     * Return the formatted latitude for this location
     * Formatted as XX°YY′
     * @type {String}
     * */
    get Latitude() {
        if (!this[s_validLocation]) return "N/A";

        if (this[s_latitude] < 0) {
            return formatNumberToGeoLocation(-this[s_latitude]) + "S";
        } else {
            return formatNumberToGeoLocation(this[s_latitude]) + "N";
        }
    }

    /**
     * Return the raw numeric value of this position's latitude
     * @type {Number}
     * */
    get LatitudeRaw() {
        return this[s_latitude];
    }

    /**
     * Return this GeoLocation safe for printing
     * @returns {String} Location String formatted as: ([latitude], [longitude])
     * */
    get LocationString() {
        return `(${this.Latitude}, ${this.Longitude})`;
    }

    /**
     * Return a URL to this park on Google Maps
     * @returns {String} URL to this park on Google Maps
     * */
    toGoogleMaps() {
        return "http://maps.google.com/?ll=" + this.LatitudeRaw + "," + this.LongitudeRaw;
    }

    /**
     * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
     * @param {...*} ToPrint Objects/strings to print
     * */
    Log() {
        return DebugLog(`${this.constructor.name}:`, ...arguments);
    }

    /**
     * Return a random point within an area defined by lonA, latA, lonB, and latB (a square)
     * @returns {Object} object with longitude and latitude randomly set between locationA and locationB
     */
    static RandomBetween(lonA, latA, lonB, latB) {
        return {
            longitude: lonA + (Math.random() * (lonB - lonA)),
            latitude: latA + (Math.random() * (latB - latA)),
        };
    }
}

/**
 * Format a decimal number to [Int]\u00B0 [Remainder]\u2032
 * @private
 * @returns {String} Formatted string representing this number in XX° YY′ ZZ″
 * */
function formatNumberToGeoLocation(number) {
    // work out minutes and seconds for this input
    const locationMinutes = Math.floor((number % 1) * 60);
    const locationSeconds = (((number * 60) % 1) * 60).toFixed(2);

    // return formatted string
    return `${Math.floor(number)}\u00B0${locationMinutes}\u2032${locationSeconds}\u2033`;
}

module.exports = Location;