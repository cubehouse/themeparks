var DisneyTokyoBase = require("./DisneyTokyoBase");

function DisneylandTokyo(config) {
  var self = this;

  self.name = self.name || "Disneyland Tokyo";

  self.park_id = "tdl";
  self.park_kind = 1;

  // GPS range for Disneyland Tokyo
  self.gpsRange = [
    [35.63492433179704, 139.87755417823792],
    [35.63234322451754, 139.8831331729889],
  ];

  // Call to parent class "Park" to inherit
  DisneyTokyoBase.call(self, config);

}
DisneylandTokyo.prototype = Object.create(DisneyTokyoBase.prototype);
DisneylandTokyo.prototype.constructor = DisneylandTokyo;

function DisneySeaTokyo(config) {
  var self = this;

  self.name = self.name || "DisneySea Tokyo";

  self.park_id = "tds";
  self.park_kind = 2;

  // GPS range for Disneyland TokyoSea
  self.gpsRange = [
    [35.6277563214705, 139.8811161518097],
    [35.62465172824325, 139.88948464393616],
  ];

  // Call to parent class "Park" to inherit
  DisneyTokyoBase.call(self, config);

}
DisneySeaTokyo.prototype = Object.create(DisneyTokyoBase.prototype);
DisneySeaTokyo.prototype.constructor = DisneySeaTokyo;

// export parks
module.exports = [
  DisneylandTokyo,
  DisneySeaTokyo,
];