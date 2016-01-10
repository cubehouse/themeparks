var DisneyBase = require("./DisneyBase.js");

// Magic Kingdom
function DisneylandMagicKingdom(config) {
  var self = this;

  // park configuration
  self.name = "Magic Kingdom - Disneyland California";
  self.park_id = "330339";
  self.park_timezone = "America/Los_Angeles";
  self.park_region = "us";
  self.resort_id = "80008297";

  // Inherit from base Disney park
  DisneyBase.call(self, config);

  // Create the URL for requesting wait times
  // override this for california parks that don't support the ;destination options
  this.ContructWaitTimesURL = function() {
    return self.APIBase + "theme-parks/" + self.park_id + "/wait-times";
  };
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
  self.resort_id = "80008297";

  // Inherit from base Disney park
  DisneyBase.call(self, config);

  // Create the URL for requesting wait times
  // override this for california parks that don't support the ;destination options
  this.ContructWaitTimesURL = function() {
    return self.APIBase + "theme-parks/" + self.park_id + "/wait-times";
  };
};
DisneylandCaliforniaAdventure.prototype = Object.create(DisneyBase.prototype);
DisneylandCaliforniaAdventure.prototype.constructor = DisneylandCaliforniaAdventure;

// export park objects
module.exports = [
  DisneylandMagicKingdom,
  DisneylandCaliforniaAdventure,
];