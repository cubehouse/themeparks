var SeaWorldBase = require("./SeaWorldBase");

// export parks
module.exports = [
  BuschGardensWilliamsburg,
  BuschGardensTampa,
];

// Busch Gardens Williamsburg
function BuschGardensWilliamsburg(config) {
  var self = this;

  self.name = "Busch Gardens Williamsburg";
  self.park_id = "BG_PHF";
  self.park_timezone = "America/New_York";

  SeaWorldBase.apply(self, config);
}
BuschGardensWilliamsburg.prototype = Object.create(SeaWorldBase.prototype);
BuschGardensWilliamsburg.prototype.constructor = BuschGardensWilliamsburg;

// Busch Gardens Tampa
function BuschGardensTampa(config) {
  var self = this;

  self.name = "Busch Gardens Tampa";
  self.park_id = "BG_TPA";
  self.park_timezone = "America/New_York";

  SeaWorldBase.apply(self, config);
}
BuschGardensTampa.prototype = Object.create(SeaWorldBase.prototype);
BuschGardensTampa.prototype.constructor = BuschGardensTampa;