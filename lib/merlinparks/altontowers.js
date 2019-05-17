"use strict";

var MerlinPark = require("./index");
const defaultFallbackData = require("./altontowers_data.json");

/**
 * Alton Towers
 * @class
 * @extends MerlinPark
 */
class AltonTowers extends MerlinPark {
    /**
     * Create a new AltonTowers object
     */
    constructor(options = {}) {
        options.name = options.name || "Alton Towers";
        options.timezone = options.timezone || "Europe/London";
        options.useragent = "okhttp/3.2.0";

        // set park's location as it's entrance
        options.latitude = options.latitude || 52.991064;
        options.longitude = options.longitude || -1.892292;

        // Park API options
        options.api_key = options.api_key || "5bf34ca0-1428-4163-8dde-f4db4eab6683";
        options.initial_data_version = options.initial_data_version || "2019-05-01T14:58:20Z";

        // Fallback data if the /data webservice doesn't work
        options.fallback_data = options.fallback_data || defaultFallbackData;

        // inherit from base class
        super(options);
    }

    FetchParkData(version) {
        // first, try to call base version (so when data appears, it will start fetching live data)
        return new Promise((resolve) => {
            return super.FetchParkData(version).then(resolve).catch(() => {
                // return fallback data if data isn't live yet
                return resolve({
                    Item: dataCache
                });
            });
        });
    }

    FetchOpeningTimes() {
        return this.HTTP({
            url: `https://www.altontowers.com/Umbraco/Api/OpeningTimes/GetAllAttractionOpeningTimes`,
            method: "GET",
            headers: {
                "Referer": "https://www.altontowers.com/useful-info/opening-times/",
                "X-Requested-With": "XMLHttpRequest",
            }
        }).then((calendarData) => {
            // find theme park dates from response
            // it also contains "waterpark", "treetopquest", "extraordinarygolf" and "altontowersspa" [sic] times as well in a separate array
            if (calendarData.Attractions) {
                var themeParkOpeningTimes = calendarData.Attractions.find((item) => item.Attraction === 'themepark');
                if (themeParkOpeningTimes && themeParkOpeningTimes.DateRanges) {
                    for (let i = 0, timeRange; timeRange = themeParkOpeningTimes.DateRanges[i++];) {
                        let isClosed = timeRange.IsClosed === true || timeRange.OpeningHours === "Closed"; // Best API ever !
                        this.applyDateRange(timeRange.StartDate, timeRange.EndDate, !isClosed, timeRange.OpeningHours);
                    }
                    return;
                }
            }
        });
    }
}

module.exports = AltonTowers;
