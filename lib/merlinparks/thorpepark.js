"use strict";

var MerlinPark = require("./index");
const defaultFallbackData = require("./thorpepark_data.json");

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
        options.useragent = "okhttp/3.9.1";

        // set park's location as it's entrance
        options.latitude = options.latitude || 51.4055;
        options.longitude = options.longitude || -0.5105;

        // Park API options
        options.api_key = options.api_key || "a070eedc-db3a-4c69-b55a-b79336ce723f";
        options.app_version = options.app_version || "1.1.72";
        options.app_build = options.app_build || "79";
        options.initial_data_version = options.initial_data_version || "2019-04-17T12:50:44Z";

        // Fallback data if the /data webservice doesn't work
        options.fallback_data = options.fallback_data || defaultFallbackData;

        // inherit from base class
        super(options);
    }

    FetchOpeningTimes() {
        return this.HTTP({
            url: "https://www.thorpepark.com/Umbraco/Api/Calendar/GetAllOpeningTimes",
            method: "GET",
            headers: {
                "Referer": "https://www.thorpepark.com/resort-info/opening-times-and-travel",
                "X-Requested-With": "XMLHttpRequest",
            }
        }).then((calendarData) => {
            for (let i = 0, timeRange; timeRange = calendarData[i++];) {
                // The API response only contains dates where the park is open
                this.applyDateRange(timeRange.From, timeRange.To, true, timeRange.Open);
            }
        });
    }
}

module.exports = ThorpePark;