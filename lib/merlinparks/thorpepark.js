"use strict";

var MerlinPark = require("./index");

/**
 * Thorpe Park
 * @class
 * @extends MerlinPark
 */
class ThorpePark extends MerlinPark {
    /**
     * Create a new AltonTowers object
     */
    constructor(options = {}) {
        options.name = options.name || "Thorpe Park";
        options.timezone = options.timezone || "Europe/London";

        // set park's location as it's entrance
        options.latitude = options.latitude || 51.4055;
        options.longitude = options.longitude || -0.5105;

        // Park API options
        options.api_key = options.api_key || "a070eedc-db3a-4c69-b55a-b79336ce723f";
        options.initial_data_version = options.initial_data_version || "2017-05-24T09:57:13Z";

        // where the calendar API is hosted for opening times
        options.calendar_base = "https://www.thorpepark.com/";

        // inherit from base class
        super(options);
    }
}

module.exports = ThorpePark;