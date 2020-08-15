# themeparks

An unofficial API library for accessing ride wait times and park opening times for many theme parks around the world, including Disney, Universal and SeaWorld parks.

[![Discord Server](https://img.shields.io/discord/734308155315453963.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/Z7RYWDg)

![Node.js CI](https://github.com/cubehouse/themeparks/workflows/Node.js%20CI/badge.svg) [![Build Status](https://travis-ci.com/cubehouse/themeparks.svg?branch=master)](https://travis-ci.com/cubehouse/themeparks) [![npm version](https://badge.fury.io/js/themeparks.svg)](https://badge.fury.io/js/themeparks) ![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/cubehouse/themeparks.svg)

![GitHub contributors](https://img.shields.io/github/contributors/cubehouse/themeparks.svg) ![npm](https://img.shields.io/npm/dt/themeparks.svg) ![node](https://img.shields.io/node/v/themeparks.svg) ![Dependent repos (via libraries.io)](https://img.shields.io/librariesio/dependent-repos/npm/themeparks.svg)

[Roadmap](https://github.com/cubehouse/themeparks/projects/1) | [Documentation](https://cubehouse.github.io/themeparks/) | [Change Log](CHANGELOG.md) | [Supported Parks](#supported-park-features)

## Install

    npm install themeparks --save

## Migrate from themeparks 4.x

If you have been using themeparks 4.x, please follow this guide to [migrate from themeparks 4.x to themeparks 5.x](https://github.com/cubehouse/themeparks/wiki/Migrating-from-4.x-to-5.x)

## Settings

You can change some settings of the library by editing the properties of the `Themeparks.Settings` object.

| Property                | Default value                    | Description                                  |
| :---------------------- | :------------------------------- | :------------------------------------------- |
| Cache                   | `${process.cwd()}/themeparks.db` | Location of Sqlite DB file                   |
| OpenTimeout             | 10 seconds                       | Open request timeout value (in milliseconds) |
| ReadTimeout             | 0 seconds                        | Read request timeout value (in milliseconds) |
| DefaultCacheLength      | 6 hours                          | Time to cache any data (in seconds)          |
| CacheWaitTimesLength    | 5 minutes                        | Time to cache waiting times (in seconds)     |
| CacheOpeningTimesLength | 1 hour                           | Time to cache opening times (in seconds)     |

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
    const CheckWaitTimes = () => {
        DisneyWorldMagicKingdom.GetWaitTimes().then((rideTimes) => {
            rideTimes.forEach((ride) => {
                console.log(`${ride.name}: ${ride.waitTime} minutes wait (${ride.status})`);
            });
        }).catch((error) => {
            console.error(error);
        }).then(() => {
            setTimeout(CheckWaitTimes, 1000 * 60 * 5); // refresh every 5 minutes
        });
    };
    CheckWaitTimes();

    // you can also call GetOpeningTimes on themeparks objects to get park opening hours

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

**61** Parks Supported

* Magic Kingdom - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldMagicKingdom)
* Epcot - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldEpcot)
* Hollywood Studios - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldHollywoodStudios)
* Animal Kingdom - Walt Disney World Florida (ThemeParks.Parks.WaltDisneyWorldAnimalKingdom)
* Magic Kingdom - Disneyland Resort (ThemeParks.Parks.DisneylandResortMagicKingdom)
* California Adventure - Disneyland Resort (ThemeParks.Parks.DisneylandResortCaliforniaAdventure)
* Magic Kingdom - Disneyland Paris (ThemeParks.Parks.DisneylandParisMagicKingdom)
* Walt Disney Studios - Disneyland Paris (ThemeParks.Parks.DisneylandParisWaltDisneyStudios)
* Hong Kong Disneyland (ThemeParks.Parks.HongKongDisneyland)
* Magic Kingdom - Shanghai Disney Resort (ThemeParks.Parks.ShanghaiDisneyResortMagicKingdom)
* Magic Kingdom - Tokyo Disney Resort (ThemeParks.Parks.TokyoDisneyResortMagicKingdom)
* Disney Sea - Tokyo Disney Resort (ThemeParks.Parks.TokyoDisneyResortDisneySea)
* Europa Park (ThemeParks.Parks.EuropaPark)
* Hershey Park (ThemeParks.Parks.HersheyPark)
* Parc-Asterix (ThemeParks.Parks.AsterixPark)
* California's Great America (ThemeParks.Parks.CaliforniasGreatAmerica)
* Canada's Wonderland (ThemeParks.Parks.CanadasWonderland)
* Carowinds (ThemeParks.Parks.Carowinds)
* Cedar Point (ThemeParks.Parks.CedarPoint)
* Kings Island (ThemeParks.Parks.KingsIsland)
* Knott's Berry Farm (ThemeParks.Parks.KnottsBerryFarm)
* Dollywood (ThemeParks.Parks.Dollywood)
* Silver Dollar City (ThemeParks.Parks.SilverDollarCity)
* Seaworld Orlando (ThemeParks.Parks.SeaworldOrlando)
* Efteling (ThemeParks.Parks.Efteling)
* Universal Studios Florida (ThemeParks.Parks.UniversalStudiosFlorida)
* Universal's Islands Of Adventure (ThemeParks.Parks.UniversalIslandsOfAdventure)
* Universal Volcano Bay (ThemeParks.Parks.UniversalVolcanoBay)
* Universal Studios Hollywood (ThemeParks.Parks.UniversalStudiosHollywood)
* Universal Studios Singapore (ThemeParks.Parks.UniversalStudiosSingapore)
* Universal Studios Japan (ThemeParks.Parks.UniversalStudiosJapan)
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
* Six Flags Hurricane Harbor, Oaxtepec (ThemeParks.Parks.SixFlagsHurricaneHarborOaxtepec)
* Six Flags Hurricane Harbor, Concord (ThemeParks.Parks.SixFlagsHurricaneHarborConcord)
* PortAventura (ThemeParks.Parks.PortAventura)
* Ferrari Land (ThemeParks.Parks.FerrariLand)
* Alton Towers (ThemeParks.Parks.AltonTowers)
* Thorpe Park (ThemeParks.Parks.ThorpePark)
* Chessington World Of Adventures (ThemeParks.Parks.ChessingtonWorldOfAdventures)
* Bellewaerde (ThemeParks.Parks.Bellewaerde)
* Phantasialand (ThemeParks.Parks.Phantasialand)
* Heide Park (ThemeParks.Parks.HeidePark)
* Busch Gardens Tampa (ThemeParks.Parks.BuschGardensTampa)
* Busch Gardens Williamsburg (ThemeParks.Parks.BuschGardensWilliamsburg)
* Liseberg (ThemeParks.Parks.Liseberg)

<!-- END_SUPPORTED_PARKS_LIST -->

## Supported Park Features

<!-- START_PARK_FEATURES_SUPPORTED -->
|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
|Magic Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Epcot - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Hollywood Studios - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Animal Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10007;|
|Magic Kingdom - Disneyland Resort|&#10003;|&#10003;|&#10007;|
|California Adventure - Disneyland Resort|&#10003;|&#10003;|&#10007;|
|Magic Kingdom - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Walt Disney Studios - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Hong Kong Disneyland|&#10003;|&#10003;|&#10007;|
|Magic Kingdom - Shanghai Disney Resort|&#10003;|&#10003;|&#10007;|
|Magic Kingdom - Tokyo Disney Resort|&#10003;|&#10003;|&#10007;|
|Disney Sea - Tokyo Disney Resort|&#10003;|&#10003;|&#10007;|
|Europa Park|&#10003;|&#10003;|&#10007;|
|Hershey Park|&#10003;|&#10003;|&#10007;|
|Parc-Asterix|&#10003;|&#10003;|&#10003;|
|California's Great America|&#10003;|&#10003;|&#10007;|
|Canada's Wonderland|&#10003;|&#10003;|&#10007;|
|Carowinds|&#10003;|&#10003;|&#10007;|
|Cedar Point|&#10003;|&#10003;|&#10007;|
|Kings Island|&#10003;|&#10003;|&#10007;|
|Knott's Berry Farm|&#10003;|&#10003;|&#10007;|
|Dollywood|&#10003;|&#10003;|&#10007;|
|Silver Dollar City|&#10003;|&#10003;|&#10007;|
|Seaworld Orlando|&#10003;|&#10003;|&#10007;|
|Efteling|&#10003;|&#10003;|&#10007;|
|Universal Studios Florida|&#10003;|&#10003;|&#10007;|
|Universal's Islands Of Adventure|&#10003;|&#10003;|&#10007;|
|Universal Volcano Bay|&#10003;|&#10003;|&#10007;|
|Universal Studios Hollywood|&#10003;|&#10003;|&#10007;|
|Universal Studios Singapore|&#10003;|&#10003;|&#10007;|
|Universal Studios Japan|&#10003;|&#10003;|&#10007;|
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
|Six Flags Hurricane Harbor, Oaxtepec|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Concord|&#10003;|&#10003;|&#10007;|
|PortAventura|&#10003;|&#10003;|&#10007;|
|Ferrari Land|&#10003;|&#10003;|&#10007;|
|Alton Towers|&#10003;|&#10003;|&#10007;|
|Thorpe Park|&#10003;|&#10003;|&#10007;|
|Chessington World Of Adventures|&#10003;|&#10003;|&#10007;|
|Bellewaerde|&#10003;|&#10003;|&#10007;|
|Phantasialand|&#10003;|&#10003;|&#10007;|
|Heide Park|&#10003;|&#10003;|&#10007;|
|Busch Gardens Tampa|&#10003;|&#10003;|&#10007;|
|Busch Gardens Williamsburg|&#10003;|&#10003;|&#10007;|
|Liseberg|&#10003;|&#10003;|&#10007;|

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
            meta: { (object: can contain various park-specific information about this ride - field may be null)
                // examples of potential meta fields
                fastPassStartTime: (string: current fastPass window start time),
                fastPassEndTime: (string: current fastPass window start time),
                singleRider: (boolean: does this ride have a single rider line?),
                longitude: (number: ride's longitude),
                latitude: (number: ride's latitude),
                area: (string: section of the park this ride is located within),
            },
            status: (string: will either be "Operating", "Closed", "Refurbishment", or "Down"),
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

| Variable              | Description                                                                                                 |
| :-------------------- | :---------------------------------------------------------------------------------------------------------- |
| Name                  | Name of the park                                                                                            |
| Timezone              | The park's local timezone                                                                                   |
| LocationString        | This park's location as a geolocation string                                                                |
| SupportsWaitTimes     | Does this park's API support ride wait times?                                                               |
| SupportsOpeningTimes  | Does this park's API support opening hours?                                                                 |
| SupportsRideSchedules | Does this park return schedules for rides?                                                                  |
| FastPass              | Does this park have FastPass (or a FastPass-style service)?                                                 |
| FastPassReturnTimes   | Does this park tell you the FastPass return times?                                                          |
| Now                   | Current date/time at this park (returned as a Moment object)                                                |
| UserAgent             | The HTTP UserAgent this park is using to make API requests (usually randomly generated per-park at runtime) |

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
* Magic Kingdom - Disneyland Resort [(33°48′36.39″N, 117°55′8.30″W)]: (America/Los_Angeles)
* California Adventure - Disneyland Resort [(33°48′31.39″N, 117°55′8.36″W)]: (America/Los_Angeles)
* Magic Kingdom - Disneyland Paris [(48°52′13.16″N, 2°46′46.82″E)]: (Europe/Paris)
* Walt Disney Studios - Disneyland Paris [(48°52′5.78″N, 2°46′50.59″E)]: (Europe/Paris)
* Hong Kong Disneyland [(22°18′47.52″N, 114°2′40.20″E)]: (Asia/Hong_Kong)
* Magic Kingdom - Shanghai Disney Resort [(31°8′35.88″N, 121°39′28.80″E)]: (Asia/Shanghai)
* Magic Kingdom - Tokyo Disney Resort [(35°38′5.45″N, 139°52′45.46″E)]: (Asia/Tokyo)
* Disney Sea - Tokyo Disney Resort [(35°37′37.40″N, 139°53′20.75″E)]: (Asia/Tokyo)
* Europa Park [(48°16′8.15″N, 7°43′17.61″E)]: (Europe/Berlin)
* Hershey Park [(40°17′15.65″N, 76°39′30.88″W)]: (America/New_York)
* Parc-Asterix [(49°8′9.75″N, 2°34′21.96″E)]: (Europe/Paris)
* California's Great America [(37°23′52.08″N, 121°58′28.98″W)]: (America/Los_Angeles)
* Canada's Wonderland [(43°50′34.80″N, 79°32′20.40″W)]: (America/Toronto)
* Carowinds [(35°6′16.20″N, 80°56′21.84″W)]: (America/New_York)
* Cedar Point [(41°28′42.24″N, 82°40′45.48″W)]: (America/New_York)
* Kings Island [(39°20′40.92″N, 84°16′6.96″W)]: (America/New_York)
* Knott's Berry Farm [(33°50′39.12″N, 117°59′54.96″W)]: (America/Los_Angeles)
* Dollywood [(35°47′43.18″N, 83°31′51.19″W)]: (America/New_York)
* Silver Dollar City [(36°40′5.44″N, 93°20′18.84″W)]: (America/Chicago)
* Seaworld Orlando [(28°24′41.40″N, 81°27′48.24″W)]: (America/New_York)
* Efteling [(51°38′59.67″N, 5°2′36.82″E)]: (Europe/Amsterdam)
* Universal Studios Florida [(28°28′29.94″N, 81°27′59.39″W)]: (America/New_York)
* Universal's Islands Of Adventure [(28°28′20.07″N, 81°28′4.28″W)]: (America/New_York)
* Universal Volcano Bay [(28°27′44.28″N, 81°28′14.52″W)]: (America/New_York)
* Universal Studios Hollywood [(34°8′14.14″N, 118°21′19.86″W)]: (America/Los_Angeles)
* Universal Studios Singapore [(1°15′15.30″N, 103°49′25.67″E)]: (Asia/Singapore)
* Universal Studios Japan [(34°39′55.74″N, 135°25′56.50″E)]: (Asia/Tokyo)
* Six Flags Over Texas [(32°45′17.95″N, 97°4′13.33″W)]: (America/Chicago)
* Six Flags Over Georgia [(33°46′14.08″N, 84°33′5.36″W)]: (America/New_York)
* Six Flags St. Louis [(38°30′47.61″N, 90°40′30.69″W)]: (America/Chicago)
* Six Flags Great Adventure [(40°8′55.18″N, 74°26′27.69″W)]: (America/New_York)
* Six Flags Magic Mountain [(34°25′24.46″N, 118°35′42.90″W)]: (America/Los_Angeles)
* Six Flags Great America [(42°22′12.88″N, 87°56′9.30″W)]: (America/Chicago)
* Six Flags Fiesta Texas [(29°35′59.28″N, 98°36′32.50″W)]: (America/Chicago)
* Six Flags Hurricane Harbor, Arlington [(32°45′43.20″N, 97°4′58.44″W)]: (America/Chicago)
* Six Flags Hurricane Harbor, Los Angeles [(34°25′25.86″N, 118°35′42.05″W)]: (America/Los_Angeles)
* Six Flags America [(38°54′4.46″N, 76°46′16.59″W)]: (America/New_York)
* Six Flags Discovery Kingdom [(38°8′19.43″N, 122°13′59.70″W)]: (America/Los_Angeles)
* Six Flags New England [(42°2′16.54″N, 72°36′55.92″W)]: (America/New_York)
* Six Flags Hurricane Harbor, Jackson [(40°8′18.24″N, 74°26′25.80″W)]: (America/New_York)
* The Great Escape [(43°21′1.80″N, 73°41′32.10″W)]: (America/New_York)
* Six Flags White Water, Atlanta [(33°57′32.86″N, 84°31′10.37″W)]: (America/New_York)
* Six Flags México [(19°17′43.40″N, 99°12′41.19″W)]: (America/Mexico_City)
* La Ronde, Montreal [(45°31′19.18″N, 73°32′4.48″W)]: (America/Toronto)
* Six Flags Hurricane Harbor, Oaxtepec [(18°53′48.12″N, 98°58′31.44″W)]: (America/Mexico_City)
* Six Flags Hurricane Harbor, Concord [(37°58′23.89″N, 122°3′1.98″W)]: (America/Los_Angeles)
* PortAventura [(41°5′11.24″N, 1°9′13.14″E)]: (Europe/Madrid)
* Ferrari Land [(41°5′10.08″N, 1°9′11.67″E)]: (Europe/Madrid)
* Alton Towers [(52°59′27.83″N, 1°53′32.25″W)]: (Europe/London)
* Thorpe Park [(51°24′19.80″N, 0°30′37.80″W)]: (Europe/London)
* Chessington World Of Adventures [(51°20′58.56″N, 0°18′52.45″W)]: (Europe/London)
* Bellewaerde [(50°50′49.19″N, 2°56′52.61″E)]: (Europe/Brussels)
* Phantasialand [(50°47′56.23″N, 6°52′45.53″E)]: (Europe/Berlin)
* Heide Park [(53°1′28.72″N, 9°52′17.78″E)]: (Europe/Berlin)
* Busch Gardens Tampa [(28°2′13.60″N, 82°25′10.57″W)]: (America/New_York)
* Busch Gardens Williamsburg [(37°18′10.15″N, 76°59′16.96″W)]: (America/New_York)
* Liseberg [(57°41′46.49″N, 11°59′8.33″E)]: (Europe/Stockholm)

<!-- END_PARK_TIMEZONE_LIST -->

## Development

### Running Tests

themeparks supports mocha unit tests. Install mocha with npm install -g mocha

Run the following to test the library's unit tests (this will build the library and then run functional offline unit tests):

    npm test

You can also run unit tests against the source js files using `npm run testdev`.

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
* [ChronoPass](https://www.chronopass.app) - All parks
* [LogRide - The Theme Park Tracker](https://www.theparksman.com/parkwide/) - All parks

Make a pull request to add your project to the list.
