// this is actually based on our Disneyland Paris codebase
var DisneyBase = require("./DisneyBase.js");

function DisneylandHongKong(config) {
  var self = this;

  // park configuration
  self.name = "Disneyland Hong Kong";
  self.park_id = "desHongKongDisneyland";
  self.park_timezone = "Asia/Hong_Kong";
  self.park_region = "INTL";
  self.resort_id = "hkdl";

  // inherit from base Disney Paris park object (they're vaguely similar)
  DisneyBase.call(self, config);
}
DisneylandHongKong.prototype = Object.create(DisneyBase.prototype);
DisneylandHongKong.prototype.constructor = DisneylandHongKong;

// export parks
module.exports = [
  DisneylandHongKong,
];