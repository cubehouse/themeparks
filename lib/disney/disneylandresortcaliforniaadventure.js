"use strict";

// import the base Disney park class
var DisneyBase = require("./index.js");

/**
 * Disneyland Resort - California Adventure
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandResortCaliforniaAdventure extends DisneyBase {
    /**
     * Create a new DisneylandResortCaliforniaAdventure object
     */
    constructor(options = {}) {
        options.name = options.name || "California Adventure - Disneyland Resort";
        options.timezone = options.timezone || "America/Los_Angeles";

        // set park's location as it's entrance
        options.latitude = options.latitude || 33.808720;
        options.longitude = options.longitude || -117.918990;

        // Disney API configuration for Disneyland Resort California Adventure
        options.resort_id = options.resort_id || "80008297";
        options.park_id = options.park_id || "336894";
        options.park_region = options.park_region || "us";

        // inherit from base class
        super(options);
    }

    get FetchWaitTimesURL() {
        // override the wait times URL for Disneyland Resort parks!
        return `${this.APIBase}facility-service/theme-parks/${this.WDWParkID}/wait-times`;
    }

    get FastPassReturnTimes() {
        // override this, as Disneyland Resort supports returning fastPass return times
        return true;
    }
}

module.exports = DisneylandResortCaliforniaAdventure;