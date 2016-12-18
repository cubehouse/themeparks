"use strict";

var UniversalPark = require("./index");

/**
 * Universal Studios Hollywood
 * @class
 * @extends UniversalPark
 */
class UniversalStudiosHollywood extends UniversalPark {
    /**
     * Create a new UniversalStudiosHollywood object
     */
    constructor(options = {}) {
        options.name = options.name || "Universal Studios Hollywood";
        options.timezone = options.timezone || "America/Los_Angeles";

        // set park's location as it's entrance
        options.latitude = options.latitude || 34.137261;
        options.longitude = options.longitude || -118.355516;

        // Univesral park ID
        options.park_id = options.park_id || 13825;

        // Universal Hollywood also sets the "city" mode
        options.park_city = "hollywood";

        // inherit from base class
        super(options);
    }
}

module.exports = UniversalStudiosHollywood;