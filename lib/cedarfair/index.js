"use strict";

// woah WAT? We're based on the SeaWorld API?
//  yep, SeaWorld and Cedar Fair use the same backend API framework for their park wait times
//  I didn't realise this for a long time, until I checked Knott's Berry Farm and noticed the similarities
//  So, to save reimplementing it from scratch, I am going to just override a few bits from the SeaWorld implementation
var SeaWorld = require("../seaworld/");
var Moment = require("moment-timezone");

// a lenient JSON parser
var relaxedJson = require("relaxed-json");

// cedar parks have special hours under unique categories
//  example: scary farm is listed as a separate park_id
// so we need to list these here so we can combine them into our schedule data as "special hours"
var s_specialHours = Symbol();

/**
 * Implements the CedarFairPark API framework.
 * @class
 * @extends SeaWorld
 */
class CedarFairPark extends SeaWorld {
    /**
     * Create new CedarFairPark Object.
     * This object should not be called directly, but rather extended for each of the individual Cedar Fair parks
     * @param {Object} options
     * @param {String} options.park_id ID of the park to access the API for
     * @param {String} [options.auth_token] Auth token to use to connect to the API
     * @param {String} [options.api_base] Base URL to access the API
     * @param {String[]} [options.ride_types] Array of types that denote rides at the park (to avoid listing restaurants/toilets etc. as rides)
     * @param {String[]} [options.special_hours] Array of park IDs to combine with main park for special hours (eg. scaryfarm)
     */
    constructor(options = {}) {
        options.name = options.name || "Cedar Fair Park";

        // change defaults before calling super()
        options.auth_token = options.auth_token || "Mobile_API:merl4yU2";
        options.api_base = options.api_base || "https://cf.te2.biz/rest/";

        // inherit from base class
        super(options);

        // optional special hour parks
        this[s_specialHours] = options.special_hours || [];
        // make sure we're an array
        this[s_specialHours] = [].concat(this[s_specialHours]);
    }

    // sadly, the Cedar Fair API doesn't have park hours (it just returns an empty array)
    //  so, let's override it from SeaWorld
    FindScheduleDataURL() {
        return this.Cache.Wrap("schedule_url", function() {
            return new Promise(function(resolve, reject) {
                this.GetAPIUrl({
                    // the park hours URL is kept in the products area
                    url: `${this.APIBase}commerce/${this.ParkID}/products/all`
                }).then(function(productData) {
                    // got product data, we're looking for GUEST_PARK_HOURS to get our schedule URL
                    for (var i = 0, product; product = productData[i++];) {
                        if (product.id == "GUEST_PARK_HOURS") {
                            // this will give us the park-hours.htm document
                            //  we want the schedule.js script that contains all the hours data

                            // check we're still getting the expected park-hours.htm document
                            if (product.purchaseLink.indexOf("park-hours") < 0) {
                                return reject("Park hours URL has changed, requires themeparks library update");
                            }

                            return resolve(product.purchaseLink.replace(/park-hours[a-zA-Z0-9_-]*\.htm/, "") + "js/schedule.js");
                        }
                    }

                    // failed? search the main venue data instead
                    this.GetAPIUrl({
                        url: `${this.APIBase}venue/${this.ParkID}`
                    }).then((venueData) => {
                        // search venue data
                        if (venueData.details) {
                            for (var j = 0, detail; detail = venueData.details[j++];) {
                                if (detail.id == "info_web_hours_directions") {
                                    if (detail.description.indexOf("park-hours") < 0) {
                                        return reject("Park hours URL has changed, requires themeparks library update");
                                    }

                                    return resolve(detail.description.replace(/park-hours[a-zA-Z0-9_-]*\.htm/, "") + "js/schedule.js");
                                }
                            }
                        }

                        return reject("Unable to discover park hours URL");
                    });
                }.bind(this), reject);
            }.bind(this));
        }.bind(this), 60 * 60 * 24); // cache URL for 24 hours
    }

