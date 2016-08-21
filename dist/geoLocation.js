"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var s_longitude = Symbol();
var s_latitude = Symbol();

/**
 * GeoLocation class to store theme park locations and supply helper functions
 * @class
 */

var GeoLocation = function () {
  /**
   * @param {Object} location
   * @param {Number} location.longitude - New location's longitude
   * @param {Number} location.latitude - New location's latitude
   * */
  function GeoLocation(_ref) {
    var _ref$longitude = _ref.longitude;
    var longitude = _ref$longitude === undefined ? 0 : _ref$longitude;
    var _ref$latitude = _ref.latitude;
    var latitude = _ref$latitude === undefined ? 0 : _ref$latitude;

    _classCallCheck(this, GeoLocation);

    this[s_longitude] = longitude;
    this[s_latitude] = latitude;

    // validate longitude and latitude
    if (this[s_longitude] === undefined || typeof this[s_longitude] != "number") {
      throw new Error("Invalid/Undefined value for longitude: " + this[s_longitude]);
    }
    if (this[s_latitude] === undefined || typeof this[s_latitude] != "number") {
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


  _createClass(GeoLocation, [{
    key: "toString",


    /**
     * Return this GeoLocation safe for printing
     * @returns {String} Location String formatted as: ([latitude], [longitude])
     * */
    value: function toString() {
      return "(" + this.Latitude + ", " + this.Longitude + ")";
    }

    /**
     * Return a URL to this park on Google Maps
     * @returns {String} URL to this park on Google Maps
     * */

  }, {
    key: "toGoogleMaps",
    value: function toGoogleMaps() {
      return "http://maps.google.com/?ll=" + this.LatitudeRaw + "," + this.LongitudeRaw;
    }
  }, {
    key: "Longitude",
    get: function get() {
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

  }, {
    key: "LongitudeRaw",
    get: function get() {
      return this[s_longitude];
    }

    /**
     * Return the formatted latitude for this location
     * Formatted as XX°YY′
     * @type {String}
     * */

  }, {
    key: "Latitude",
    get: function get() {
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

  }, {
    key: "LatitudeRaw",
    get: function get() {
      return this[s_latitude];
    }
  }]);

  return GeoLocation;
}();

/**
 * Format a decimal number to [Int]\u00B0 [Remainder]\u2032
 * @private
 * @returns {String} Formatted string representing this number in XX° YY′ ZZ″
 * */


function formatNumberToGeoLocation(number) {
  // work out minutes and seconds for this input
  var locationMinutes = Math.floor(number % 1 * 60);
  var locationSeconds = (number * 60 % 1 * 60).toFixed(2);

  // return formatted string
  return Math.floor(number) + "°" + locationMinutes + "′" + locationSeconds + "″";
}

module.exports = GeoLocation;
//# sourceMappingURL=geoLocation.js.map