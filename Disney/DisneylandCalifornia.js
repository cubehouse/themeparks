var DisneyBase = require("./DisneyBase.js");

// Magic Kingdom
function DisneylandMagicKingdom(config) {
  var self = this;

  // park configuration
  self.name = "Magic Kingdom - Disneyland California";
  self.park_id = "330339";
  self.park_timezone = "America/Los_Angeles";
  self.park_region = "us";

  // Inherit from base Disney park
  DisneyBase.call(self, config);
};
DisneylandMagicKingdom.prototype = Object.create(DisneyBase.prototype);
DisneylandMagicKingdom.prototype.constructor = DisneylandMagicKingdom;

// California Adventure
function DisneylandCaliforniaAdventure(config) {
  var self = this;

  // park configuration
  self.name = "California Adventure - Disneyland California";
  self.park_id = "336894";
  self.park_timezone = "America/Los_Angeles";
  self.park_region = "us";

  // Inherit from base Disney park
  DisneyBase.call(self, config);
};
DisneylandCaliforniaAdventure.prototype = Object.create(DisneyBase.prototype);
DisneylandCaliforniaAdventure.prototype.constructor = DisneylandCaliforniaAdventure;

// export park objects
module.exports = [
  DisneylandMagicKingdom,
  DisneylandCaliforniaAdventure,
];