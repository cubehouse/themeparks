"use strict";

// import the base Disney park class
var DisneyBase = require("./index.js");

/**
 * Walt Disney World Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldMagicKingdom extends DisneyBase {
    /**
     * Create a new WaltDisneyWorldMagicKingdom object
     */
    constructor(options = {}) {
        options.name = options.name || "Magic Kingdom - Walt Disney World Florida";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3852;
        options.longitude = options.longitude || -81.5639;

        // Disney API configuration for Magic Kingdom
        options.resort_id = options.resort_id || "80007798";
        options.park_id = options.park_id || "80007944";
        options.park_region = options.park_region || "us";

        // inherit from base class
        super(options);
    }

    // WDW doesn't support using the facilities API, so turn this off
    GetFacilitiesData() {
        return Promise.resolve({});
    }
}

module.exports = WaltDisneyWorldMagicKingdom;