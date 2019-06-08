"use strict";

const cheerio = require("cheerio");
const moment = require("moment");

var MerlinPark = require("./index");
const defaultFallbackData = require("./chessingtonworldofadventures_data.json");

/**
 * Chessington World Of Adventures
 * @class
 * @extends MerlinPark
 */
class ChessingtonWorldOfAdventures extends MerlinPark {
    /**
     * Create a new ChessingtonWorldOfAdventures object
     */
    constructor(options = {}) {
        options.name = options.name || "Chessington World Of Adventures";
        options.timezone = options.timezone || "Europe/London";
        options.useragent = "okhttp/3.9.0";

        // set park's location as it's entrance
        options.latitude = options.latitude || 51.3496;
        options.longitude = options.longitude || -0.31457;

        // Park API options
        options.api_key = options.api_key || "307f27cd-2be1-4b43-aee8-7832cfadb85f";
        options.initial_data_version = options.initial_data_version || "2019-04-30T09:32:56Z";

        // app version options
        options.app_build = "118";
        options.app_version = "2.0.44";
        options.native_version = "2.0.8";
        options.device_id = "123";


        // Fallback data if the /data webservice doesn't work
        options.fallback_data = options.fallback_data || defaultFallbackData;

        // inherit from base class
        super(options);
    }

    // Ugly fix for a specific attraction
    GetRideObject(ride = {}) {
        if (ride.id === 3958 && !ride.name) {
            ride.name = 'Treetop Hoppers';
        }
        return super.GetRideObject(ride);
    }

    FetchOpeningTimes() {
        return this.FetchOpeningTimesHTML().then((HTML) => {
            return this.ParseOpeningTimesHTML(HTML);
        });
    }

    FetchOpeningTimesHTML() {
        return this.HTTP({ url: "https://www.chessington.com/plan/chessington-opening-times.aspx" });
    }

    ParseOpeningTimesHTML(HTML) {
        var $ = cheerio.load(HTML);

        $(".day").each((idx, el) => {
            el = $(el);
            // skip days in the pass
            if (el.hasClass("inactive")) return;

            var hours = {
                dayinfo: el.find(".dayInfo > span").text(),
                opens: el.find("meta[itemprop=opens]").attr("content"),
                closes: el.find("meta[itemprop=closes]").attr("content"),
            };

            // check if the park is open this day (and not just the zoo or such)
            var dayinfo = hours.dayinfo ? hours.dayinfo.toLowerCase() : "";
            // normal opening day
            if (dayinfo.indexOf("theme park") >= 0) {
                this.Schedule.SetDate({
                    openingTime: moment(hours.opens),
                    closingTime: moment(hours.closes),
                    type: "Operating"
                });
            }
        });

        return Promise.resolve();
    }
}

module.exports = ChessingtonWorldOfAdventures;