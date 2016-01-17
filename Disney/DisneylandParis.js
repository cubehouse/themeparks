var DisneyBase = require("./DisneyBase");

// Magic Kingdom
function DisneylandParisMagicKingdom(config) {
  var self = this;

  // park configuration
  self.name = "Magic Kingdom - Disneyland Paris";
  self.park_id = "P1";
  self.park_timezone = "Europe/Paris";
  self.park_region = "fr";

  // Inherit from base Disneyland Paris park
  DisneyBase.call(self, config);
};
DisneylandParisMagicKingdom.prototype = Object.create(DisneyBase.prototype);
DisneylandParisMagicKingdom.prototype.constructor = DisneylandParisMagicKingdom;

// Walt Disney Studios
function DisneylandParisWaltDisneyStudios(config) {
  var self = this;

  // park configuration
  self.name = "Walt Disney Studios - Disneyland Paris";
  self.park_id = "P2";
  self.park_timezone = "Europe/Paris";
  self.park_region = "fr";

  // Inherit from base Disneyland Paris park
  DisneyBase.call(self, config);
};
DisneylandParisWaltDisneyStudios.prototype = Object.create(DisneyBase.prototype);
DisneylandParisWaltDisneyStudios.prototype.constructor = DisneylandParisWaltDisneyStudios;

// export parks
module.exports = [
  DisneylandParisMagicKingdom,
  DisneylandParisWaltDisneyStudios,
];