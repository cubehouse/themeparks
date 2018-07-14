"use strict";

/**
 * This is a template sample park
 * The idea of this file is to demonstrate the core logic a park should implement to be added to the library
 */

// include the parent Park object
//  note: change this to point to the correct location
const Park = require("../lib/Park");

// you'll likely want this library for date parsing for the opening hours response
const Moment = require("moment-timezone");

// define our new Park class
class TemplatePark extends Park {
    // override the constructor
    constructor(options = {}) {
        // the constructor is passed an object full of options
        // here we will want to override a few essential settings

        // why do we use the "||" operator? This allows anybody using the library to optionally override our hard-coded values
        //  say that Disney World changed timezone, and nobody could be bothered to update the library
        //  this would allow a user to supply their own timezone locally without having to rebuild the whole library
        //  terrible example I know, but it's important to keep everything flexible and customisable
        options.latitude = options.latitude || 39.69992284073077;
        options.longitude = options.longitude || -31.106071472167972;
        options.timezone = options.timezone || "Atlantic/Azores";

        // must supply a name for our new park
        options.name = "Mock Park";

        // call the super constructor with our extended options object
        //  this finishes off setting up the park object
        super(options);
    }

    // override FetchWaitTimes
    //  this function is called when the library wants the latest park wait times
    // return a Promise, which will resolve with an array of ride data
    FetchWaitTimes() {
        // Note: usually you will want to make some HTTP requests here
        //  for HTTP requests, use this.HTTP(), which takes care of various things for you
        //  see other park implementations for examples, or read through the themeparks documentation on GitHub

        // for the purpose of the example however, we're just hard-coding some ride times
        //  you'll likely fetch data, parse it, then loop through the results and call this.UpdateRide a bunch of times

        this.UpdateRide(4052, { // each ride needs a unique ID to identify it, this can be unique per-park, so usually the park's own ID is perfect
            name: "Sailors of the Portsmouth",
            waitTime: 5 // wait time in minutes
        });

        this.UpdateRide(4053, {
            name: "Small Lightning Hill",
            waitTime: -1 // -1 denotes ride is "Closed" (refurbishment, out-of-season, out-of-hours, not open yet, etc.)
        });

        this.UpdateRide(4054, {
            name: "Manspider",
            waitTime: -2 // -2 denotes ride is "Down" (should be up, but is unexpectedly under maintenance)
        });

        // finally, resolve the function promise so the library knows we're done updating ride statuses
        return Promise.resolve();
    }

    // override FetchOpeningHours
    //  this function is called when the library wants the latest park opening hours
    // return a Promise, which will resolve with an array of dates
    FetchOpeningHours() {
        // fetch opening hours from park API somehow
        //  occasionally may have to scrape data from an HTML calendar, which can be fiddly
        //  hopefully though, it's in a nice API

        // loop over all days from fetched opening hour responses
        //  example here: sets 14th July opening hours: 8-5
        this.Schedule.SetDate({
            // note: using park's timezone as the 3rd argument
            //  this tells Moment that the time given is in the park's local timezone
            //  if the time given is in UTC or something other than the parks' local time, you'll want to do something like:
            //   Moment("2018-07-14T08:00", "YYYY-MM-DDTHH:mm").tz(this.Timezone)
            //   this will convert the time from UTC into the park's local timezone
            //  see https://momentjs.com/docs/#/displaying/format/
            //   for how to write the 2nd argument string for parsing input date/times
            date: Moment.tz("2018-07-14", "YYYY-MM-DD", this.Timezone),
            openingTime: Moment("2018-07-14T08:00", "YYYY-MM-DDTHH:mm", this.Timezone),
            closingTime: Moment("2018-07-14T17:00", "YYYY-MM-DDTHH:mm", this.Timezone),
            type: "Operating",
            specialHours: false,
        });

        // return resolved Promise to tell library we're done
        return Promise.resolve();
    }
}

// finally, export our new Park type for other files to access
module.exports = TemplatePark;

// you'll also now want to add this new park to the /lib/index.js file, so it's included in the library