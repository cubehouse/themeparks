# themeparks

An unofficial API library for accessing ride wait times and park opening times for many theme parks around the world, including Disney, Universal and SeaWorld parks.

[![Build Status](https://travis-ci.org/cubehouse/themeparks.svg?branch=master)](https://travis-ci.org/cubehouse/themeparks) [![npm version](https://badge.fury.io/js/themeparks.svg)](https://badge.fury.io/js/themeparks) [![Dependency Status](https://beta.gemnasium.com/badges/github.com/cubehouse/themeparks.svg)](https://beta.gemnasium.com/projects/github.com/cubehouse/themeparks)

[![GitHub stars](https://img.shields.io/github/stars/cubehouse/themeparks.svg)](https://github.com/cubehouse/themeparks/stargazers) ![Downloads](https://img.shields.io/npm/dt/themeparks.svg) ![Monthly Downloads](https://img.shields.io/npm/dm/themeparks.svg)

[Roadmap](https://github.com/cubehouse/themeparks/projects/1) | [Documentation](https://cubehouse.github.io/themeparks/) | [Change Log](CHANGELOG.md) | [Supported Parks](#supported-park-features)

## Install

    npm install themeparks --save

## Migrate from themeparks 4.x

If you have been using themeparks 4.x, please follow this guide to [migrate from themeparks 4.x to themeparks 5.x](https://github.com/cubehouse/themeparks/wiki/Migrating-from-4.x-to-5.x)

## Example Use

    // include the Themeparks library
    const Themeparks = require("themeparks");

    // configure where SQLite DB sits
    // optional - will be created in node working directory if not configured
    // Themeparks.Settings.Cache = __dirname + "/themeparks.db";

    // access a specific park
    //  Create this *ONCE* and re-use this object for the lifetime of your application
    //  re-creating this every time you require access is very slow, and will fetch data repeatedly for no purpose
    const DisneyWorldMagicKingdom = new Themeparks.Parks.WaltDisneyWorldMagicKingdom();

    // Access wait times by Promise
    DisneyWorldMagicKingdom.GetWaitTimes().then((rideTimes) => {
        for(var i=0, ride; ride=rideTimes[i++];) {
            console.log(`${ride.name}: ${ride.waitTime} minutes wait (${ride.status})`);
        }
    }).catch((error) => {
        console.error(error);
    });

    // Get park opening times
    DisneyWorldMagicKingdom.GetOpeningTimes().then((times) => {
        for(var i=0, time; time=times[i++];) {
            if (time.type == "Operating") {
                console.log(`[${time.date}] Open from ${time.openingTime} until ${time.closingTime}`);
            }
        }
    }).catch((error) => {
        console.error(error);
    });

### Using Promises or callbacks

Both GetWaitTimes and GetOpeningTimes work either through callback or Promises.

This is the same as the above example, but using a callback instead of a Promise.

    // access wait times via callback
    disneyMagicKingdom.GetWaitTimes((err, rides) => {
        if (err) return console.error(err);

        // print each wait time
        for(var i=0, ride; ride=rides[i++];) {
            console.log(`${ride.name}: ${ride.waitTime} minutes wait (${ride.status})`);
        }
    });

### Proxy

If you wish to use themeparks with a proxy, you can pass a proxy agent when you construct the park object.

    // include the Themeparks library
    const Themeparks = require("themeparks");

    // include whichever proxy library you want to use (must provide an http.Agent object)
    const SocksProxyAgent = require('socks-proxy-agent');

    // create your proxy agent object
    const MyProxy = new SocksProxyAgent("socks://socks-proxy-host", true);

    // create your park object, passing in proxyAgent as an option
    const DisneyWorldMagicKingdom = new Themeparks.Parks.WaltDisneyWorldMagicKingdom({
        proxyAgent: MyProxy
    });

## Change Log

[View themeparks Change Log](CHANGELOG.md)

## Parks available

<!-- START_SUPPORTED_PARKS_LIST -->

**22** Parks Supported

* Magic Kingdom - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldMagicKingdom)
* Epcot - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldEpcot)
* Hollywood Studios - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldHollywoodStudios)
* Animal Kingdom - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldAnimalKingdom)
* Disneyland Resort - Magic Kingdom (ThemeParks.Parks.DisneylandResortMagicKingdom)
* Disneyland Resort - California Adventure (ThemeParks.Parks.DisneylandResortCaliforniaAdventure)
* Disneyland Paris - Magic Kingdom (ThemeParks.Parks.DisneylandParisMagicKingdom)
* Walt Disney Studios - Disneyland Paris (ThemeParks.Parks.DisneylandParisWaltDisneyStudios)
* Hong Kong Disneyland (ThemeParks.Parks.HongKongDisneyland)
* Magic Kingdom - Shanghai Disney Resort (ThemeParks.Parks.ShanghaiDisneyResortMagicKingdom)
* Tokyo Disney Resort - Magic Kingdom (ThemeParks.Parks.TokyoDisneyResortMagicKingdom)
* Tokyo Disney Resort - Disney Sea (ThemeParks.Parks.TokyoDisneyResortDisneySea)
* Europa Park (ThemeParks.Parks.EuropaPark)
* Parc-Asterix (ThemeParks.Parks.AsterixPark)
* California's Great America (ThemeParks.Parks.CaliforniasGreatAmerica)
* Canada's Wonderland (ThemeParks.Parks.CanadasWonderland)
* Carowinds (ThemeParks.Parks.Carowinds)
* Cedar Point (ThemeParks.Parks.CedarPoint)
* Kings Island (ThemeParks.Parks.KingsIsland)
* Knott's Berry Farm (ThemeParks.Parks.KnottsBerryFarm)
* Dollywood (ThemeParks.Parks.Dollywood)
* Silver Dollar City (ThemeParks.Parks.SilverDollarCity)

<!-- END_SUPPORTED_PARKS_LIST -->

## Supported Park Features

<!-- START_PARK_FEATURES_SUPPORTED -->
|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
|Magic Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Epcot - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Hollywood Studios - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Animal Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Disneyland Resort - Magic Kingdom|&#10003;|&#10003;|&#10007;|
|Disneyland Resort - California Adventure|&#10003;|&#10003;|&#10007;|
|Disneyland Paris - Magic Kingdom|&#10003;|&#10003;|&#10007;|
|Walt Disney Studios - Disneyland Paris|&#10003;|&#10003;|&#10007;|
|Hong Kong Disneyland|&#10003;|&#10003;|&#10007;|
|Magic Kingdom - Shanghai Disney Resort|&#10003;|&#10003;|&#10007;|
|Tokyo Disney Resort - Magic Kingdom|&#10003;|&#10003;|&#10007;|
|Tokyo Disney Resort - Disney Sea|&#10003;|&#10003;|&#10007;|
|Europa Park|&#10003;|&#10003;|&#10007;|
|Parc-Asterix|&#10003;|&#10003;|&#10003;|
|California's Great America|&#10003;|&#10003;|&#10007;|
|Canada's Wonderland|&#10003;|&#10003;|&#10007;|
|Carowinds|&#10003;|&#10003;|&#10007;|
|Cedar Point|&#10003;|&#10003;|&#10007;|
|Kings Island|&#10003;|&#10003;|&#10007;|
|Knott's Berry Farm|&#10003;|&#10003;|&#10007;|
|Dollywood|&#10003;|&#10003;|&#10007;|
|Silver Dollar City|&#10003;|&#10003;|&#10007;|

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
|LocationString|This park's location as a geolocation string|
|SupportsWaitTimes|Does this park's API support ride wait times?|
|SupportsOpeningTimes|Does this park's API support opening hours?|
|SupportsRideSchedules|Does this park return schedules for rides?|
|FastPass|Does this park have FastPass (or a FastPass-style service)?|
|FastPassReturnTimes|Does this park tell you the FastPass return times?|
|Now|Current date/time at this park (returned as a Moment object)|
|UserAgent|The HTTP UserAgent this park is using to make API requests (usually randomly generated per-park at runtime)|

    const ThemeParks = require("themeparks");

    // construct our park objects and keep them in memory for fast access later
    const Parks = {};
    for (const park in ThemeParks.Parks) {
      Parks[park] = new ThemeParks.Parks[park]();
    }

    // print each park's name, current location, and timezone
    for (const park in Parks) {
      console.log(`* ${Parks[park].Name} [${Parks[park].LocationString}]: (${Parks[park].Timezone})`);
    }

Prints:

<!-- START_PARK_TIMEZONE_LIST -->

* Magic Kingdom - Walt Disney World Florida [(28°23′6.72″N, 81°33′50.04″W)]: (America/New_York)
* Epcot - Walt Disney World Florida [(28°22′28.92″N, 81°32′57.84″W)]: (America/New_York)
* Hollywood Studios - Walt Disney World Florida [(28°21′27.00″N, 81°33′29.52″W)]: (America/New_York)
* Animal Kingdom - Walt Disney World Florida [(28°21′19.08″N, 81°35′24.36″W)]: (America/New_York)
* Disneyland Resort - Magic Kingdom [(33°48′36.39″N, 117°55′8.30″W)]: (America/Los_Angeles)
* Disneyland Resort - California Adventure [(33°48′31.39″N, 117°55′8.36″W)]: (America/Los_Angeles)
* Disneyland Paris - Magic Kingdom [(48°52′13.16″N, 2°46′46.82″E)]: (Europe/Paris)
* Walt Disney Studios - Disneyland Paris [(48°52′5.78″N, 2°46′50.59″E)]: (Europe/Paris)
* Hong Kong Disneyland [(22°18′47.52″N, 114°2′40.20″E)]: (Asia/Hong_Kong)
* Magic Kingdom - Shanghai Disney Resort [(31°8′35.88″N, 121°39′28.80″E)]: (Asia/Shanghai)
* Tokyo Disney Resort - Magic Kingdom [(35°38′5.45″N, 139°52′45.46″E)]: (Asia/Tokyo)
* Tokyo Disney Resort - Disney Sea [(35°37′37.40″N, 139°53′20.75″E)]: (Asia/Tokyo)
* Europa Park [(48°16′8.15″N, 7°43′17.61″E)]: (Europe/Berlin)
* Parc-Asterix [(49°8′9.75″N, 2°34′21.96″E)]: (Europe/Paris)
* California's Great America [(37°23′52.08″N, 121°58′28.98″W)]: (America/Los_Angeles)
* Canada's Wonderland [(43°50′34.80″N, 79°32′20.40″W)]: (America/Toronto)
* Carowinds [(35°6′16.20″N, 80°56′21.84″W)]: (America/New_York)
* Cedar Point [(41°28′42.24″N, 82°40′45.48″W)]: (America/New_York)
* Kings Island [(39°20′40.92″N, 84°16′6.96″W)]: (America/New_York)
* Knott's Berry Farm [(33°50′39.12″N, 117°59′54.96″W)]: (America/Los_Angeles)
* Dollywood [(35°47′43.18″N, 83°31′51.19″W)]: (America/New_York)
* Silver Dollar City [(36°40′5.44″N, 93°20′18.84″W)]: (America/Chicago)

<!-- END_PARK_TIMEZONE_LIST -->

## Development

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
