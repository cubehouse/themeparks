"use strict";

var s_longitude = Symbol();
var s_latitude = Symbol();

/**
 * GeoLocation class to store theme park locations and supply helper functions
 * @class
 */
class GeoLocation {
    /**
     * @param {Object} location
     * @param {Number} location.longitude - New location's longitude
     * @param {Number} location.latitude - New location's latitude
     * */
    constructor({
        longitude = 0,
        latitude = 0
    }) {
        this[s_longitude] = parseFloat(longitude);
        this[s_latitude] = parseFloat(latitude);

        // validate longitude and latitude
        if (this[s_longitude] === undefined || typeof(this[s_longitude]) != "number") {
            throw new Error("Invalid/Undefined value for longitude: " + this[s_longitude]);
        }
        if (this[s_latitude] === undefined || typeof(this[s_latitude]) != "number") {
            throw new Error("Invalid/Undefined value for latitude: " + this[s_latitude]);
        }

        // wrap longitude and latitude around so they are in a standard format for us to use
        //  longitude should be between -180,180
        this[s_longitude] = this[s_longitude] % 360;
        if (this[s_longitude] > 180) this[s_longitude] -= 360;

        //  latitude should be clamped between -90,90 (if we go too far north, we don't want to wrap around to the south)
        this[s_latitude] = Math.max(-90, Math.min(this[s_latitude], 90));
    }

    /**
     * Return the formatted longitude for this location
     * Formatted as XX°YY′ZZ″
     * @type {String}
     * */
    get Longitude() {
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
    toString() {
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
     * Return a random point between two GeoLocation objects
     * @returns {GeoLocation} New GeoLocation object randomly set between locationA and locationB
     */
    static RandomBetween(locationA, locationB) {
        return new GeoLocation({
            longitude: locationA.LongitudeRaw + (Math.random() * (locationB.LongitudeRaw - locationA.LongitudeRaw)),
            latitude: locationA.LatitudeRaw + (Math.random() * (locationB.LatitudeRaw - locationA.LatitudeRaw)),
        });
    }
}

/**
 * Format a decimal number to [Int]\u00B0 [Remainder]\u2032
 * @private
 * @returns {String} Formatted string representing this number in XX° YY′ ZZ″
 * */
function formatNumberToGeoLocation(number) {
    // work out minutes and seconds for this input
    var locationMinutes = Math.floor((number % 1) * 60);
    var locationSeconds = (((number * 60) % 1) * 60).toFixed(2);

    // return formatted string
    return `${Math.floor(number)}\u00B0${locationMinutes}\u2032${locationSeconds}\u2033`;
}

module.exports = GeoLocation;