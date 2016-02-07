var SixFlagsBase = require("./SixFlagsBase.js");


function SixFlagsOverTexas(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Over Texas";
  self.park_id = 1;
  self.park_timezone = "America/Chicago";

  SixFlagsBase.call(self, config);
};

function SixFlagsOverGeorgia(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Over Georgia";
  self.park_id = 2;
  self.park_timezone = "America/New_York";

  SixFlagsBase.call(self, config);
};

function SixFlagsStLouis(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags St. Louis";
  self.park_id = 3;
  self.park_timezone = "America/Chicago";

  SixFlagsBase.call(self, config);
};

function SixFlagsGreatAdventure(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Great Adventure";
  self.park_id = 5;
  self.park_timezone = "America/New_York";

  SixFlagsBase.call(self, config);
};

function SixFlagsMagicMountain(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Magic Mountain";
  self.park_id = 6;
  self.park_timezone = "America/Los_Angeles";

  SixFlagsBase.call(self, config);
};

function SixFlagsGreatAmerica(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Great America";
  self.park_id = 7;
  self.park_timezone = "America/Chicago";

  SixFlagsBase.call(self, config);
};

function SixFlagsFiestaTexas(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Fiesta Texas";
  self.park_id = 8;
  self.park_timezone = "America/Chicago";

  SixFlagsBase.call(self, config);
};

function SixFlagsHurricaneHarborArlington(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Hurricane Harbor, Arlington";
  self.park_id = 10;
  self.park_timezone = "America/Chicago";

  SixFlagsBase.call(self, config);
};

function SixFlagsHurricaneHarborLosAngeles(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Hurricane Harbor, Los Angeles";
  self.park_id = 11;
  self.park_timezone = "America/Los_Angeles";

  SixFlagsBase.call(self, config);
};

function SixFlagsAmerica(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags America";
  self.park_id = 14;
  self.park_timezone = "America/New_York";

  SixFlagsBase.call(self, config);
};

function SixFlagsDiscoveryKingdom(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Discovery Kingdom";
  self.park_id = 17;
  self.park_timezone = "America/Los_Angeles";

  SixFlagsBase.call(self, config);
};

function SixFlagsNewEngland(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags New England";
  self.park_id = 20;
  self.park_timezone = "America/New_York";

  SixFlagsBase.call(self, config);
};

function SixFlagsHurricaneHarborJackson(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Hurricane Harbor, Jackson";
  self.park_id = 23;
  self.park_timezone = "America/New_York";

  SixFlagsBase.call(self, config);
};

function SixFlagsTheGreatEscape(config) {
  var self = this;

  // park configuration
  self.name = "The Great Escape";
  self.park_id = 24;
  self.park_timezone = "America/New_York";

  SixFlagsBase.call(self, config);
};

function SixFlagsWhiteWaterAtlanta(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags White Water, Atlanta";
  self.park_id = 25;
  self.park_timezone = "America/New_York";

  SixFlagsBase.call(self, config);
};

function SixFlagsMexico(config) {
  var self = this;

  // park configuration
  self.name = "Six Flags Mexico";
  self.park_id = 28;
  self.park_timezone = "America/Toronto";

  SixFlagsBase.call(self, config);
};

function SixFlagsLaRondeMontreal(config) {
  var self = this;

  // park configuration
  self.name = "La Ronde, Montreal";
  self.park_id = 29;
  self.park_timezone = "America/Toronto";

  SixFlagsBase.call(self, config);
};

module.exports = [
  SixFlagsOverTexas,
  SixFlagsOverGeorgia,
  SixFlagsStLouis,
  SixFlagsGreatAdventure,
  SixFlagsMagicMountain,
  SixFlagsGreatAmerica,
  SixFlagsFiestaTexas,
  SixFlagsHurricaneHarborArlington,
  SixFlagsHurricaneHarborLosAngeles,
  SixFlagsAmerica,
  SixFlagsDiscoveryKingdom,
  SixFlagsNewEngland,
  SixFlagsHurricaneHarborJackson,
  SixFlagsTheGreatEscape,
  SixFlagsWhiteWaterAtlanta,
  SixFlagsMexico,
  SixFlagsLaRondeMontreal
];