# wdwJS

An unofficial API library for accessing Disney park wait times, opening times and other information from the Disney API.

# Install

    npm install wdwjs --save

Note that the API changed in 1.0.0 to return formatted objects to API requests, instead of the raw API data from Disney.

# Example Use

    // Setup API
    var DisneyAPI = new (require("wdwjs"))({
        timeFormat: "HH:mm"
    });

    var MagicKingdom = DisneyAPI.MagicKingdom;

    // Get Magic Kingdom wait times
    MagicKingdom.GetWaitTimes(function(err, data) {
        if (err) return console.error("Error fetching Magic Kingdom wait times: " + err);

        console.log(JSON.stringify(data, null, 2));
    });

    // Get Magic Kingdom opening times
    MagicKingdom.GetSchedule(function(err, data) {
        if (err) return console.error("Error fetching Magic Kingdom schedule: " + err);

        console.log(JSON.stringify(data, null, 2));
    });

    // Parks available
    //  ** Disney World **
    //  DisneyAPI.MagicKingdom
    //  DisneyAPI.Epcot
    //  DisneyAPI.AnimalKingdom
    //  DisneyAPI.HollywoodStudios
    //
    //  ** Disney California **
    //  DisneyAPI.Disneyland
    //  DisneyAPI.CaliforniaAdventure
    //
    //  ** Disney Paris **
    //  DisneyAPI.DisneylandParis
    //  DisneyAPI.WaltDisneyStudios

# Result Objects

Some parks may return additional data about rides (check their output). However the data defined below will be available for all implemented parks in wdwJS.

## Ride Wait Times

    [
        {
            id: (string: uniquely identifying a ride, from internal Disney APIs),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            fastPass: (bool: is fastpass available for this ride?),
            openingTime: (timeFormat timestamp: ride opening time - only available in Paris APIs at the moment),
            closingTime: (timeFormat timestamp: ride closing time - only available in Paris APIs at the moment)
        },
        ...
    ]

## Schedules

    [
        {
            date: (dateFormat timestamp: day this schedule applies),
            openingTime: (timeFormat timestamp: opening time for requested park),
            closingTime: (timeFormat timestamp: closing time for requested park),
            type: (string: type of schedule, usually "Operating", "Extra Magic Hours", but can be "Event" or "Special Ticketed Event" or other)
        },
        ...
    ]

# API Options

Defaults are shown below.

    var DisneyAPI = new (require("wdwjs"))({
        // turn on debug logging
        debug: false,
        // time format for any times returned by the API
        //  see MomentJS docs for format options http://momentjs.com/docs/#/displaying/format/
        timeFormat: "YYYY-MM-DDTHH:mm:ssZ",
        // date format for any dates returned by the API
        dateFormat: "YYYY-MM-DD"
    });

# Advanced Use (Disney World / California APIs only)    

If you want to access these API calls, you must specify "WDWRequests: true" in the options when creating your DisneyAPI object (this is new in v2.0.0 onwards).

    var DisneyAPI = new (require("wdwjs"))({
        WDWRequests: true
    });

    // Get an API page using an ID and type
    DisneyAPI.GetPage(80010208, "Attraction", function(error, data) {
        console.log(JSON.stringify(data, null, 2));
    });

    // Get a specific API URL
    DisneyAPI.GetURL("https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/theme-parks/80007944", function(e, data) {
       console.log(JSON.stringify(data, null, 2));
    });

# Acknowledgments

Walt Disney World and Disneyland Paris code based on work from lloydpick/echelon https://github.com/lloydpick/echelon/

# TODO

* Missing ride opening/closing times on WDW rides (Florida & California)
* Missing park schedule for Tokyo Disneyland
