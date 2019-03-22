"use strict";

// import the base Disney park class
var DisneyBase = require("./index.js");

/**
 * Disneyland Paris - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandParisMagicKingdom extends DisneyBase {
    /**
     * Create a new DisneylandParisMagicKingdom object
     */
    constructor(options = {}) {
        options.name = options.name || "Magic Kingdom - Disneyland Paris";
        options.timezone = options.timezone || "Europe/Paris";

        // set park's location as it's entrance
        options.latitude = options.latitude || 48.870321;
        options.longitude = options.longitude || 2.779672;

        // Disney API configuration for Disneyland Paris Magic Kingdom
        options.resort_id = options.resort_id || "dlp";
        options.park_id = options.park_id || "P1";
        options.park_region = options.park_region || "fr";

        // inherit from base class
        super(options);
    }

    // override API URLs to use the Paris services
    /**
     * The URL used to request this park's schedule data
     * @type {String}
     */
    get FetchScheduleTimesURL() {
        return `${this.APIBase}explorer-service/public/ancestor-activities-schedules/dlp;entityType=destination`;
    }

    /**
     * The URL used to request the park's facilities data
     * @type {String}
     */
    get FetchFacilitiesURL() {
        return `${this.APIBase}explorer-service/public/destinations/dlp;entityType\u003ddestination/facilities?region=fr`;
    }
}

module.exports = DisneylandParisMagicKingdom;