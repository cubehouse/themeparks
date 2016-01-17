# wdwJS

An unofficial API library for accessing Disney and SeaWorld ride wait times and park opening times.

[![Build Status](https://travis-ci.org/cubehouse/wdwJS.svg?branch=master)](https://travis-ci.org/cubehouse/wdwJS) [![npm version](https://badge.fury.io/js/wdwjs.svg)](https://badge.fury.io/js/wdwjs) [![Dependency Status](https://www.versioneye.com/nodejs/wdwjs/badge?style=flat)](https://www.versioneye.com/nodejs/wdwjs)
[![npm history](https://nodei.co/npm-dl/wdwjs.png)](https://www.npmjs.com/package/wdwjs/)

# Install

    npm install wdwjs --save

# Change Log

v3.0.0

* Refactored codebase to make it easier to maintain
* Added SeaWorld parks (including Busch Gardens and Sesame Place)
* Setting environment variable "DEBUG=true" will supply better debugging information that we've had in previous versions
* Disney World Florida, Disneyland California, Disneyland Paris, Disneyland Shanghai and Disneyland Hong Kong now share a common codebase.
* (breaking change) GetSchedule is now GetOpeningTimes
* (breaking change) Schedules now return a maximum of one element per day, with "special" opening hours as a sub-object called "special" (eg. Extra Magic Hours)
* (breaking change) Park object names have been renamed
* (breaking change) No longer need to create a new wdwjs() object to start the API, make separate new objects for each park you wish to access

v2.0.0

* (breaking change) You must now specify "WDWRequests: true" in your setup options if you wish direct access to WDW API function helpers
* Disneyland Paris is now part of the same API service as Disney World Resort and Disneyland California.
* Added Tokyo Disneyland to supported parks
* Added (non-Disney) Universal Orlando parks to supported parks (added: 2.0.4)

v1.0.0

* (breaking change) Response formats simplified so all parks return same data structure
* Added Disneyland Paris

# Example Use

    // Setup API
    var DisneyAPI = require("wdwjs");

    // List theme parks supported by API
    for (var park in DisneyAPI) {
      console.log("* " + new DisneyAPI[park]().name + " (DisneyAPI." + park + ")");
    }

    var MagicKingdom = new DisneyAPI.WaltDisneyWorldMagicKingdom();

    // Get Magic Kingdom wait times
    MagicKingdom.GetWaitTimes(function(err, data) {
        if (err) return console.error("Error fetching Magic Kingdom wait times: " + err);

        console.log(JSON.stringify(data, null, 2));
    });

    // Get Magic Kingdom opening times
    MagicKingdom.GetOpeningTimes(function(err, data) {
        if (err) return console.error("Error fetching Magic Kingdom schedule: " + err);

        console.log(JSON.stringify(data, null, 2));
    });

## Parks available

    * Magic Kingdom - Walt Disney World Florida (DisneyAPI.WaltDisneyWorldMagicKingdom)
    * Epcot - Walt Disney World Florida (DisneyAPI.WaltDisneyWorldEpcot)
    * Hollywood Studios - Walt Disney World Florida (DisneyAPI.WaltDisneyWorldHollywoodStudios)
    * Animal Kingdom - Walt Disney World Florida (DisneyAPI.WaltDisneyWorldAnimalKingdom)
    * Magic Kingdom - Disneyland California (DisneyAPI.DisneylandMagicKingdom)
    * California Adventure - Disneyland California (DisneyAPI.DisneylandCaliforniaAdventure)
    * Magic Kingdom - Disneyland Paris (DisneyAPI.DisneylandParisMagicKingdom)
    * Walt Disney Studios - Disneyland Paris (DisneyAPI.DisneylandParisWaltDisneyStudios)
    * Disneyland Hong Kong (DisneyAPI.DisneylandHongKong)
    * Disneyland Tokyo (DisneyAPI.DisneylandTokyo)
    * DisneySea Tokyo (DisneyAPI.DisneySeaTokyo)
    * SeaWorld Florida (DisneyAPI.SeaWorldFlorida)
    * SeaWorld San Antonio (DisneyAPI.SeaWorldSanAntonio)
    * SeaWorld San Diego (DisneyAPI.SeaWorldSanDiego)
    * Busch Gardens Williamsburg (DisneyAPI.BuschGardensWilliamsburg)
    * Busch Gardens Tampa (DisneyAPI.BuschGardensTampa)
    * Sesame Place (DisneyAPI.SesamePlace)


# Result Objects

## Ride Wait Times

    [
        {
            id: (string or number: uniquely identifying a ride),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            fastPass: (bool: is fastpass available for this ride?),
        },
        ...
    ]

## Schedules

    [
        {
            date: (dateFormat timestamp: day this schedule applies),
            openingTime: (timeFormat timestamp: opening time for requested park - can be null if park is closed),
            closingTime: (timeFormat timestamp: closing time for requested park - can be null if park is closed),
            type: (string: "Operating" or "Closed"),
            special: [ (array of "special" times for this day, usually Disney Extra Magic Hours or similar at other parks - field may be null)
              openingTime: (timeFormat timestamp: opening time for requested park),
              closingTime: (timeFormat timestamp: closing time for requested park),
              type: (string: type of schedule eg. "Extra Magic Hours", but can be "Event" or "Special Ticketed Event" or other)
            ],
        },
        ...
    ]

# Park Object values

There are some values available on each park object that may be useful.

|Variable|Description|
|:-------|:----------|
|name|Name of the park|
|park_timezone|The park's local timezone|

    var DisneyAPI = require("wdwjs");

    // print each park's timezone
    for (var park in DisneyAPI) {
      var parkObj = new DisneyAPI[park]();
      console.log("* " + parkObj.name + " => " + parkObj.park_timezone);
    }

Prints:
    * Magic Kingdom - Walt Disney World Florida => America/New_York
    * Epcot - Walt Disney World Florida => America/New_York
    * Hollywood Studios - Walt Disney World Florida => America/New_York
    * Animal Kingdom - Walt Disney World Florida => America/New_York
    * Magic Kingdom - Disneyland California => America/Los_Angeles
    * California Adventure - Disneyland California => America/Los_Angeles
    * Magic Kingdom - Disneyland Paris => Europe/Paris
    * Walt Disney Studios - Disneyland Paris => Europe/Paris
    * Disneyland Hong Kong => Asia/Hong_Kong
    * Disneyland Tokyo => America/New_York
    * DisneySea Tokyo => America/New_York
    * SeaWorld Florida => America/New_York
    * SeaWorld San Antonio => America/Chicago
    * SeaWorld San Diego => America/Los_Angeles
    * Busch Gardens Williamsburg => America/New_York
    * Busch Gardens Tampa => America/New_York
    * Sesame Place => America/New_York

# API Options

Each park can take a series of options to configure it's behaviour.

Default options:

|Variable|Default|Description|
|:-------|:------|:----------|
|debug|false|Turn on debugging (can also be enabled by setting environment variable DEBUG)|
|timeFormat|YYYY-MM-DDTHH:mm:ssZ|Format to return times in (see http://momentjs.com/docs/#/displaying/format/)|
|dateFormat|YYYY-MM-DD|Format to return dates in (see http://momentjs.com/docs/#/displaying/format/)|
|timeFormatTimezone|*Park's local timezone*|Control what timezone times will be returned in. Defaults to park's local timezone (see TZ values https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)|
|scheduleMaxDates|30|Maximum number of days to return opening times for (some parks may return less than requested days, but never more)|
|useragent|*Park Defined*|User Agent string to use for making API requests (overrides per-park useragent settings)|

    var DisneyAPI = require("wdwjs");

    var MagicKingdom = new DisneyAPI.WaltDisneyWorldMagicKingdom({
      debug: true,
      timeFormat: "YYYY-MM-DDTHH:mm:ssZ",
      dateFormat: "YYYY-MM-DD",
      timeFormatTimezone: "Europe/London",
      scheduleMaxDates: 7,
    });

    // You can also configure these settings after initialisation with Config(key, value)
    MagicKingdom.Config("debug", false);
