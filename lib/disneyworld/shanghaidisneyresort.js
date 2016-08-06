"use strict";

// import the base Disney park class
var DisneyBase = require("./index.js");

/**
 * Shanghai Disney Resort - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class ShanghaiDisneyResortMagicKingdom extends DisneyBase {
    /**
     * Create a new ShanghaiDisneyResortMagicKingdom object
     */
    constructor(options = {}) {
        options.name = options.name || "Magic Kingdom - Shanghai Disney Resort";
        options.timezone = options.timezone || "Asia/Shanghai";

        // set park's location as it's entrance
        options.latitude = options.latitude || 31.1433;
        options.longitude = options.longitude || 121.6580;

        // Disney API configuration for Shanghai Magic Kingdom
        options.resort_id = options.resort_id || "shdr";
        options.park_id = options.park_id || "desShanghaiDisneyland";
        options.park_region = options.park_region || "cn";

        // inherit from base class
        super(options);
    }
}

module.exports = [ShanghaiDisneyResortMagicKingdom];