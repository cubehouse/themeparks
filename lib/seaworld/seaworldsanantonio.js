"use strict";

var SeaworldPark = require("./index");

/**
 * Seaworld San Antonio
 * @class
 * @extends SeaworldPark
 */
class SeaworldSanAntonio extends SeaworldPark {
    /**
     * Create a new SeaworldSanAntonio object
     */
    constructor(options = {}) {
        options.name = options.name || "Seaworld San Antonio";
        options.timezone = options.timezone || "America/Chicago";

        // set park's location as it's entrance
        options.latitude = options.latitude || 29.458490;
        options.longitude = options.longitude || -98.699848;

        // Park ID
        options.park_id = options.park_id || "SW_SAT";

        // inherit from base class
        super(options);
    }
}

module.exports = SeaworldSanAntonio;