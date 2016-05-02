"use strict";

// source-map support for ES6 compiled code
import 'source-map-support/register'

import GeoLocation from './geoLocation.js';
import DebugLog from './debugPrint.js';

// default settings for parks
var DefaultSettings = {
  name: "Default Park",
  timezone: "Europe/London"
};

// park symbols
var s_parkName = Symbol();
var s_parkTimezone = Symbol();
var s_parkGeolocation = Symbol();

// base park class, all other parks should inherit from this
export default class Park {
  constructor(options = {}) {
    // take base variables from the constructor
    //  these variables should be present for all parks
    // what's up with these OR things?
    //  by default, use any manually passed in options
    //  finally, fallback on the default settings
    this[s_parkName] = options.name || DefaultSettings.name;
    this[s_parkTimezone] = options.timezone || DefaultSettings.timezone;

    // create a geolocation object if we've been passed a longitude and latitude
    if (!this[s_parkGeolocation] && options.latitude && options.longitude) {
      this[s_parkGeolocation] = new GeoLocation({
        longitude: options.longitude,
        latitude: options.latitude
      });
    }
  }

  /**
   * Get this park's geographical latitude
   * @returns {number} park's latitiude
   */
  get Latitude() {
    return this[s_parkGeolocation].latitude;
  }

  /**
   * Get this park's geographical longitude
   * @returns {number} park's longitude
   */
  get Longitude() {
    return this[s_parkGeolocation].longitude;
  }

  /**
   * Get this park's geolocation object
   * @returns {GeoLocation} park location object (see GeoLocation.js)
   */
  get Location() {
    return this[s_parkGeolocation];
  }

  /**
   * Get this park's name in a human-readable form
   * @returns {string} Park name
   */
  get Name() {
    return this[s_parkName];
  }

  /**
   * Get this park's Timezone
   * @returns {string} Park's timezone in TZ format (https://en.wikipedia.org/wiki/Tz_database)
   */
  get Timezone() {
    return this[s_parkTimezone];
  }

  /**
   * Set this park's geo location, given a longitude and latitude
   * @param longitude {number} Park's longitude
   * @param latitude {number} Park's latitude
   */
  SetGeoLocation({
    longitude = 0,
    latitude = 0
  }) {
    this[s_parkGeolocation] = new GeoLocation({
      longitude: longitude,
      latitude: latitude
    });
  }

  /**
   * Debug print a message
   * @param objects/strings to print
   */
  Log() {
    return DebugLog(...arguments);
  }
}