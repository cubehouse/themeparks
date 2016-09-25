"use strict";

var SeaworldPark = require("./index");

/**
 * Seaworld San Diego
 * @class
 * @extends SeaworldPark
 */
class SeaworldSanDiego extends SeaworldPark {
    /**
     * Create a new SeaworldSanDiego object
     */
    constructor(options = {}) {
        options.name = options.name || "Seaworld San Diego";
        options.timezone = options.timezone || "America/Los_Angeles";

        // set park's location as it's entrance
        options.latitude = options.latitude || 32.764302;
        options.longitude = options.longitude || -117.226441;

        // Park ID
        options.park_id = options.park_id || "SW_SAN";

        // inherit from base class
        super(options);
    }
}

module.exports = SeaworldSanDiego;