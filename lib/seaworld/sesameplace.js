"use strict";

var SeaworldPark = require("./index");

/**
 * Sesame Place
 * @class
 * @extends SeaworldPark
 */
class SesamePlace extends SeaworldPark {
    /**
     * Create a new SesamePlace object
     */
    constructor(options = {}) {
        options.name = options.name || "Sesame Place";
        options.timezone = options.timezone || "America/New_York";

        // set park's location as it's entrance
        options.latitude = options.latitude || 40.185667;
        options.longitude = options.longitude || -74.871460;

        // Park ID
        options.park_id = options.park_id || "SP_PHL";

        // inherit from base class
        super(options);
    }
}

module.exports = SesamePlace;