var DisneyBase = require("./DisneyBase.js");

// ParisBase object (we need to override some functions for Disneyland Paris)
function DisneylandParisBase(config) {
  var self = this;

  // inherit from base Disney park object
  DisneyBase.call(self, config);

  // override wait times URL for Paris API
  this.ContructWaitTimesURL = function() {
    return self.APIBase + "theme-parks/" + self.park_id + ";destination\u003ddlp/wait-times";
  };
}
DisneylandParisBase.prototype = Object.create(DisneyBase.prototype);
DisneylandParisBase.prototype.constructor = DisneylandParisBase;

// Magic Kingdom
function DisneylandParisMagicKingdom(config) {
  var self = this;

  // park configuration
  self.name = "Magic Kingdom - Disneyland Paris";
  self.park_id = "P1";
  self.park_timezone = "Europe/Paris";
  self.park_region = "fr";

  // Inherit from base Disneyland Paris park
  DisneylandParisBase.call(self, config);
};
DisneylandParisMagicKingdom.prototype = Object.create(DisneylandParisBase.prototype);
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
  DisneylandParisBase.call(self, config);
};
DisneylandParisWaltDisneyStudios.prototype = Object.create(DisneylandParisBase.prototype);
DisneylandParisWaltDisneyStudios.prototype.constructor = DisneylandParisWaltDisneyStudios;

// export parks
module.exports = [
  DisneylandParisMagicKingdom,
  DisneylandParisWaltDisneyStudios,
];