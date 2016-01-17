var SeaWorldBase = require("./SeaWorldBase");

// export parks
module.exports = [
  SesamePlace,
];

// Sesame Place
function SesamePlace(config) {
  var self = this;

  self.name = "Sesame Place";
  self.park_id = "SP_PHL";
  self.park_timezone = "America/New_York";

  SeaWorldBase.call(self, config);
}
SesamePlace.prototype = Object.create(SeaWorldBase.prototype);
SesamePlace.prototype.constructor = SesamePlace;