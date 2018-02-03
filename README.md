# themeparks (previously wdwJS)

An unofficial API library for accessing ride wait times and park opening times for many theme parks around the world, including Disney, Universal and SeaWorld parks.

[![Build Status](https://travis-ci.org/cubehouse/themeparks.svg?branch=master)](https://travis-ci.org/cubehouse/themeparks) [![npm version](https://badge.fury.io/js/themeparks.svg)](https://badge.fury.io/js/themeparks) [![Dependency Status](https://beta.gemnasium.com/badges/github.com/cubehouse/themeparks.svg)](https://beta.gemnasium.com/projects/github.com/cubehouse/themeparks)

[![GitHub stars](https://img.shields.io/github/stars/cubehouse/themeparks.svg)](https://github.com/cubehouse/themeparks/stargazers) ![Downloads](https://img.shields.io/npm/dt/themeparks.svg) ![Monthly Downloads](https://img.shields.io/npm/dm/themeparks.svg)

[Roadmap](https://github.com/cubehouse/themeparks/projects/1) | [Documentation](https://cubehouse.github.io/themeparks/) | [Change Log](CHANGELOG.md) | [Supported Parks](#supported-park-features)

## Install

    npm install themeparks --save

## Migrate from wdwJS 3.0

If you were using wdwJS previously, please follow this guide to [migrate from wdwJS 3.0 to themeparks 4.0](https://github.com/cubehouse/themeparks/wiki/Migrating-from-3.0-to-4.0)

## Example Use

    // include the Themeparks library
    const Themeparks = require("themeparks");

    // configure where SQLite DB sits (will be created in working directory if not set)
    Themeparks.Settings.Cache = __dirname + "/themeparks.db";

    // access a specific park
    //  Create this *ONCE* and re-use this object for the lifetime of your application
    //  re-creating this every time you require access is very slow, and will fetch data repeatedly for no purpose
    const DisneyWorldMagicKingdom = new Themeparks.Parks.WaltDisneyWorldMagicKingdom();

    // Access wait times by Promise
    DisneyWorldMagicKingdom.GetWaitTimes().then((rideTimes) => {
        for(var i=0, ride; ride=rideTimes[i++];) {
            console.log(ride.name + ": " + ride.waitTime + " minutes wait");
        }
    }, console.error /** Handle any errors */);

    // Get park opening times
    DisneyWorldMagicKingdom.GetOpeningTimes().then((times) => {
        for(var i=0, time; time=times[i++];) {
            if (time.type == "Operating") {
                console.log("[" + time.date + "] Open from " + time.openingTime + " until " + time.closingTime);
            }
        }
    }, console.error /** Handle any errors */);

### Using Promises or callbacks

Both GetWaitTimes and GetOpeningTimes work either through callback or Promises.

This is the same as the above example, but using a callback instead of a Promise.

    // access wait times via callback
    disneyMagicKingdom.GetWaitTimes(function(err, rides) {
        if (err) return console.error(err);

        // print each wait time
        for(var i=0, ride; ride=rides[i++];) {
            console.log(ride.name + ": " + ride.waitTime + " minutes wait");
        }
    });

### Proxy

If you wish to use themeparks with a proxy, you can set a proxy in the library settings.

    // include the Themeparks library
    var Themeparks = require("themeparks");

    // setup proxy (this is a library-wide setting, all further HTTP requests will use this proxy)
    Themeparks.Settings.ProxyURL = "socks://127.0.0.1:9050";

## Change Log

[View themeparks Change Log](CHANGELOG.md)

## Parks available

<!-- START_SUPPORTED_PARKS_LIST -->


<!-- END_SUPPORTED_PARKS_LIST -->

## Supported Park Features

<!-- START_PARK_FEATURES_SUPPORTED -->
|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|

<!-- END_PARK_FEATURES_SUPPORTED -->

## Result Objects

### Ride Wait Times

    [
        {
            id: (string or number: uniquely identifying a ride),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            fastPass: (bool: is fastpass available for this ride?),
            fastPassReturnTime: { (object containing current return times, parks supporting this will set FastPassReturnTimes to true - entire field may be null for unsupported rides or when fastPass has ran out for the day)
                startTime: (string return time formatted as "HH:mm": start of the current return time period),
                endTime: (string return time formatted as "HH:mm": end of the current return time period),
                lastUpdate: (JavaScript Date object: last time the fastPass return time changed),
            },
            status: (string: will either be "Operating", "Closed", or "Down"),
            lastUpdate: (JavaScript Date object: last time this ride had new data),
            schedule: { **schedule will only be present if park.SupportsRideSchedules is true**
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

### Schedules

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

## Park Object values

There are some values available on each park object that may be useful.

|Variable|Description|
|:-------|:----------|
|Name|Name of the park|
|Timezone|The park's local timezone|
|Location|This park's location (as a "GeoLocation" object, see [GeoLocation Docs](https://cubehouse.github.io/themeparks/GeoLocation.html) for available methods/properties)|
|SupportsWaitTimes|Does this park's API support ride wait times?|
|SupportsOpeningTimes|Does this park's API support opening hours?|
|SupportsRideSchedules|Does this park return schedules for rides?|
|FastPass|Does this park have FastPass (or a FastPass-style service)?|
|FastPassReturnTimes|Does this park tell you the FastPass return times?|
|TimeNow([momentjs date format])|Current time at this park (optional momentjs date format to return time in)|
|DateNow([momentjs date format])|Current date at this park (optional momentjs date format to return date in)|
|UserAgent|The HTTP UserAgent this park is using to make API requests (usually randomly generated per-park at runtime)|

    var ThemeParks = require("themeparks");

    // print each park's name, current location, and timezone
    for (var park in ThemeParks.Parks) {
      var parkObj = new ThemeParks.Parks[park]();
      console.log("* " + parkObj.Name + " [" + parkObj.Location.toString() + "]: (" + parkObj.Timezone + ")");
    }

Prints:

<!-- START_PARK_TIMEZONE_LIST -->


<!-- END_PARK_TIMEZONE_LIST -->

## Development

### Building

This project is using ES6 features, which can't be used by legacy version of NodeJS. We're also using "import", which is not available in NodeJS.

So, the project needs to be built into regular JavaScript to work with the older NodeJS versions. This is done by running ``npm run build``

This will compile everything in source/ into dist/.

Building will also create sourcemaps, so any stacktraces will point to the original code in the source/ directory.

### Running Tests

themeparks supports mocha unit tests. Install mocha with npm install -g mocha

Run the following to test the library's unit tests (this will build the library and then run functional offline unit tests):

    npm test

You can also run unit tests against the source js files using ```npm run testdev```.

There is a separate test for checking the library still connects to park APIs correctly. This is the "online test".

    npm run testonline

You can also test an individual park using the PARKID environment variable, for example:

    PARKID=UniversalStudiosFlorida npm run testonline

### Debug Mode

Themeparks supports the standard NODE_DEBUG environment variable. Pass the name of the library into NODE_DEBUG to turn on debug mode:

    NODE_DEBUG=themeparks npm run testonline

Environment variables can be combined:

    NODE_DEBUG=themeparks PARKID=UniversalStudiosFlorida npm run testonline

### Contributing

Each park inherits it's core logic from lib/park.js.

For each set of parks, a base object should be made with all the core logic for that API/park group.

Then, for each park, a basic shell object should be implemented that just configures the park's base object (and overrides anything in unusual setups).

Throughout the API, please make use of the this.Log() function so debugging parks when things break is easier.

Please raise issues and make pull requests with new features :)

See full contribution guide at [Themeparks Contribution Guide](https://github.com/cubehouse/themeparks/wiki/Contributing).

A rough guide for adding new parks is also available at [Adding New Parks to the ThemeParks API](https://github.com/cubehouse/themeparks/wiki/Adding-New-Parks).

## People using themeparks

If you're using themeparks for a project, please let me know! I'd love to see what people are doing!

### Websites and Mobile Apps

* [My Disney Visit](http://www.mydisneyvisit.com/) - Walt Disney World
* [ChronoPass](https://play.google.com/store/apps/details?id=fr.dechriste.android.attractions&hl=en_GB) - Walt Disney World, Disneyland Paris, Parc Asterix, EuropaPark

### Pebble Apps

* [Disneyland California Wait Times](https://apps.getpebble.com/en_US/application/5656424b4431a2ce6c00008d)
* [Disneyland Paris Wait Times](https://apps.getpebble.com/en_US/application/55e25e8d3ea1fb6fa30000bd)
* [Disney World Wait Times](https://apps.getpebble.com/en_US/application/54bdb77b54845b1bf40000bb)
