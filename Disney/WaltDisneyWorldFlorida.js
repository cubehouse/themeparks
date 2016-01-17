var DisneyBase = require("./DisneyBase.js");

// Magic Kingdom
function WaltDisneyWorldMagicKingdom(config) {
  var self = this;

  // park configuration
  self.name = "Magic Kingdom - Walt Disney World Florida";
  self.park_id = "80007944";
  self.park_timezone = "America/New_York";
  self.park_region = "us";
  self.resort_id = "80007798";

  // Inherit from base Disney park
  DisneyBase.call(self, config);
};
WaltDisneyWorldMagicKingdom.prototype = Object.create(DisneyBase.prototype);
WaltDisneyWorldMagicKingdom.prototype.constructor = WaltDisneyWorldMagicKingdom;

// Epcot
function WaltDisneyWorldEpcot(config) {
  var self = this;

  // park configuration
  self.name = "Epcot - Walt Disney World Florida";
  self.park_id = "80007838";
  self.park_timezone = "America/New_York";
  self.park_region = "us";
  self.resort_id = "80007798";

  // Inherit from base Disney park
  DisneyBase.call(self, config);
};
WaltDisneyWorldEpcot.prototype = Object.create(DisneyBase.prototype);
WaltDisneyWorldEpcot.prototype.constructor = WaltDisneyWorldEpcot;

// Hollywood Studios
function WaltDisneyWorldHollywoodStudios(config) {
  var self = this;

  // park configuration
  self.name = "Hollywood Studios - Walt Disney World Florida";
  self.park_id = "80007998";
  self.park_timezone = "America/New_York";
  self.park_region = "us";
  self.resort_id = "80007798";

  // Inherit from base Disney park
  DisneyBase.call(self, config);
};
WaltDisneyWorldHollywoodStudios.prototype = Object.create(DisneyBase.prototype);
WaltDisneyWorldHollywoodStudios.prototype.constructor = WaltDisneyWorldHollywoodStudios;

// Animal Kingdom
function WaltDisneyWorldAnimalKingdom(config) {
  var self = this;

  // park configuration
  self.name = "Animal Kingdom - Walt Disney World Florida";
  self.park_id = "80007823";
  self.park_timezone = "America/New_York";
  self.park_region = "us";
  self.resort_id = "80007798";

  // Inherit from base Disney park
  DisneyBase.call(self, config);
};
WaltDisneyWorldAnimalKingdom.prototype = Object.create(DisneyBase.prototype);
WaltDisneyWorldAnimalKingdom.prototype.constructor = WaltDisneyWorldAnimalKingdom;

// export the parks
module.exports = [
  WaltDisneyWorldMagicKingdom,
  WaltDisneyWorldEpcot,
  WaltDisneyWorldHollywoodStudios,
  WaltDisneyWorldAnimalKingdom,
];

if (!module.parent) {
  var d = new WaltDisneyWorldAnimalKingdom();
  d.GetWaitTimes(console.log);
}