var UniversalBase = require("./UniversalBase");

// export parks
module.exports = [
  UniversalStudiosFlorida,
  UniversalIslandOfAdventure,
];

// Universal Studios Orlando
function UniversalStudiosFlorida(config) {
  var self = this;

  self.name = "Universal Studios Orlando";
  self.park_id = "10010";
  self.park_timezone = "America/New_York";

  self.calendar_URL = "https://www.universalorlando.com/Resort-Information/USF-Park-Hours-Mobile.aspx";
  self.calendar_VStarget = "UniversalStudiosFloridaCalendar$ECalendar";

  UniversalBase.call(self, config);
}
UniversalStudiosFlorida.prototype = Object.create(UniversalBase.prototype);
UniversalStudiosFlorida.prototype.constructor = UniversalStudiosFlorida;

// Universal Island Of Adventure
function UniversalIslandOfAdventure(config) {
  var self = this;

  self.name = "Universal Island Of Adventure";
  self.park_id = "10000";
  self.park_timezone = "America/New_York";

  self.calendar_URL = "https://www.universalorlando.com/Resort-Information/IOA-Park-Hours-Mobile.aspx";
  self.calendar_VStarget = "IslandOfAdventureCalendar$ECalendar";

  UniversalBase.call(self, config);
}
UniversalIslandOfAdventure.prototype = Object.create(UniversalBase.prototype);
UniversalIslandOfAdventure.prototype.constructor = UniversalIslandOfAdventure;

if (!module.parent) {
  var d = new UniversalIslandOfAdventure({
    debug: true,
  });
  d.GetOpeningTimes(console.log);
}