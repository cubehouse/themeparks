"use strict";

// import the base Disney park class
var DisneyBase = require("./index.js");

/**
 * Walt Disney World Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldMagicKingdom extends DisneyBase {
    /**
     * Create a new WaltDisneyWorldMagicKingdom object
     */
    constructor(options = {}) {
        options.name = options.name || "Magic Kingdom - Walt Disney World Florida";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3852;
        options.longitude = options.longitude || -81.5639;

        // Disney API configuration for Magic Kingdom
        options.resort_id = options.resort_id || "80007798";
        options.park_id = options.park_id || "80007944";
        options.park_region = options.park_region || "us";

        // inherit from base class
        super(options);
    }
}

/**
 * Walt Disney World Epcot
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldEpcot extends DisneyBase {
    /**
     * Create a new WaltDisneyWorldEpcot object
     */
    constructor(options = {}) {
        options.name = options.name || "Epcot - Walt Disney World Florida";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3747;
        options.longitude = options.longitude || -81.5494;

        // Disney API configuration for Epcot
        options.resort_id = options.resort_id || "80007798";
        options.park_id = options.park_id || "80007838";
        options.park_region = options.park_region || "us";

        // inherit from base class
        super(options);
    }
}

/**
 * Walt Disney World Hollywood Studios
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldHollywoodStudios extends DisneyBase {
    /**
     * Create a new WaltDisneyWorldHollywoodStudios object
     */
    constructor(options = {}) {
        options.name = options.name || "Hollywood Studios - Walt Disney World Florida";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3575;
        options.longitude = options.longitude || -81.5582;

        // Disney API configuration for Hollywood Studios
        options.resort_id = options.resort_id || "80007798";
        options.park_id = options.park_id || "80007998";
        options.park_region = options.park_region || "us";

        // inherit from base class
        super(options);
    }
}

/**
 * Walt Disney World Animal Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldAnimalKingdom extends DisneyBase {
    /**
     * Create a new WaltDisneyWorldAnimalKingdom object
     */
    constructor(options = {}) {
        options.name = options.name || "Animal Kingdom - Walt Disney World Florida";
        options.timezone = options.timezone || "America/New_York";

        // set resort's general center point
        options.latitude = options.latitude || 28.3553;
        options.longitude = options.longitude || -81.5901;

        // Disney API configuration for Animal Kingdom
        options.resort_id = options.resort_id || "80007798";
        options.park_id = options.park_id || "80007823";
        options.park_region = options.park_region || "us";

        // inherit from base class
        super(options);
    }
}

// export all the Florida parks
module.exports = [WaltDisneyWorldMagicKingdom, WaltDisneyWorldEpcot, WaltDisneyWorldHollywoodStudios, WaltDisneyWorldAnimalKingdom];