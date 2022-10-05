# themeparks

An unofficial API library for accessing ride wait times and park opening times for many theme parks around the world, including Disney, Universal and SeaWorld parks.

This library uses [ThemeParks.wiki](https://themeparks.wiki) to source data.

[![Sponsor Me](https://img.shields.io/github/sponsors/cubehouse)](https://github.com/sponsors/cubehouse) [![Discord Server](https://img.shields.io/discord/734308155315453963.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/Vs2zQB7)

[![npm version](https://badge.fury.io/js/themeparks.svg)](https://badge.fury.io/js/themeparks) ![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/cubehouse/themeparks.svg)

![GitHub contributors](https://img.shields.io/github/contributors/ThemeParks/parksapi.svg) ![npm](https://img.shields.io/npm/dt/themeparks.svg) ![node](https://img.shields.io/node/v/themeparks.svg) ![Dependent repos (via libraries.io)](https://img.shields.io/librariesio/dependent-repos/npm/themeparks.svg)

[Documentation](https://cubehouse.github.io/themeparks/) | [Change Log](CHANGELOG.md)

## Install

    npm install themeparks --save

## Example Use

    // include the Themeparks library
    const Themeparks = require("themeparks");

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

## Change Log

[View themeparks Change Log](CHANGELOG.md)

## Parks available

<!-- START_SUPPORTED_PARKS_LIST -->

**54** Parks Supported

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
* Six Flags Over Texas (ThemeParks.Parks.SixFlagsOverTexas)
* Six Flags Over Georgia (ThemeParks.Parks.SixFlagsOverGeorgia)
* Six Flags St. Louis (ThemeParks.Parks.SixFlagsStLouis)
* Six Flags Great Adventure (ThemeParks.Parks.SixFlagsGreatAdventure)
* Six Flags Magic Mountain (ThemeParks.Parks.SixFlagsMagicMountain)
* Six Flags Great America (ThemeParks.Parks.SixFlagsGreatAmerica)
* Six Flags Fiesta Texas (ThemeParks.Parks.SixFlagsFiestaTexas)
* Six Flags America (ThemeParks.Parks.SixFlagsAmerica)
* Six Flags Discovery Kingdom (ThemeParks.Parks.SixFlagsDiscoveryKingdom)
* Six Flags New England (ThemeParks.Parks.SixFlagsNewEngland)
* The Great Escape (ThemeParks.Parks.TheGreatEscape)
* Six Flags México (ThemeParks.Parks.SixFlagsMexico)
* La Ronde, Montreal (ThemeParks.Parks.LaRondeMontreal)
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
* Toverland (ThemeParks.Parks.Toverland)

<!-- END_SUPPORTED_PARKS_LIST -->

## Result Objects

### Ride Wait Times

    [
        {
            id: (string or number: uniquely identifying a ride),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            status: (string: will either be "Operating", "Closed", "Refurbishment", or "Down"),
            lastUpdate: (JavaScript Date object: last time this ride had new data),
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

## People using themeparks

If you're using themeparks for a project, please let me know! I'd love to see what people are doing!

### Websites and Mobile Apps

* [My Disney Visit](http://www.mydisneyvisit.com/) - Walt Disney World
* [ChronoPass](https://www.chronopass.app) - All parks
* [LogRide - The Theme Park Tracker](https://www.theparksman.com/parkwide/) - All parks
* [Themeparks](https://themeparks.arendz.nl/#/home) - Efteling, Phantasialand, Parc Asterix, Bellewaerde and Portaventura World

Make a pull request to add your project to the list.
