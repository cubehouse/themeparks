// include core Park class
const Park = require("../park");

const GeoLocation = require("../geoLocation");

const cheerio = require("cheerio");
const Moment = require("moment-timezone");

const s_APIBase = Symbol();
const s_APILanguage = Symbol();
const s_parkLocationMin = Symbol();
const s_parkLocationMax = Symbol();
const s_parkScheduleURL = Symbol();

/**
 * Implements the Universal Singapore API.
 * @class
 * @extends Park
 */
class UniversalStudiosSingapore extends Park {
    /**
     * Create new UniversalStudiosSingapore Object.
     * @param {Object} options
     * @param {String} [options.api_base] API URL base for accessing API
     * @param {String} [options.api_langauge] Language ID for API results (default: 1)
     */
    constructor(options = {}) {
        options.name = options.name || "Universal Studios Singapore";

        // set park's location as it's entrance
        options.latitude = options.latitude || 1.254251;
        options.longitude = options.longitude || 103.823797;

        options.timezone = "Asia/Singapore";

        // inherit from base class
        super(options);

        this[s_APIBase] = options.api_base || "http://cma.rwsentosa.com/Service.svc/GetUSSContent";
        this[s_APILanguage] = options.api_langauge || 1;
        this[s_parkScheduleURL] = options.schedule_url || "http://www.rwsentosa.com/Homepage/Attractions/UniversalStudiosSingapore";

        // Geofence corners (to generate random location for API requests)
        this[s_parkLocationMin] = new GeoLocation({
            latitude: 1.2547872658731591,
            longitude: 103.8217341899872
        });
        this[s_parkLocationMax] = new GeoLocation({
            latitude: 1.2533177673892697,
            longitude: 103.82408380508424
        });
    }

    /**
     * Fetch Universal Singapore's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise((resolve, reject) => {
            // generate random geo location to fetch with
            const randomGeoLocation = GeoLocation.RandomBetween(this[s_parkLocationMin], this[s_parkLocationMax]);

            this.Log("Running Universal Studios Singapore");
            this.HTTP({
                url: this[s_APIBase],
                body: {
                    "languageID": this[s_APILanguage],
                    "filter": "Ride",
                    "Latitude": randomGeoLocation.LatitudeRaw,
                    "Longitude": randomGeoLocation.LongitudeRaw
                },
            }).then((body) => {
                // check the response is as we expect
                if (!body || !body.ResponseOfUSS || !body.ResponseOfUSS.Result || !body.ResponseOfUSS.Result.USSZoneList || !body.ResponseOfUSS.Result.USSZoneList.USSZone) {
                    this.Log(`Error parsing Universal Studios Singapore response: ${body}`);
                    return reject("Unable to parse Universal Studios Singapore wait times response");
                }

                // loop through each zone
                body.ResponseOfUSS.Result.USSZoneList.USSZone.forEach((zone) => {
                    var rides = zone.Content.USSContent;

                    // loop through each ride
                    for (var rideIDX = 0, ride; ride = rides[rideIDX++];) {
                        var rideObject = this.GetRideObject({
                            id: ride.USSContentID,
                            name: ride.Name
                        });

                        rideObject.WaitTime = (ride.Availability && ride.Availability == "True") ? parseInt(ride.QueueTime, 10) || -1 : -1;
                    }
                });

                return resolve();
            }, reject);
        });
    }

    FetchOpeningTimes() {
        // Get HTML page of park
        return this.HTTP({
            url: this[s_parkScheduleURL]
        }).then(this.ParseOpeningHoursHTML.bind(this)).then((results) => { // parse results
            for (var dateIdx = 0, date; date = results[dateIdx++];) {
                // record results
                this.Schedule.SetDate({
                    date: date.OpeningHour,
                    openingTime: date.OpeningHour,
                    closingTime: date.ClosingHour
                });
            }
            return Promise.resolve();
        });
    }

    ParseOpeningHoursHTML(HTML) {
        var $ = cheerio.load(HTML);

        var results = [];

        // grab all the styled tables (a potential calendar)
        var tables = $("table.styled");
        for (var tableIdx = 0, table; table = tables[tableIdx++];) {
            table = $(table);
            // check we found a calendar month (otherwise it's some other table on this page)
            const month = table.find(".tableTitle").text();
            // validate using Moment
            if (Moment(month, "MMMM YYYY").isValid()) {
                // find each table cell
                const dates = table.find("td");
                for (var i = 0, date; date = dates[i++];) {
                    date = $(date);
                    // check it has a valid date (and not an empty cell!)
                    const dateString = date.find("strong").text();
                    const dateVal = parseInt(dateString, 10);
                    if (dateVal > 0) {
                        // slim down hours to remove all whitespace
                        //  leave in newlines, so we can ignore the special parades/hours
                        const dateHours = date.find("span").last().text().trim().replace(/[^\S\n]/g, "");

                        // look for valid times
                        var match = /([0-9]+[AP]M)-([0-9]+[AP]M)/.exec(dateHours);
                        if (match && match[1] && match[2]) {
                            const OpeningHour = Moment.tz(`${dateVal} ${month} ${match[1]}`, "D MMMM YYYY HA", this.Timezone);
                            const ClosingHour = Moment.tz(`${dateVal} ${month} ${match[2]}`, "D MMMM YYYY HA", this.Timezone);

                            results.push({
                                OpeningHour,
                                ClosingHour
                            });
                        }
                    }
                }
            }
        }

        return Promise.resolve(results);
    }
}

// export the class
module.exports = UniversalStudiosSingapore;