"use strict";

var UniversalPark = require("./index");

/**
 * Universal Studios Florida
 * @class
 * @extends UniversalPark
 */
class UniversalStudiosFlorida extends UniversalPark {
    /**
     * Create a new UniversalStudiosFlorida object
     */
    constructor(options = {}) {
        options.name = options.name || "Universal Studios Florida";
        options.timezone = options.timezone || "America/New_York";

        // set park's location as it's entrance
        options.latitude = options.latitude || 28.4749822;
        options.longitude = options.longitude || -81.4664970;

        // Univesral park ID
        options.park_id = options.park_id || "10010";

        // inherit from base class
        super(options);
    }
}

module.exports = UniversalStudiosFlorida;