"use strict";

// import the base Disney park class
var DisneyBase = require("./index.js");

/**
 * Walt Disney World Hollywood Studios
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldHollywoodStudios extends DisneyBase {
    /**
     * Create a new WaltDisneyWorldHollywoodStudios object
     */
    constructor(options = {}) {
        options.name = options.name || "Hollywood Studios - Walt Disney World Florida";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3575;
        options.longitude = options.longitude || -81.5582;

        // Disney API configuration for Hollywood Studios
        options.resort_id = options.resort_id || "80007798";
        options.park_id = options.park_id || "80007998";
        options.park_region = options.park_region || "us";

        // inherit from base class
        super(options);
    }

    // WDW doesn't support using the facilities API, so turn this off
    GetFacilitiesData() {
        return Promise.resolve({});
    }
}

module.exports = WaltDisneyWorldHollywoodStudios;