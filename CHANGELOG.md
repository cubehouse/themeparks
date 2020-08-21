# Change Log

Key changes to themeparks NPM module.

## 5.0.0

* 5.1.41 Fix for Universal data being cached for incorrect time period (thanks @evanlanglais #316)
* 5.1.40 Fix WDW database connection issues (see #314)
* 5.1.39 Fix Phantasialand (4ee8b4d), Tokyo Disneyland (see #302 thanks @nearprosmith), improved Bellewaerde data (see #301 thanks @LouisForaux)
* 5.1.38 Add virtual lines to Universal Parks (see #292 thanks @DougSisk)
* 5.1.37 Updated Efteling API (see #290)
* 5.1.36 Fix for new Shanghai Disney Resort API changes (thanks @zacharyedwardbull @nearprosmith #287)
* 5.1.35 Fix for WDW live access (thanks @cmlara #283)
* 5.1.34 Fix for Tokyo Disney Resort (thanks @nearprosmith #279)
* 5.1.33 Fix for Dollywood Calendar API (#273)
* 5.1.32 Fux Phantasialand Calendar (again) and add Liseberg Park (@hemi1986 #266 and #270)
* 5.1.31 Fix Phantasialand and Alton Towers Calendars (@hemi1986 #265 and #262)
* 5.1.30 Add Fastpass support to Disneyland Paris (see #254)
* 5.1.29 Add Fastpass metadata to Tokyo Disney parks (@nearprosmith #258)
* 5.1.28 Additional hotfix for previous release when Disney Paris parks returns no data outside of operating hours
* 5.1.27 Minor hotfix for Disney Paris parks when closed sometimes returning no data and some environments not parsing JSON correctly (#250 #252)
* 5.1.26 Allow ride name language override for Disney Paris parks (@LouisForaux #249)
* 5.1.25 Fix Portaventura opening hours (thanks @jeanmatthieud #248)
* 5.1.24 Ignore invalid Disney Paris rides and return facility code for Tokyo Disneyland rides (thanks @rorpage #245)
* 5.1.23 Add Busch Gardens Tampa & Willamsburg (thanks @thomasstoeckert PR #243)
* 5.1.22 Disneyland Paris reports ride opening times consistently with Park Asterix style (thanks @LouisForaux)
* 5.1.21 Hotfix for Disneyland Paris' new API (see #239)
* 5.1.20 Hotfix for Tokyo Disney Resort wait times
* 5.1.19 Hotfix for Disney Paris parks rejecting language headers
* 5.1.18 Add Heide Park (thanks @hemi1986), clean up Six Flags park statuses, Shanghai Disney Resort now returns English names (see #190)
* 5.1.17 Fix Cedar Park (#235), Universal Studios Japan (#234), Alton Towers, Chessington, and Thorpe Park (#233)
* 5.1.16 Fix Tokyo Disneyland Ride Statuses (thanks @dotaguro #232)
* 5.1.15 Fix PortAventura opening hours
* 5.1.14 Tidy up Tokyo DisneySea ride names
* 5.1.13 Clear out fastpass availability metadata when unavailable (thanks @webdeck #121)
* 5.1.12 Improve Seaworld ride names (thanks @jeanmatthieud #207)
* 5.1.11 Improve Universal and Portaventura wait time status reporting
* 5.1.10 Improve Universal wait time statuses to reflect actual status correctly
* 5.1.9 Add Phantasialand to supported parks
* 5.1.8
  * ! Fix lastUpdate not updating when meta data changes
  * ~ Tidy up some park names for consistency (thanks @jeanmatthieud #187)
  * ~ Tidy up SixFlags ride times (thanks @jeanmatthieud #188)
  * ~ Tidy up Universal ride times so they can't return an invalid status
* 5.1.7 Improve PortAventura opening hours loading
* 5.1.6 Minor fix for #183, fallback on offline data if we fail to fetch the English HTML correctly
* 5.1.5
  * ! Fix "legacy" Disney Park opening hour timezones
  * \+ Added Universal Studios Japan to supported parks
* 5.1.4 Add thrill data and other metadata to Europa Park (see 386126c86b3c2fecfadf31b34c309b50e6d36f45)
* 5.1.3 ! Fix Tokyo Disney parks failing to query API after caching latest API version (#179)
* 5.1.2 ! Fix HTTP error returning after failing (thanks @jeanmatthieud #177)
* 5.1.1 Add meta data to some Disney ride results (fastpass return times, single ride, photopass etc.)
* 5.1.0 First non-beta release of 5.x
* 5.0.0 ! (breaking change) you must now allow for a small SQLite database to cache data to use the library
  * Library rewritten in more modern JS for easier development and maintenance

## v4.0.0

* 4.7.20 ! Disney park (Shanghai/Tokyo) fixes from @jeanmatthieud (#170)
* 4.7.19 ! Various fixes from @jeanmatthieud (#167 #162 #161 #160)
* 4.7.18 ! Various fixes from @jeanmatthieud (#154 #155 #156 #157)
* 4.7.17 ! Merge Parc Asterix fixes from 5.0 (thanks @BenediktCleff #150)
* 4.7.16 ! Fix Europa API (thanks @BenediktCleff #149)
* 4.7.15 ! Fix Europa API (thanks @LouisForaux #148)
* 4.7.14 ! Fix Tokyo Disneyland Device ID generation (thanks @SomethingWithComputers #146)
* 4.7.13 ! Fix Disneyland Paris URLs (thanks @midiland #145)
* 4.7.12 ! Fix Tokyo and Shanghai Disney Resorts with latest API changes (thanks @dozer47528 #141 and @nicectrl #142)
* 4.7.11 ! Remove TE2 auth token at request of park technology representative
* 4.7.10 ! Minor fix for Tokyo Disney Resort API version bump (see #138)
* 4.7.9 ! Minor fix for Tokyo Disney Resort API version bump
* 4.7.8 ! Fix for Efteling POI data (thanks @renssies #130)
* 4.7.7 Add support for rides under refurbishment for Efteling (thanks @janvankampen #126)
* 4.7.6 Add support for Down rides at Efteling (thanks @janvankampen #124)
* 4.7.5 ! Fix for Tokyo Disney Resort API version bump (thanks @dotaguro #123)
* 4.7.4 ! Fix for Tokyo Disney Resort API version bump (see #121)
* 4.7.3 Minor hotfix for missing attraction name for Astrix Parc (thanks @skyforce77 #120)
* 4.7.2 ! Fix Efteling API update (see #119)
* 4.7.1 Minor update for Tokyo Disney Resort parks. Now using their new app API (see #115)
* 4.7.0 ! Removed SeaWorld Parks from the API, as they no longer offer wait times outside of the park !
* 4.6.17 Hotfix for Parc Asterix not returning valid wait times for rides (see #113)
* 4.6.16 Hotfix for Tokyo Disney Resort parks (see #110)
* 4.6.15 Add California's Great America to supported parks (thanks @jkap #112)
* 4.6.14 Add Dollywood and Silver Dollar City to supported parks (thanks @rambleraptor #107)
* 4.6.13 Minor update to update Chessington ride data (thanks @OkoWsc #103)
* 4.6.12 Minor update added Wicker Man to Alton Towers park (thanks @OkoWsc #102)
* 4.6.11 Hotfix for SixFlags parks - use correct timezone for operating hours (see #101)
* 4.6.10 Updated Disneyland Tokyo Resort API to use their new JSON API method
* 4.6.9 Minor update adding HTTPS proxy support (as well as SOCKS support)
* 4.6.8 Optional Minor Hotfix to re-attempt JSON decodes if HTTP request fails
* 4.6.7 Hotfix for Tokyo Disneyland geo-location check URL changing (see #100)
* 4.6.6 Hotfix for bad npm upload, rolling back to earlier version of themeparks unexpectedly (see #97)
* 4.6.5 Hotfix for Walt Disney World parks failing to access facilities data (see #96)
* 4.6.4 Hotfix for Tokyo Disneyland servers rejecting all HTTP requests from the library
* 4.6.3 Minor API change to allow fetching of non theme-park entity opening hours in WDW (see #84)
* 4.6.2 Hotfix for missing coasters in Knott's Berry Farm following attraction category change
* 4.6.1 Hotfix for Disney rides returning no status
* 4.6.0 Added Universal Studios Singapore to the library
* 4.5.1 Hotfix to resolve issue parsing Cedar Fair schedule times
* 4.5.0 Added Efteling to supported parks
* 4.4.0 Disneyland Resort now returns fastpass return times (#75 thanks @DougSisk)
* 4.3.4 Resolves FastPass issues at DLP (#54 thanks @christopherkade)
* 4.3.3 Fix for Disney token expiring times introduced in 4.3.2 (#74 thanks @mledford)
* 4.3.2 Fix for Disney rides not returning as "down", and improve Disney token expirey (#71 and #72 thanks @mledford)
* 4.3.1 Fix for ride data not returned correctly for Asterix Parc, Europa Park, and Sesame Place (#68 and #69 thanks @lightswitchr)
* 4.3.0 Removed Osmosis as a dependancy, returning to Cheerio. Makes installation easier for some users and slims our dependancies down
* 4.2.1 Allow overriding of how many days are returned for GetOpeningTimes() (thanks @georgereason)
* 4.2.0 Added Proxy support for HTTP requests (#65 thanks @mledford)
* 4.1.7 Minor fix for Knott's Berry Farm opening hours not being downloaded correctly
* 4.1.6 Fixed Chessington and Alton Towers, also added Thorpe Park to the library
* 4.1.5 Added Universal Studios Volcano Bay to library
* 4.1.4 Minor release to extend Universal opening hours stored (#55 thanks @georgereason)
* 4.1.3 Minor release to improve Disney fastPass detection (#54 thanks @christopherkade)
* 4.1.2 Disney parks no longer return Entertainment by default for wait times (revert to old behaviour by passing ride_types: ["Attraction", "Entertainment"] when creating the park object)
* 4.1.1 Fixed issue where wait-time-less rides (like Tiki room) were appearing as Closed (thanks @DougSisk with #52)
* 4.1.0
  * Added 5 Cedar Fair parks to the library
    * Cedar Point
    * Knott's Berry Farm
    * Carowinds
    * Canada's Wonderland
    * Kings Island
  * Fixed SixFlagsMexico park ID (was SixFlagsMxico)
  * Fixed SeaWorld Orlando Latitude & Longitude
  * Fixed EuropaPark Timezone
* 4.0.7 Add Chessington World Of Adventures to the library
* 4.0.6 Added missing park Hong Kong Disneyland (thanks @elstringer with #47)
* 4.0.5 Minor bugfix with http module to not attempt to access non-existing statusCode on network error
* 4.0.4 Improve backwards compatibility with older versions of NodeJS (thanks @andrewmunsell with #45)
* 4.0.3 Attempt fix for #42 for Disney parks not injected ride schedule data when opening times requested before ride data
* 4.0.2 Added Hershey Park and fixed parks returning all dates as "Closed" in 4.0.1
* 4.0.1 Added Universal Studios Hollywood

### Core Changes

* Project refactor - now written in ES6
* Renamed to themeparks
  * Compiled down to "vanilla normal" JavaScript for compatibility with older NodeJS versions (will be removed when official NodeJS support for older NodeJS versions is dropped)
* New caching built into the framework to reduce network requests
  * Supports multiple caching systems, including memory, file or various caching servers
* Common park logic grouped into single object to keep park-specific implementations as clean as possible
* Use of Promises throughout Project
  * Old callback-style will still work when using the module if desired, but Promises are used throughout internals
* Split unit tests into functional and network testing
* API documented significantly with JSDoc, see [themeparks Documentation](https://cubehouse.github.io/themeparks/)
* Now using needle HTTP request module, for it's significantly less dependancies compared to request
  * HTTP wrapper available that attempts network requests on failure to aid network issues we've seen before

## v3.0.0

* Refactored codebase significantly
* Added SeaWorld parks (including Busch Gardens and Sesame Place)
* Added Universal Studios and Island Of Adventure parks to API
* Setting environment variable "DEBUG=true" will supply better debugging information that we've had in previous versions
* Disney World Florida, Disneyland California, Disneyland Paris, Disneyland Shanghai and Disneyland Hong Kong now share a common codebase.
* (breaking change) GetSchedule is now GetOpeningTimes
* (breaking change) Schedules now return a maximum of one element per day, with "special" opening hours as a sub-object called "special" (eg. Extra Magic Hours)
* (breaking change) Park object names have been renamed
* (breaking change) No longer need to create a new wdwjs() object to start the API, make separate new objects for each park you wish to access
* 3.0.3 added BETA Six Flags support. Some parks do not yet return proper wait time data, see [#12](https://github.com/cubehouse/themeparks/issues/12)
* 3.0.6 added ride schedules (only for Disney parks) and new status string for each ride wait time entry
* 3.0.7 fixed Tokyo Disneyland ride active status and added updateTime to Tokyo ride outputs (see #17)
* 3.0.10 added Alton Towers to the supported parks
* 3.0.11 added Chessington to the supported parks
* 3.0.12 added Shanghai Disney Resort to the supported parks
* 3.0.14 added Europa-Park to the supported parks
* 3.1.0 fixed Disney API calls with a new client ID

## v2.0.0

* (breaking change) You must now specify "WDWRequests: true" in your setup options if you wish direct access to WDW API function helpers
* Disneyland Paris is now part of the same API service as Disney World Resort and Disneyland California.
* Added Tokyo Disneyland to supported parks
* Added (non-Disney) Universal Orlando parks to supported parks (added: 2.0.4)

## v1.0.0

* (breaking change) Response formats simplified so all parks return same data structure
* Added Disneyland Paris
