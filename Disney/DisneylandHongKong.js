var DisneyBase = require("./DisneyBase.js");

function DisneylandHongKong(config) {
  var self = this;

  // park configuration
  self.name = "Disneyland Hong Kong";
  self.park_id = "desHongKongDisneyland";
  self.park_timezone = "Asia/Hong_Kong";
  self.park_region = "INTL";

  // inherit from base Disney park object
  DisneyBase.call(self, config);

  // override wait times URL for Paris API
  this.ContructWaitTimesURL = function() {
    return "https://api.wdpro.disney.go.com/facility-service/theme-parks/" + self.park_id + ";destination\u003dhkdl/wait-times";
  };
}
DisneylandHongKong.prototype = Object.create(DisneyBase.prototype);
DisneylandHongKong.prototype.constructor = DisneylandHongKong;

// export parks
module.exports = [
  DisneylandHongKong,
];