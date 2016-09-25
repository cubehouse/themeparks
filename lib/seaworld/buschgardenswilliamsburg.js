"use strict";

var SeaworldPark = require("./index");

/**
 * Busch Gardens - Williamsburg
 * @class
 * @extends SeaworldPark
 */
class BuschGardensWilliamsburg extends SeaworldPark {
    /**
     * Create a new BuschGardensWilliamsburg object
     */
    constructor(options = {}) {
        options.name = options.name || "Busch Gardens - Williamsburg";
        options.timezone = options.timezone || "America/New_York";

        // set park's location as it's entrance
        options.latitude = options.latitude || 37.237225;
        options.longitude = options.longitude || -76.645128;

        // Park ID
        options.park_id = options.park_id || "BG_PHF";

        // inherit from base class
        super(options);
    }
}

module.exports = BuschGardensWilliamsburg;