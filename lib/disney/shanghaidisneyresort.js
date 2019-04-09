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

    // override API URLs to use the Shanghai services (facilities data doesn't work for Shanghai using normal WDW URLs?)
    get AuthURL() {
        return "https://authorization.shanghaidisneyresort.com/curoauth/v1/token";
    }
    get AuthString() {
        return "grant_type=assertion&assertion_type=public&client_id=DPRD-SHDR.MOBILE.ANDROID-PROD";
    }
    get APIBase() {
        return "https://apim.shanghaidisneyresort.com/";
    }
    get FetchFacilitiesURL() {
        return `${this.APIBase}explorer-service/public/destinations/shdr;entityType\u003ddestination/facilities?region=cn`;
    }
    get FetchScheduleTimesURL() {
        return `${this.APIBase}explorer-service/public/ancestor-activities-schedules/shdr;entityType=destination`;
    }
}

module.exports = ShanghaiDisneyResortMagicKingdom;