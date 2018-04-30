# themeparks (previously wdwJS)

An unofficial API library for accessing ride wait times and park opening times for many theme parks around the world, including Disney, Universal and SeaWorld parks.

[![Build Status](https://travis-ci.org/cubehouse/themeparks.svg?branch=master)](https://travis-ci.org/cubehouse/themeparks) [![npm version](https://badge.fury.io/js/themeparks.svg)](https://badge.fury.io/js/themeparks) [![Dependency Status](https://beta.gemnasium.com/badges/github.com/cubehouse/themeparks.svg)](https://beta.gemnasium.com/projects/github.com/cubehouse/themeparks)
[![npm history](https://nodei.co/npm-dl/themeparks.png)](https://www.npmjs.com/package/themeparks/)

[Roadmap](https://github.com/cubehouse/themeparks/projects/1) | [Documentation](https://cubehouse.github.io/themeparks/) | [Change Log](CHANGELOG.md) | [Supported Parks](#supported-park-features)

## Install

    npm install themeparks --save

## Migrate from wdwJS 3.0

If you were using wdwJS previously, please follow this guide to [migrate from wdwJS 3.0 to themeparks 4.0](https://github.com/cubehouse/themeparks/wiki/Migrating-from-3.0-to-4.0)

## Example Use

    // include the Themeparks library
    var Themeparks = require("themeparks");

    // list all the parks supported by the library
    for (var park in Themeparks.Parks) {
        console.log("* " + new Themeparks.Parks[park]().Name + " (DisneyAPI." + park + ")");
    }

    // access a specific park
    var disneyMagicKingdom = new Themeparks.Parks.WaltDisneyWorldMagicKingdom();

    // access wait times by Promise
    disneyMagicKingdom.GetWaitTimes().then(function(rides) {
        // print each wait time
        for(var i=0, ride; ride=rides[i++];) {
            console.log(ride.name + ": " + ride.waitTime + " minutes wait");
        }
    }, console.error);

    // get park opening times
    disneyMagicKingdom.GetOpeningTimes().then(function(times) {
        // print opening times
        for(var i=0, time; time=times[i++];) {
            if (time.type == "Operating") {
                console.log("[" + time.date + "] Open from " + time.openingTime + " until " + time.closingTime);
            }
        }
    }, console.error);

### Caching

It is possible to speed up the library by passing on a caching module.

This is highly recommended. Using caching allows various data to persist between executions of the library, which will speed up initialisation after any application restarts.

First, install the caching system you wish to use with node-cache-manager. For example, the below uses file-system caching (Redis/Mongo or the alike recommended). For this example, you can install the filesystem cacher with ```npm install cache-manager-fs-binary --save```.

To do so, populate the Themeparks.Settings.Cache variables before using the library.

    // include the Themeparks library
    var Themeparks = require("themeparks");

    // initialise caching (see https://github.com/BryanDonovan/node-cache-manager)
    var cacheManager = require('cache-manager');
    Themeparks.Settings.Cache = cacheManager.caching({
        store: require('cache-manager-fs-binary'),
        options: {
            reviveBuffers: false,
            binaryAsStream: true,
            ttl: 60 * 60,
            maxsize: 1000 * 1000 * 1000,
            path: 'diskcache',
            preventfill: false
        }
    });

See [https://github.com/BryanDonovan/node-cache-manager](https://github.com/BryanDonovan/node-cache-manager) for other caching systems available.

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

* Magic Kingdom - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldMagicKingdom)
* Epcot - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldEpcot)
* Hollywood Studios - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldHollywoodStudios)
* Animal Kingdom - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldAnimalKingdom)
* Magic Kingdom - Disneyland Resort (ThemeParks.Parks.DisneylandResortMagicKingdom)
* California Adventure - Disneyland Resort (ThemeParks.Parks.DisneylandResortCaliforniaAdventure)
* Magic Kingdom - Disneyland Paris (ThemeParks.Parks.DisneylandParisMagicKingdom)
* Walt Disney Studios - Disneyland Paris (ThemeParks.Parks.DisneylandParisWaltDisneyStudios)
* Magic Kingdom - Shanghai Disney Resort (ThemeParks.Parks.ShanghaiDisneyResortMagicKingdom)
* Tokyo Disney Resort - Magic Kingdom (ThemeParks.Parks.TokyoDisneyResortMagicKingdom)
* Tokyo Disney Resort - Disney Sea (ThemeParks.Parks.TokyoDisneyResortDisneySea)
* Hong Kong Disneyland (ThemeParks.Parks.HongKongDisneyland)
* Universal Studios Florida (ThemeParks.Parks.UniversalStudiosFlorida)
* Universal's Islands Of Adventure (ThemeParks.Parks.UniversalIslandsOfAdventure)
* Universal Volcano Bay (ThemeParks.Parks.UniversalVolcanoBay)
* Universal Studios Hollywood (ThemeParks.Parks.UniversalStudiosHollywood)
* Universal Studios Singapore (ThemeParks.Parks.UniversalStudiosSingapore)
* Seaworld Orlando (ThemeParks.Parks.SeaworldOrlando)
* Seaworld San Antonio (ThemeParks.Parks.SeaworldSanAntonio)
* Seaworld San Diego (ThemeParks.Parks.SeaworldSanDiego)
* Busch Gardens - Tampa Bay (ThemeParks.Parks.BuschGardensTampaBay)
* Busch Gardens - Williamsburg (ThemeParks.Parks.BuschGardensWilliamsburg)
* Sesame Place (ThemeParks.Parks.SesamePlace)
* Europa Park (ThemeParks.Parks.EuropaPark)
* Six Flags Over Texas (ThemeParks.Parks.SixFlagsOverTexas)
* Six Flags Over Georgia (ThemeParks.Parks.SixFlagsOverGeorgia)
* Six Flags St. Louis (ThemeParks.Parks.SixFlagsStLouis)
* Six Flags Great Adventure (ThemeParks.Parks.SixFlagsGreatAdventure)
* Six Flags Magic Mountain (ThemeParks.Parks.SixFlagsMagicMountain)
* Six Flags Great America (ThemeParks.Parks.SixFlagsGreatAmerica)
* Six Flags Fiesta Texas (ThemeParks.Parks.SixFlagsFiestaTexas)
* Six Flags Hurricane Harbor, Arlington (ThemeParks.Parks.SixFlagsHurricaneHarborArlington)
* Six Flags Hurricane Harbor, Los Angeles (ThemeParks.Parks.SixFlagsHurricaneHarborLosAngeles)
* Six Flags America (ThemeParks.Parks.SixFlagsAmerica)
* Six Flags Discovery Kingdom (ThemeParks.Parks.SixFlagsDiscoveryKingdom)
* Six Flags New England (ThemeParks.Parks.SixFlagsNewEngland)
* Six Flags Hurricane Harbor, Jackson (ThemeParks.Parks.SixFlagsHurricaneHarborJackson)
* The Great Escape (ThemeParks.Parks.TheGreatEscape)
* Six Flags White Water, Atlanta (ThemeParks.Parks.SixFlagsWhiteWaterAtlanta)
* Six Flags México (ThemeParks.Parks.SixFlagsMexico)
* La Ronde, Montreal (ThemeParks.Parks.LaRondeMontreal)
* Alton Towers (ThemeParks.Parks.AltonTowers)
* Thorpe Park (ThemeParks.Parks.ThorpePark)
* Chessington World Of Adventures (ThemeParks.Parks.ChessingtonWorldOfAdventures)
* Parc-Asterix (ThemeParks.Parks.AsterixPark)
* Hershey Park (ThemeParks.Parks.HersheyPark)
* Knott's Berry Farm (ThemeParks.Parks.KnottsBerryFarm)
* Cedar Point (ThemeParks.Parks.CedarPoint)
* Carowinds (ThemeParks.Parks.Carowinds)
* Canada's Wonderland (ThemeParks.Parks.CanadasWonderland)
* Kings Island (ThemeParks.Parks.KingsIsland)
* Efteling (ThemeParks.Parks.Efteling)

<!-- END_SUPPORTED_PARKS_LIST -->

## Supported Park Features

<!-- START_PARK_FEATURES_SUPPORTED -->
|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
|Magic Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Epcot - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Hollywood Studios - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Animal Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Disneyland Resort|&#10003;|&#10003;|&#10003;|
|California Adventure - Disneyland Resort|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Walt Disney Studios - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Shanghai Disney Resort|&#10003;|&#10003;|&#10003;|
|Tokyo Disney Resort - Magic Kingdom|&#10003;|&#10003;|&#10007;|
|Tokyo Disney Resort - Disney Sea|&#10003;|&#10003;|&#10007;|
|Hong Kong Disneyland|&#10003;|&#10003;|&#10003;|
|Universal Studios Florida|&#10003;|&#10003;|&#10007;|
|Universal's Islands Of Adventure|&#10003;|&#10003;|&#10007;|
|Universal Volcano Bay|&#10003;|&#10003;|&#10007;|
|Universal Studios Hollywood|&#10003;|&#10003;|&#10007;|
|Universal Studios Singapore|&#10003;|&#10003;|&#10007;|
|Seaworld Orlando|&#10003;|&#10003;|&#10007;|
|Seaworld San Antonio|&#10003;|&#10003;|&#10007;|
|Seaworld San Diego|&#10003;|&#10003;|&#10007;|
|Busch Gardens - Tampa Bay|&#10003;|&#10003;|&#10007;|
|Busch Gardens - Williamsburg|&#10003;|&#10003;|&#10007;|
|Sesame Place|&#10003;|&#10003;|&#10007;|
|Europa Park|&#10003;|&#10003;|&#10007;|
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
|Six Flags México|&#10003;|&#10003;|&#10007;|
|La Ronde, Montreal|&#10003;|&#10003;|&#10007;|
|Alton Towers|&#10003;|&#10003;|&#10007;|
|Thorpe Park|&#10003;|&#10003;|&#10007;|
|Chessington World Of Adventures|&#10003;|&#10003;|&#10007;|
|Parc-Asterix|&#10003;|&#10003;|&#10003;|
|Hershey Park|&#10003;|&#10003;|&#10007;|
|Knott's Berry Farm|&#10003;|&#10003;|&#10007;|
|Cedar Point|&#10003;|&#10003;|&#10007;|
|Carowinds|&#10003;|&#10003;|&#10007;|
|Canada's Wonderland|&#10003;|&#10003;|&#10007;|
|Kings Island|&#10003;|&#10003;|&#10007;|
|Efteling|&#10003;|&#10003;|&#10007;|
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

* Magic Kingdom - Walt Disney World Florida [(28°23′6.72″N, 81°33′50.04″W)]: (America/New_York)
* Epcot - Walt Disney World Florida [(28°22′28.92″N, 81°32′57.84″W)]: (America/New_York)
* Hollywood Studios - Walt Disney World Florida [(28°21′27.00″N, 81°33′29.52″W)]: (America/New_York)
* Animal Kingdom - Walt Disney World Florida [(28°21′19.08″N, 81°35′24.36″W)]: (America/New_York)
* Magic Kingdom - Disneyland Resort [(33°48′36.39″N, 117°55′8.30″W)]: (America/Los_Angeles)
* California Adventure - Disneyland Resort [(33°48′31.39″N, 117°55′8.36″W)]: (America/Los_Angeles)
* Magic Kingdom - Disneyland Paris [(48°52′13.16″N, 2°46′46.82″E)]: (Europe/Paris)
* Walt Disney Studios - Disneyland Paris [(48°52′5.78″N, 2°46′50.59″E)]: (Europe/Paris)
* Magic Kingdom - Shanghai Disney Resort [(31°8′35.88″N, 121°39′28.80″E)]: (Asia/Shanghai)
* Tokyo Disney Resort - Magic Kingdom [(35°38′5.45″N, 139°52′45.46″E)]: (Asia/Tokyo)
* Tokyo Disney Resort - Disney Sea [(35°37′37.40″N, 139°53′20.75″E)]: (Asia/Tokyo)
* Hong Kong Disneyland [(22°18′47.52″N, 114°2′40.20″E)]: (Asia/Hong_Kong)
* Universal Studios Florida [(28°28′29.94″N, 81°27′59.39″W)]: (America/New_York)
* Universal's Islands Of Adventure [(28°28′20.07″N, 81°28′4.28″W)]: (America/New_York)
* Universal Volcano Bay [(28°27′44.28″N, 81°28′14.52″W)]: (America/New_York)
* Universal Studios Hollywood [(34°8′14.14″N, 118°21′19.86″W)]: (America/Los_Angeles)
* Universal Studios Singapore [(1°15′15.30″N, 103°49′25.67″E)]: (Asia/Singapore)
* Seaworld Orlando [(28°24′41.04″N, 81°27′47.88″W)]: (America/New_York)
* Seaworld San Antonio [(29°27′30.56″N, 98°41′59.45″W)]: (America/Chicago)
* Seaworld San Diego [(32°45′51.49″N, 117°13′35.19″W)]: (America/Los_Angeles)
* Busch Gardens - Tampa Bay [(28°2′0.94″N, 82°25′14.52″W)]: (America/New_York)
* Busch Gardens - Williamsburg [(37°14′14.01″N, 76°38′42.46″W)]: (America/New_York)
* Sesame Place [(40°11′8.40″N, 74°52′17.26″W)]: (America/New_York)
* Europa Park [(48°16′8.15″N, 7°43′17.61″E)]: (Europe/Berlin)
* Six Flags Over Texas [(32°45′17.95″N, 97°4′13.33″W)]: (America/Chicago)
* Six Flags Over Georgia [(33°46′14.08″N, 84°33′5.36″W)]: (America/New_York)
* Six Flags St. Louis [(38°30′47.61″N, 90°40′30.69″W)]: (America/Chicago)
* Six Flags Great Adventure [(40°8′55.18″N, 74°26′27.69″W)]: (America/New_York)
* Six Flags Magic Mountain [(34°25′24.46″N, 118°35′42.90″W)]: (America/Los_Angeles)
* Six Flags Great America [(42°22′12.88″N, 87°56′9.30″W)]: (America/Chicago)
* Six Flags Fiesta Texas [(29°35′59.28″N, 98°36′32.50″W)]: (America/Chicago)
* Six Flags Hurricane Harbor, Arlington [(32°45′39.83″N, 97°4′58.44″W)]: (America/Chicago)
* Six Flags Hurricane Harbor, Los Angeles [(34°25′25.86″N, 118°35′42.05″W)]: (America/Los_Angeles)
* Six Flags America [(38°54′4.46″N, 76°46′16.59″W)]: (America/New_York)
* Six Flags Discovery Kingdom [(38°8′19.43″N, 122°13′59.70″W)]: (America/Los_Angeles)
* Six Flags New England [(42°2′16.54″N, 72°36′55.92″W)]: (America/New_York)
* Six Flags Hurricane Harbor, Jackson [(40°8′49.57″N, 74°26′13.56″W)]: (America/New_York)
* The Great Escape [(43°21′1.80″N, 73°41′32.10″W)]: (America/New_York)
* Six Flags White Water, Atlanta [(33°57′32.86″N, 84°31′10.37″W)]: (America/New_York)
* Six Flags México [(19°17′43.40″N, 99°12′41.19″W)]: (America/Mexico_City)
* La Ronde, Montreal [(45°31′19.18″N, 73°32′4.48″W)]: (America/Toronto)
* Alton Towers [(52°59′27.83″N, 1°53′32.25″W)]: (Europe/London)
* Thorpe Park [(51°24′19.80″N, 0°30′37.80″W)]: (Europe/London)
* Chessington World Of Adventures [(51°20′58.56″N, 0°18′52.45″W)]: (Europe/London)
* Parc-Asterix [(49°8′9.75″N, 2°34′21.96″E)]: (Europe/Paris)
* Hershey Park [(40°17′15.65″N, 76°39′30.88″W)]: (America/New_York)
* Knott's Berry Farm [(33°50′39.12″N, 117°59′54.96″W)]: (America/Los_Angeles)
* Cedar Point [(41°28′42.24″N, 82°40′45.48″W)]: (America/New_York)
* Carowinds [(35°6′16.20″N, 80°56′21.84″W)]: (America/New_York)
* Canada's Wonderland [(43°50′34.80″N, 79°32′20.40″W)]: (America/Toronto)
* Kings Island [(39°20′40.92″N, 84°16′6.96″W)]: (America/New_York)
* Efteling [(51°38′59.67″N, 5°2′36.82″E)]: (Europe/Amsterdam)

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
