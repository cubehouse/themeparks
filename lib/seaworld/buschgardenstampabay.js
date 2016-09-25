"use strict";

var SeaworldPark = require("./index");

/**
 * Busch Gardens - Tampa Bay
 * @class
 * @extends SeaworldPark
 */
class BuschGardensTampaBay extends SeaworldPark {
    /**
     * Create a new BuschGardensTampaBay object
     */
    constructor(options = {}) {
        options.name = options.name || "Busch Gardens - Tampa Bay";
        options.timezone = options.timezone || "America/New_York";

        // set park's location as it's entrance
        options.latitude = options.latitude || 28.033594;
        options.longitude = options.longitude || -82.420700;

        // Park ID
        options.park_id = options.park_id || "BG_TPA";

        // inherit from base class
        super(options);
    }
}

module.exports = BuschGardensTampaBay;