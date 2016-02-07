// require all the different park files
var parks = [
  // Disney
  require("./Disney/WaltDisneyWorldFlorida"),
  require("./Disney/DisneylandCalifornia"),
  require("./Disney/DisneylandParis"),
  require("./Disney/DisneylandHongKong"),
  require("./Disney/DisneyTokyo"),
  // SeaWorld
  require("./SeaWorld/SeaWorldParks"),
  require("./SeaWorld/BuschGardens"),
  require("./SeaWorld/SesamePlace"),
  // Universal
  require("./Universal/UniversalStudiosFlorida"),
  // Six Flags
  require("./SixFlags/SixFlagsParks"),
];

// export all parks
for (var i = 0, park; park = parks[i++];) {
  for (var j = 0; j < park.length; j++) {
    module.exports[park[j].name] = park[j];
  }
}