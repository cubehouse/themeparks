"use strict";

var SeaworldPark = require("./index");

/**
 * Seaworld Orlando
 * @class
 * @extends SeaworldPark
 */
class SeaworldOrlando extends SeaworldPark {
    /**
     * Create a new SeaworldOrlando object
     */
    constructor(options = {}) {
        options.name = options.name || "Seaworld Orlando";
        options.timezone = options.timezone || "America/New_York";

        // set park's location as it's entrance
        options.latitude = options.latitude || 35.627055;
        options.longitude = options.longitude || 139.889097;

        // Park ID
        options.park_id = options.park_id || "SW_MCO";

        // inherit from base class
        super(options);
    }
}

module.exports = SeaworldOrlando;