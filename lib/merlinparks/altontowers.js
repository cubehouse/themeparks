"use strict";

var MerlinPark = require("./index");
var crypto = require("crypto");
var Moment = require("moment-timezone");

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

        // set park's location as it's entrance
        options.latitude = options.latitude || 35.627055;
        options.longitude = options.longitude || 139.889097;

        // Park API options
        options.api_base = "http://scarefestsounds.altontowers.com/api";
        options.api_key = "ufkPRqH3AmqwWMr66nyUzepe";

        // inherit from base class
        super(options);
    }

    /**
     * Response to challenge request for Alton Towers API
     */
    _APIRespond(challenge) {
        return crypto.createHash("md5").update(this.APIKey + challenge).digest("hex");
    }

    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            this.HTTP({
                url: "https://www.altontowers.com/Umbraco/Api/Calendar/GetAllOpeningTimes",
                method: "GET",
                headers: {
                    "Referer": "https://www.altontowers.com/info-help/opening-times/",
                    "X-Requested-With": "XMLHttpRequest",
                },
                json: true
            }).then(function(calendarData) {
                // find theme park dates from response
                //  it contains "WatterPark"[sic] times as well in a separate array
                var parkDates = null;
                for (var i = 0, times; times = calendarData[i++];) {
                    if (times.Type == "ThemePark") {
                        parkDates = times.OpeningHours;
                        break;
                    }
                }

                var result, timeRange;
                for (i = 0, timeRange; timeRange = parkDates[i++];) {
                    var range = {
                        startDate: Moment(timeRange.From, "YYYY-MM-DDTHH:mm:ss"),
                        endDate: Moment(timeRange.To, "YYYY-MM-DDTHH:mm:ss")
                    };

                    // figure out opening times for this range
                    if (result = /([0-9\:]+[ap]m)\s*\-\s*([0-9\:]+[ap]m)/gi.exec(timeRange.Open)) {
                        range.openingTime = Moment(result[1], "HH:mma");
                        range.closingTime = Moment(result[2], "HH:mma");
                    }
                    // try shorthand format too, in case someone entered the times in badly
                    else if (result = /([0-9]+)\s*\-\s*([0-9]+)/gi.exec(timeRange.Open)) {
                        range.openingTime = Moment(result[1] + ":00am", "HH:mma");
                        range.closingTime = Moment(result[2] + ":00pm", "HH:mma");
                    } else {
                        this.Log(`Unable to understand hour format: ${timeRange.Open}`);
                        continue;
                    }

                    // apply this range
                    this.Schedule.SetRange(range);
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

module.exports = AltonTowers;