    FetchStaticScheduleData() {
        return this.Cache.Wrap("schedule_data", function() {
            return new Promise(function(resolve, reject) {
                this.FindScheduleDataURL().then(function(scheduleURL) {
                    // notice we don't use the API here, this is hosted outside the API, so do a normal API request
                    this.HTTP({
                        url: scheduleURL
                    }).then(function(data) {
                        data = data.toString();
                        // strip out data around the key JSON object
                        //  this isn't pretty, but avoids having to manually embed this data into the library, which would be worse

                        // remove js var init
                        data = data.replace(/var\s+schedule\s*=\s*/, "");

                        // remove semi-colon
                        data = data.replace(/;/g, "");

                        // remove leading non-{ characters
                        data = data.replace(/^[^{]+/, "");

                        // remove any extra variables after initial one
                        data = data.replace(/var[\S\s]*$/mg, "");

                        // use our lenient JSON parser
                        try {
                            var JSONData = relaxedJson.parse(data);
                        } catch (e) {
                            return reject(`Failed to parse response data from ${this.Name} API: ${e}`);
                        }

                        if (JSONData) resolve(JSONData);
                    }.bind(this), reject);
                }.bind(this), reject);
            }.bind(this));
        }.bind(this), 60 * 60 * 24); // cache for 24 hours
    }

    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            // get our schedule data
            this.FetchStaticScheduleData().then(function(scheduleData) {
                if (!scheduleData || !scheduleData.main) {
                    return reject("Unable to find main schedule data for park");
                }

                // parse park legend to figure out possible opening hours
                var mainParkHours = ParseOpeningLegend(scheduleData.main.legend);

                var month, day, dayRow, today;

                // cycle through main park hours
                for (var monthIdx = 0; month = scheduleData.main.months[monthIdx++];) {
                    for (var hoursIdx = 0; dayRow = month.hours[hoursIdx++];) {
                        for (var dayIdx = 0; day = dayRow[dayIdx++];) {
                            // skip this entry if there is no day set
                            if (!day.day) continue;
                            // skip this entry if the class doesn't appear in the legend
                            if (!mainParkHours[day.class]) continue;

                            // figure out this day in the local timezone
                            today = Moment.tz({
                                day: day.day,
                                month: month.index,
                                year: month.year
                            }, this.Timezone);

                            this.Schedule.SetDate({
                                date: today,
                                // clone today and overwrite the hours from the park legend
                                openingTime: today.clone().set("hours", mainParkHours[day.class].openingTime.get("hours")).set("minutes", mainParkHours[day.class].openingTime.get("minutes")),
                                closingTime: today.clone().set("hours", mainParkHours[day.class].closingTime.get("hours")).set("minutes", mainParkHours[day.class].closingTime.get("minutes")),
                                type: "Operating"
                            });
                        }
                    }
                }

                // if we have special hours, inject these into main hours
                for (var specialHourIdx = 0, specialHours; specialHours = this[s_specialHours][specialHourIdx++];) {
                    if (!scheduleData[specialHours]) continue;

                    var specialLegend = ParseOpeningLegend(scheduleData[specialHours].legend);

                    for (var specialMonthIdx = 0; month = scheduleData[specialHours].months[specialMonthIdx++];) {
                        for (var specialHoursIdx = 0; dayRow = month.hours[specialHoursIdx++];) {
                            for (var specialDayIdx = 0; day = dayRow[specialDayIdx++];) {
                                // skip this entry if there is no day set
                                if (!day.day) continue;
                                // skip this entry if the class doesn't appear in the legend
                                if (!specialLegend[day.class]) continue;

                                // figure out this day in the local timezone
                                today = Moment.tz({
                                    day: day.day,
                                    month: month.index,
                                    year: month.year
                                }, this.Timezone);

                                this.Schedule.SetDate({
                                    date: today,
                                    // clone today and overwrite the hours from the park legend
                                    openingTime: today.clone().set("hours", specialLegend[day.class].openingTime.get("hours")).set("minutes", specialLegend[day.class].openingTime.get("minutes")),
                                    closingTime: today.clone().set("hours", specialLegend[day.class].closingTime.get("hours")).set("minutes", specialLegend[day.class].closingTime.get("minutes")),
                                    type: specialHours,
                                    specialHours: true
                                });
                            }
                        }
                    }
                }

                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

// move this outside the class as it's just a convenience class and doens't need to be exposed
var regex_legendTimes = /([0-9]+(?::[0-9]+)?[ap]m)\s*-\s*([0-9]+(?::[0-9]+)?[ap]m)/i;

function ParseOpeningLegend(legendData) {
    var schedule = {};

    // legends are inside two loops. Not totally sure why, but might be a lazy formatting choice for the HTML result
    for (var legendIdxA = 0, legendA; legendA = legendData[legendIdxA++];) {
        for (var legendIdxB = 0, legend; legend = legendA[legendIdxB++];) {
            // try to parse times out of description
            var times = regex_legendTimes.exec(legend.description);
            if (times && times[1] && times[2]) {
                schedule[legend.class] = {
                    openingTime: Moment(`${times[1].toUpperCase()}`, "H:mA"),
                    closingTime: Moment(`${times[2].toUpperCase()}`, "H:mA"),
                };
            }
        }
    }

    return schedule;
}

module.exports = CedarFairPark;