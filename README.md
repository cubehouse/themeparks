# wdwJS

An unofficial API library for accessing Disney, Universal and SeaWorld ride wait times and park opening times.

[![Build Status](https://travis-ci.org/cubehouse/wdwJS.svg?branch=master)](https://travis-ci.org/cubehouse/wdwJS) [![npm version](https://badge.fury.io/js/wdwjs.svg)](https://badge.fury.io/js/wdwjs) [![Dependency Status](https://www.versioneye.com/user/projects/55858111363861001500042c/badge.svg?style=flat)](https://www.versioneye.com/nodejs/wdwjs)
[![npm history](https://nodei.co/npm-dl/wdwjs.png)](https://www.npmjs.com/package/wdwjs/)

# Install

    npm install wdwjs --save

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

<!-- START_SUPPORTED_PARKS_LIST -->
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
* Shanghai Disney Resort (DisneyAPI.ShanghaiDisneyResort)
* SeaWorld Florida (DisneyAPI.SeaWorldFlorida)
* SeaWorld San Antonio (DisneyAPI.SeaWorldSanAntonio)
* SeaWorld San Diego (DisneyAPI.SeaWorldSanDiego)
* Busch Gardens Williamsburg (DisneyAPI.BuschGardensWilliamsburg)
* Busch Gardens Tampa (DisneyAPI.BuschGardensTampa)
* Sesame Place (DisneyAPI.SesamePlace)
* Universal Studios Orlando (DisneyAPI.UniversalStudiosFlorida)
* Universal Island Of Adventure (DisneyAPI.UniversalIslandOfAdventure)
* Six Flags Over Texas (DisneyAPI.SixFlagsOverTexas)
* Six Flags Over Georgia (DisneyAPI.SixFlagsOverGeorgia)
* Six Flags St. Louis (DisneyAPI.SixFlagsStLouis)
* Six Flags Great Adventure (DisneyAPI.SixFlagsGreatAdventure)
* Six Flags Magic Mountain (DisneyAPI.SixFlagsMagicMountain)
* Six Flags Great America (DisneyAPI.SixFlagsGreatAmerica)
* Six Flags Fiesta Texas (DisneyAPI.SixFlagsFiestaTexas)
* Six Flags Hurricane Harbor, Arlington (DisneyAPI.SixFlagsHurricaneHarborArlington)
* Six Flags Hurricane Harbor, Los Angeles (DisneyAPI.SixFlagsHurricaneHarborLosAngeles)
* Six Flags America (DisneyAPI.SixFlagsAmerica)
* Six Flags Discovery Kingdom (DisneyAPI.SixFlagsDiscoveryKingdom)
* Six Flags New England (DisneyAPI.SixFlagsNewEngland)
* Six Flags Hurricane Harbor, Jackson (DisneyAPI.SixFlagsHurricaneHarborJackson)
* The Great Escape (DisneyAPI.SixFlagsTheGreatEscape)
* Six Flags White Water, Atlanta (DisneyAPI.SixFlagsWhiteWaterAtlanta)
* Six Flags Mexico (DisneyAPI.SixFlagsMexico)
* La Ronde, Montreal (DisneyAPI.SixFlagsLaRondeMontreal)
* Europa-Park (DisneyAPI.EuropaPark)
* Alton Towers (DisneyAPI.AltonTowers)
* Chessington World Of Adventures (DisneyAPI.ChessingtonWorldOfAdventures)

<!-- END_SUPPORTED_PARKS_LIST -->

# Supported Park Features

<!-- START_PARK_FEATURES_SUPPORTED -->
|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
|Magic Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Epcot - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Hollywood Studios - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Animal Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Disneyland California|&#10003;|&#10003;|&#10003;|
|California Adventure - Disneyland California|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Walt Disney Studios - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Disneyland Hong Kong|&#10003;|&#10003;|&#10003;|
|Disneyland Tokyo|&#10003;|&#10003;|&#10003;|
|DisneySea Tokyo|&#10003;|&#10003;|&#10003;|
|Shanghai Disney Resort|&#10003;|&#10003;|&#10003;|
|SeaWorld Florida|&#10003;|&#10003;|&#10007;|
|SeaWorld San Antonio|&#10003;|&#10003;|&#10007;|
|SeaWorld San Diego|&#10003;|&#10003;|&#10007;|
|Busch Gardens Williamsburg|&#10003;|&#10003;|&#10007;|
|Busch Gardens Tampa|&#10003;|&#10003;|&#10007;|
|Sesame Place|&#10003;|&#10003;|&#10007;|
|Universal Studios Orlando|&#10003;|&#10003;|&#10007;|
|Universal Island Of Adventure|&#10003;|&#10003;|&#10007;|
|Six Flags Over Texas|&#10003;|&#10003;|&#10007;|
|Six Flags Over Georgia|&#10003;|&#10003;|&#10007;|
|Six Flags St. Louis|&#10003;|&#10003;|&#10007;|
|Six Flags Great Adventure|&#10003;|&#10003;|&#10007;|
|Six Flags Magic Mountain|&#10003;|&#10003;|&#10007;|
|Six Flags Great America|&#10003;|&#10003;|&#10007;|
|Six Flags Fiesta Texas|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Arlington|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Los Angeles|&#10003;|&#10003;|&#10007;|
|Six Flags America|&#10003;|&#10003;|&#10007;|
|Six Flags Discovery Kingdom|&#10003;|&#10003;|&#10007;|
|Six Flags New England|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Jackson|&#10003;|&#10003;|&#10007;|
|The Great Escape|&#10003;|&#10003;|&#10007;|
|Six Flags White Water, Atlanta|&#10003;|&#10003;|&#10007;|
|Six Flags Mexico|&#10003;|&#10003;|&#10007;|
|La Ronde, Montreal|&#10003;|&#10003;|&#10007;|
|Europa-Park|&#10003;|&#10003;|&#10007;|
|Alton Towers|&#10003;|&#10003;|&#10007;|
|Chessington World Of Adventures|&#10003;|&#10003;|&#10007;|

<!-- END_PARK_FEATURES_SUPPORTED -->

# Result Objects

## Ride Wait Times

    [
        {
            id: (string or number: uniquely identifying a ride),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            fastPass: (bool: is fastpass available for this ride?),
            status: (string: will either be "Operating", "Closed", or "Down"),
            schedule: { **schedule will only be present if park.supports_ride_schedules is true**
              openingTime: (timeFormat timestamp: opening time of ride),
              closingTime: (timeFormat timestamp: closing time of ride),
              type: (string: "Operating" or "Closed"),
              special: [ (array of "special" ride times, usually Disney Extra Magic Hours or similar at other parks - field may be null)
                openingTime: (timeFormat timestamp: opening time for ride),
                closingTime: (timeFormat timestamp: closing time for ride),
                type: (string: type of schedule eg. "Extra Magic Hours", but can be "Event" or "Special Ticketed Event" or other)
              ]
            },
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
|supports_ride_schedules|Does this park return schedules for rides?|

    var DisneyAPI = require("wdwjs");

    // print each park's timezone
    for (var park in DisneyAPI) {
      var parkObj = new DisneyAPI[park]();
      console.log("* " + parkObj.name + " => " + parkObj.park_timezone);
    }

Prints:

<!-- START_PARK_TIMEZONE_LIST -->
    * Magic Kingdom - Walt Disney World Florida => America/New_York
    * Epcot - Walt Disney World Florida => America/New_York
    * Hollywood Studios - Walt Disney World Florida => America/New_York
    * Animal Kingdom - Walt Disney World Florida => America/New_York
    * Magic Kingdom - Disneyland California => America/Los_Angeles
    * California Adventure - Disneyland California => America/Los_Angeles
    * Magic Kingdom - Disneyland Paris => Europe/Paris
    * Walt Disney Studios - Disneyland Paris => Europe/Paris
    * Disneyland Hong Kong => Asia/Hong_Kong
    * Disneyland Tokyo => Asia/Tokyo
    * DisneySea Tokyo => Asia/Tokyo
    * Shanghai Disney Resort => Asia/Shanghai
    * SeaWorld Florida => America/New_York
    * SeaWorld San Antonio => America/Chicago
    * SeaWorld San Diego => America/Los_Angeles
    * Busch Gardens Williamsburg => America/New_York
    * Busch Gardens Tampa => America/New_York
    * Sesame Place => America/New_York
    * Universal Studios Orlando => America/New_York
    * Universal Island Of Adventure => America/New_York
    * Six Flags Over Texas => America/Chicago
    * Six Flags Over Georgia => America/New_York
    * Six Flags St. Louis => America/Chicago
    * Six Flags Great Adventure => America/New_York
    * Six Flags Magic Mountain => America/Los_Angeles
    * Six Flags Great America => America/Chicago
    * Six Flags Fiesta Texas => America/Chicago
    * Six Flags Hurricane Harbor, Arlington => America/Chicago
    * Six Flags Hurricane Harbor, Los Angeles => America/Los_Angeles
    * Six Flags America => America/New_York
    * Six Flags Discovery Kingdom => America/Los_Angeles
    * Six Flags New England => America/New_York
    * Six Flags Hurricane Harbor, Jackson => America/New_York
    * The Great Escape => America/New_York
    * Six Flags White Water, Atlanta => America/New_York
    * Six Flags Mexico => America/Toronto
    * La Ronde, Montreal => America/Toronto
    * Europa-Park => Europe/Berlin
    * Alton Towers => Europe/London
    * Chessington World Of Adventures => Europe/London

<!-- END_PARK_TIMEZONE_LIST -->

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

# Change Log

v3.0.0

* Refactored codebase significantly
* Added SeaWorld parks (including Busch Gardens and Sesame Place)
* Added Universal Studios and Island Of Adventure parks to API
* Setting environment variable "DEBUG=true" will supply better debugging information that we've had in previous versions
* Disney World Florida, Disneyland California, Disneyland Paris, Disneyland Shanghai and Disneyland Hong Kong now share a common codebase.
* (breaking change) GetSchedule is now GetOpeningTimes
* (breaking change) Schedules now return a maximum of one element per day, with "special" opening hours as a sub-object called "special" (eg. Extra Magic Hours)
* (breaking change) Park object names have been renamed
* (breaking change) No longer need to create a new wdwjs() object to start the API, make separate new objects for each park you wish to access
* 3.0.3 added BETA Six Flags support. Some parks do not yet return proper wait time data, see [#12](https://github.com/cubehouse/wdwJS/issues/12)
* 3.0.6 added ride schedules (only for Disney parks) and new status string for each ride wait time entry
* 3.0.7 fixed Tokyo Disneyland ride active status and added updateTime to Tokyo ride outputs (see #17)
* 3.0.10 added Alton Towers to the supported parks
* 3.0.11 added Chessington to the supported parks
* 3.0.12 added Shanghai Disney Resort to the supported parks
* 3.0.14 added Europa-Park to the supported parks
* 3.1.0 fixed Disney API calls with a new client ID

v2.0.0

* (breaking change) You must now specify "WDWRequests: true" in your setup options if you wish direct access to WDW API function helpers
* Disneyland Paris is now part of the same API service as Disney World Resort and Disneyland California.
* Added Tokyo Disneyland to supported parks
* Added (non-Disney) Universal Orlando parks to supported parks (added: 2.0.4)

v1.0.0

* (breaking change) Response formats simplified so all parks return same data structure
* Added Disneyland Paris

# Development

## Running Tests

wdwJS supports mocha unit tests. Install mocha with npm install -g mocha

Run the following to test all the supported parks

    mocha

You can also test an individual park using the PARK_ID environment variable, for example:

    PARKID=UniversalStudiosFlorida mocha

Each pull request and commit will run these tests automatically on travis-ci.org. For test history, see https://travis-ci.org/cubehouse/wdwJS

## Debug Mode

You can enable debug mode for any individual park by passing debug: true into it's configuration object (see "API Options" above).

You can also set the environment variable "DEBUG" to enable debug logs for all parks.

wdwJS also supports the standard NODE_DEBUG environment variable.

    NODE_DEBUG=wdwjs mocha

Environment variables can be combined:

    NODE_DEBUG=wdwjs PARKID=UniversalStudiosFlorida mocha

## Contributing

Each park inherits it's core logic from parkBase.js.

For each set of parks, a base object should be made with all the core logic for that API/park group.

Then, for each park, a basic shell object should be implemented that just configures the park's base object (and overrides anything in unusual setups).

Throughout the API, please make use of the Dbg function so parks are easy to maintain if APIs change.

Please raise issues and make pull requests with new features :)

# People using wdwJS

If you're using wdwJS for a project, please let me know! I'd love to see what people are doing!

## Pebble Apps

* [Disneyland California Wait Times](https://apps.getpebble.com/en_US/application/5656424b4431a2ce6c00008d)
* [Disneyland Paris Wait Times](https://apps.getpebble.com/en_US/application/55e25e8d3ea1fb6fa30000bd)
* [Disney World Wait Times](https://apps.getpebble.com/en_US/application/54bdb77b54845b1bf40000bb)
