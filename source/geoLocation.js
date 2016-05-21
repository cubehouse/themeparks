"use strict";

var s_longitude = Symbol();
var s_latitude = Symbol();

export default class GeoLocation {
  /**
   * GeoLocation class to store theme park locations and supply helper functions
   * @param longitude
   * @param latitude
   */
  constructor({
    longitude = 0,
    latitude = 0
  }) {
    this[s_longitude] = longitude;
    this[s_latitude] = latitude;

    // validate longitude and latitude
    if (this[s_longitude] === undefined || typeof (this[s_longitude]) != "number") {
      throw new Error("Invalid/Undefined value for longitude: " + this[s_longitude]);
    }
    if (this[s_latitude] === undefined || typeof (this[s_latitude]) != "number") {
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
   * @returns {string} Longitude formatted as XX°YY′
   */
  get Longitude() {
    if (this[s_longitude] < 0) {
      return formatNumberToGeoLocation(-this[s_longitude]) + "W";
    } else {
      return formatNumberToGeoLocation(this[s_longitude]) + "E";
    }
  }
  
  /**
   * Return the raw numeric value of this position's longitude
   * @return {number} This location's longitude
   */
  get LongitudeRaw() {
    return this[s_longitude];
  }

  /**
   * Return the formatted latitude for this location
   * @returns {string} Latitude formatted as XX°YY′
   */
  get Latitude() {
    if (this[s_latitude] < 0) {
      return formatNumberToGeoLocation(-this[s_latitude]) + "S";
    } else {
      return formatNumberToGeoLocation(this[s_latitude]) + "N";
    }
  }
  
  /**
   * Return the raw numeric value of this position's latitude
   * @return {number} This location's latitude
   */
  get LatitudeRaw() {
    return this[s_latitude];
  }

  /**
   * Return this GeoLocation safe for printing
   * @returns {string} String formatted as: ([latitude], [longitude])
   */
  toString() {
    return `(${this.Latitude}, ${this.Longitude})`;
  }

  /**
   * Return a URL to this park on Google Maps
   * @returns {string} URL to this park on Google Maps
   */
  toGoogleMaps() {
    return "http://maps.google.com/?ll=" + this.latitude + "," + this.longitude;
  }
}

/**
 * Format a decimal number to [Int]\u00B0 [Remainder]\u2032
 * @returns {string} Formatted string representing this number in XX° YY′
 * */
function formatNumberToGeoLocation(number) {
  return `${Math.floor(number)}\u00B0${(number % 1).toFixed(2)}\u2032`;
}