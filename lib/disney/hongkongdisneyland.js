"use strict";

// import the base Disney park class
var DisneyBase = require("./index.js");

/**
 * Hong Kong Disneyland
 * @class
 * @extends WaltDisneyWorldPark
 */
class HongKongDisneyland extends DisneyBase {
    /**
     * Create a new HongKongDisneyland object
     */
    constructor(options = {}) {
        options.name = options.name || "Hong Kong Disneyland";
        options.timezone = options.timezone || "Asia/Hong_Kong";

        // set park's location as it's entrance
        options.latitude = options.latitude || 22.3132;
        options.longitude = options.longitude || 114.0445;

        // Disney API configuration for Shanghai Magic Kingdom
        options.resort_id = options.resort_id || "hkdl";
        options.park_id = options.park_id || "desHongKongDisneyland";
        options.park_region = options.park_region || "INTL";

        // inherit from base class
        super(options);
    }

    // I've never witnessed the facilities URL actually work in the live app, so disable it
    GetFacilitiesData() {
        return Promise.resolve({});
    }
}

module.exports = HongKongDisneyland;