"use strict";

// import the base Herschend class
var HerschendBase = require("./index.js");

/**
 * SilverDollarCity
 * @class
 * @extends HerschendBase
 */
class SilverDollarCity extends HerschendBase {
    /**
     * Create a new SilverDollarCity object
     */
    constructor(options = {}) {
        options.name = options.name || "Silver Dollar City";
        options.timezone = options.timezone || "America/Chicago";

        // set resort's general center point
        options.latitude = options.latitude || 36.668177;
        options.longitude = options.longitude || -93.338567;

        // inherit from base class
        super(options);

        // Herschend API Configuration
        this.park_id = 2;

    }
}

module.exports = SilverDollarCity;
