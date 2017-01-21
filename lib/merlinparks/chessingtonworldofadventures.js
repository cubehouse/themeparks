"use strict";

var MerlinPark = require("./index");
var crypto = require("crypto");
var Moment = require("moment-timezone");

// web-scraping library for opening dates
var osmosis = require("osmosis");

// grab JSON park data
var rideNames = {};

// parse ride names from manually extracted JSON file
function ParseArea(obj) {
    if (!obj) return;

    if (obj.areas) {
        for (var i in obj.areas) {
            AddRideName(obj.areas[i]);
            ParseArea(obj.areas[i]);
        }
    }

    if (obj.items) {
        for (var i in obj.items) {
            AddRideName(obj.items[i]);
            ParseArea(obj.items[i]);
        }
    }

}

function AddRideName(obj) {
    // check this is a ride before storing it's name
    var isRide = false;
    if (obj.categories) {
        for (var i = 0, category; category = obj.categories[i++];) {
            // rides and attractions have category ID 465
            if (category == 465) {
                isRide = true;
                break;
            }
        }
    }

    if (isRide) {
        rideNames[obj.id] = obj.name;
    }
}

ParseArea(require(__dirname + "/chessingtonworldofadventures_data.js").areas);

// edge-case: this ride is actually missing from the app, add it manually
if (!rideNames[3958]) {
    rideNames[3958] = "Penguins of Madagascar Mission: Treetop Hoppers";
}

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

        // set park's location as it's entrance
        options.latitude = options.latitude || 51.3496;
        options.longitude = options.longitude || -0.31457;

        // Park API options
        options.api_base = "https://legacy-api.attractions.io/apps/command/chessington";
        options.api_key = "edqXyMWFtuqGY6BZ9Epkzg4ptqe6v3c7tdqa97VbXjvrgZHC";

        options.resort_id = 44;

        // inherit from base class
        super(options);

    }

    /**
     * Response to challenge request for Chessington World Of Adventures API
     */
    _APIRespond(challenge) {
        // this is actually identical to Alton Towers, but the challenge and API Key are swapped around
        return crypto.createHash('md5').update(challenge + this.APIKey).digest("hex");
    }

    /**
     * Given a ride object, return the ride's name
     */
    _GetRideName(ridedata) {
        return rideNames[ridedata.id];
    }

    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            osmosis.get("https://www.chessington.com/plan/chessington-opening-times.aspx")
                .find(".day")
                .set({
                    // days in the past have inactive css class, ignore these later
                    "past_date": "@class",
                    // grab opening and closing hours
                    "opens": "meta[itemprop=opens]@content",
                    "closes": "meta[itemprop=closes]@content",
                    // text to check if the theme park is open this day
                    "dayinfo": ".dayInfo > span"
                })
                // append TDR_OSMOSIS to each log message from osmosis
                .log(function() {
                    var logMessage = [].splice.call(arguments, 0);
                    logMessage.splice(0, 0, "CHESSINGTON_OSMOSIS");
                    this.Log.apply(this, logMessage);
                }.bind(this))
                // callback for each ride on the page
                .data(function(hours) {
                    // skip if this day already happened
                    if (hours.past_date.indexOf("inactive") >= 0) return;

                    // check if the park is open this day (and not just the zoo or such)
                    var dayinfo = hours.dayinfo ? hours.dayinfo.toLowerCase() : "";
                    // normal opening day
                    if (dayinfo.indexOf("theme park") >= 0) {
                        this.Schedule.SetDate({
                            openingTime: Moment(hours.opens),
                            closingTime: Moment(hours.closes),
                            type: "Operating"
                        });
                    }
                }.bind(this)).done(resolve);
        }.bind(this));
    }
}

module.exports = ChessingtonWorldOfAdventures;

if (!module.parent) {
    var p = new ChessingtonWorldOfAdventures();
    p.GetOpeningTimes().then(console.log, console.error);
}