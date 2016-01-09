// this is actually based on our Disneyland Paris codebase
var DisneylandParisBase = require("./DisneyParisBase.js");

function DisneylandHongKong(config) {
  var self = this;

  // park configuration
  self.name = "Disneyland Hong Kong";
  self.park_id = "desHongKongDisneyland";
  self.park_timezone = "Asia/Hong_Kong";
  self.park_region = "INTL";
  self.resort_id = "hkdl";

  // inherit from base Disney Paris park object (they're vaguely similar)
  DisneylandParisBase.call(self, config);
}
DisneylandHongKong.prototype = Object.create(DisneylandParisBase.prototype);
DisneylandHongKong.prototype.constructor = DisneylandHongKong;

// export parks
module.exports = [
  DisneylandHongKong,
];