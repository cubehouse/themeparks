var DisneyBase = require("./DisneyBase.js");

module.exports = [ShanghaiDisneyResort];

function ShanghaiDisneyResort(config) {
  var self = this;

  // park configuration
  self.name = "Shanghai Disney Resort";
  self.park_id = "desShanghaiDisneyland";
  self.park_timezone = "Asia/Shanghai";
  self.park_region = "cn";
  self.resort_id = "shdr";

  // Inherit from base Disney park
  DisneyBase.call(self, config);
};
ShanghaiDisneyResort.prototype = Object.create(DisneyBase.prototype);
ShanghaiDisneyResort.prototype.constructor = ShanghaiDisneyResort;