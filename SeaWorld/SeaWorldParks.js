var SeaWorldBase = require("./SeaWorldBase");

// export parks
module.exports = [
  SeaWorldFlorida,
  SeaWorldSanAntonio,
  SeaWorldSanDiego,
];

// SeaWorld Florida
function SeaWorldFlorida(config) {
  var self = this;

  self.name = "SeaWorld Florida";
  self.park_id = "SW_MCO";
  self.park_timezone = "America/New_York";

  SeaWorldBase.apply(self, config);
}
SeaWorldFlorida.prototype = Object.create(SeaWorldBase.prototype);
SeaWorldFlorida.prototype.constructor = SeaWorldFlorida;

// SeaWorld San Antonio
function SeaWorldSanAntonio(config) {
  var self = this;

  self.name = "SeaWorld San Antonio";
  self.park_id = "SW_SAT";
  self.park_timezone = "America/Chicago";

  SeaWorldBase.apply(self, config);
}
SeaWorldSanAntonio.prototype = Object.create(SeaWorldBase.prototype);
SeaWorldSanAntonio.prototype.constructor = SeaWorldSanAntonio;

// SeaWorld San Diego
function SeaWorldSanDiego(config) {
  var self = this;

  self.name = "SeaWorld San Diego";
  self.park_id = "SW_SAN";
  self.park_timezone = "America/Los_Angeles";

  SeaWorldBase.apply(self, config);
}
SeaWorldSanDiego.prototype = Object.create(SeaWorldBase.prototype);
SeaWorldSanDiego.prototype.constructor = SeaWorldSanDiego;