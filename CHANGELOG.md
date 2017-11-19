# Change Log
Key changes to themeparks NPM module.

## v4.0.0

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
