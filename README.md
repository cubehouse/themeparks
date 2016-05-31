# themeparks

An unofficial API library for accessing ride wait times and park opening times for many theme parks around the world, including Disney, Universal and SeaWorld parks.

[![Build Status](https://travis-ci.org/cubehouse/wdwJS.svg?branch=master)](https://travis-ci.org/cubehouse/wdwJS) [![npm version](https://badge.fury.io/js/wdwjs.svg)](https://badge.fury.io/js/wdwjs) [![Dependency Status](https://www.versioneye.com/user/projects/55858111363861001500042c/badge.svg?style=flat)](https://www.versioneye.com/nodejs/wdwjs)
[![npm history](https://nodei.co/npm-dl/wdwjs.png)](https://www.npmjs.com/package/wdwjs/)

# Install

    npm install themeparks --save

# Example Use

    // TODO

## Parks available

<!-- START_SUPPORTED_PARKS_LIST -->
    // TODO
<!-- END_SUPPORTED_PARKS_LIST -->

# Supported Park Features

<!-- START_PARK_FEATURES_SUPPORTED -->
    // TODO
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
    // TODO
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

[View themeparks Change Log](CHANGELOG.md)

# Development

## Building

This project is using ES6 features, which can't be used by legacy version of NodeJS. We're also using "import", which is not available in NodeJS.

So, the project needs to be built into regular JavaScript to work. This is done by running ``npm run build``

This will compile everything in source/ into dist/.

Building will also create sourcemaps, so any stacktraces will point to the original code in the source/ directory.

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

## Code Style

    // TODO - define variable naming standard etc.

I recommended the [Visual Studio Code IDE](https://code.visualstudio.com/) with the [Beautify Plugin](https://marketplace.visualstudio.com/items?itemName=HookyQR.beautify) for consistency. The project is configured to beautify each file on save when this plugin is present.

# People using wdwJS

If you're using wdwJS for a project, please let me know! I'd love to see what people are doing!

## Pebble Apps

* [Disneyland California Wait Times](https://apps.getpebble.com/en_US/application/5656424b4431a2ce6c00008d)
* [Disneyland Paris Wait Times](https://apps.getpebble.com/en_US/application/55e25e8d3ea1fb6fa30000bd)
* [Disney World Wait Times](https://apps.getpebble.com/en_US/application/54bdb77b54845b1bf40000bb)
