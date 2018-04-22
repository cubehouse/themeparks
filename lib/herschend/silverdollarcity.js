"use strict";

// import the base Herschend class
var HerschendBase = require("./index.js");

// need schedule lib to store ride times
var Schedule = require("../schedule");

// Moment date/time library
var Moment = require("moment-timezone");

/**
 * SilverDollarCity
 * @class
 * @extends HerschendBase
 */
class SilverDollarCity extends HerschendBase {
    /**
     * Create a new SilverDollarCity object
     */
    constructor(options = {}) {
        options.name = options.name || "Silver Dollar City";
        options.timezone = options.timezone || "America/Chicago";

        // set resort's general center point
        options.latitude = options.latitude || 36.668177;
        options.longitude = options.longitude || -93.338567;

        // inherit from base class
        super(options);

        // Herschend API Configuration
        this.park_id = 2;

    }

    /**
     * Fetch Silver Dollar City's opening times
     * @returns {Promise}
     */
    FetchOpeningTimes() {
        return new Promise(function(resolve, reject) {
            // get today's date and add on a month to get a decent range of dates
            var rangeStart = Moment.tz("America/Chicago").format("YYYY-MM-DD");

            this.HTTP({
                url: "https://www.silverdollarcity.com/sitecore/api/hfe/hfedata/dailyschedulebytime",
                data: {
                  'date': rangeStart,
                  'days': 30,
                  'parkids': 'D9044234-6D1E-45C1-82D0-0BE80DA34983'
                },
                headers: {
                  "Authorization": "Basic ZXh0cmFuZXRcYXBpdXNlcjpKdzdvZGh3RkhwSzRKZw=="
                }
            }).then(function(scheduleData) {
                // parse each schedule entry
                for(var i=0; i < scheduleData.length; i++){
                    var day = scheduleData[i];
                    if(day.schedule.parkHours[0].from){
                      this.Schedule.SetDate({
                          date: Moment.tz(day.date, "YYYY-MM-DD", "America/Chicago"),
                          openingTime: Moment.tz(day.schedule.parkHours[0].from, "YYYY-MM-DDTHH:mm:ss", "America/Chicago"),
                          closingTime: Moment.tz(day.schedule.parkHours[0].to, "YYYY-MM-DDTHH:mm:ss", "America/Chicago")
                      });
                    }
                    else {
                      this.Schedule.SetDate({
                          date: Moment.tz(day.date, "YYYY-MM-DD", "America/Chicago"),
                          type: "Closed"
                      });

                    }
                }
                resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

module.exports = SilverDollarCity;
