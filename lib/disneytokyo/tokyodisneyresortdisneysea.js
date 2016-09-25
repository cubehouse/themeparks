"use strict";

var DisneyTokyoPark = require("./index");

var GeoLocation = require("../geoLocation");

/**
 * Tokyo Disney Resort - Disney Sea
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortDisneySea extends DisneyTokyoPark {
    /**
     * Create a new TokyoDisneyResortDisneySea object
     */
    constructor(options = {}) {
        options.name = options.name || "Tokyo Disney Resort - Disney Sea";
        options.timezone = options.timezone || "Asia/Tokyo";

        // set park's location as it's entrance
        options.latitude = options.latitude || 35.627055;
        options.longitude = options.longitude || 139.889097;

        // Magic Kingdom Park ID
        options.park_id = options.park_id || "tds";
        options.park_kind = options.park_kind || 2;

        // Geofence corners
        options.location_min = new GeoLocation({
            latitude: 35.6277563214705,
            longitude: 139.8811161518097
        });
        options.location_max = new GeoLocation({
            latitude: 35.62465172824325,
            longitude: 139.88948464393616
        });

        // inherit from base class
        super(options);
    }
}

module.exports = TokyoDisneyResortDisneySea;