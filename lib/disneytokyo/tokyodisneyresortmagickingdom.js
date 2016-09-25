"use strict";

var DisneyTokyoPark = require("./index");

var GeoLocation = require("../geoLocation");

/**
 * Tokyo Disney Resort - Magic Kingdom
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortMagicKingdom extends DisneyTokyoPark {
    /**
     * Create a new TokyoDisneyResortMagicKingdom object
     */
    constructor(options = {}) {
        options.name = options.name || "Tokyo Disney Resort - Magic Kingdom";
        options.timezone = options.timezone || "Asia/Tokyo";

        // set park's location as it's entrance
        options.latitude = options.latitude || 35.634848;
        options.longitude = options.longitude || 139.879295;

        // Magic Kingdom Park ID
        options.park_id = options.park_id || "tdl";
        options.park_kind = options.park_kind || 1;

        // Geofence corners
        options.location_min = new GeoLocation({
            latitude: 35.63492433179704,
            longitude: 139.87755417823792
        });
        options.location_max = new GeoLocation({
            latitude: 35.63234322451754,
            longitude: 139.8831331729889
        });

        // inherit from base class
        super(options);
    }
}

module.exports = TokyoDisneyResortMagicKingdom;