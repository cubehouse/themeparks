var DisneyRequest = require("./disneyRequest");
var DisneyParks = require("./disneyParks");
var DisneyTokyo = require("./disneyTokyo");
var UniversalOrlando = require("./universalOrlando");

/** This is a wrapper object to tie the API components together */

function DisneyAPI(options) {
  // == make our own DisneyRequest object to make API calls ==
  var DRequest = new DisneyRequest(options);

  // == make park objects ==
  // DisneyWorld Resorts
  this.Epcot = new DisneyParks({
    wdw_park_id: "80007838"
  }, DRequest);
  this.MagicKingdom = new DisneyParks({
    wdw_park_id: "80007944"
  }, DRequest);
  this.HollywoodStudios = new DisneyParks({
    wdw_park_id: "80007998"
  }, DRequest);
  this.AnimalKingdom = new DisneyParks({
    wdw_park_id: "80007823"
  }, DRequest);

  // Disneyland California
  this.Disneyland = new DisneyParks({
    wdw_park_id: "330339",
    timezone: "America/Los_Angeles"
  }, DRequest);
  this.CaliforniaAdventure = new DisneyParks({
    wdw_park_id: "336894",
    timezone: "America/Los_Angeles"
  }, DRequest);

  // Disneyland Paris
  this.DisneylandParis = new DisneyParks({
    wdw_park_id: "P1",
    timezone: "Europe/Paris",
    dlpMode: true,
  }, DRequest);

  this.WaltDisneyStudios = new DisneyParks({
    wdw_park_id: "P2",
    timezone: "Europe/Paris",
    dlpMode: true,
  }, DRequest);

  // push options through to objects
  this.Epcot.TakeOptions(options);
  this.MagicKingdom.TakeOptions(options);
  this.HollywoodStudios.TakeOptions(options);
  this.AnimalKingdom.TakeOptions(options);
  this.Disneyland.TakeOptions(options);
  this.DisneylandParis.TakeOptions(options);
  this.WaltDisneyStudios.TakeOptions(options);

  // Tokyo Disney
  var DisneyTokyoAPI = new DisneyTokyo(options);
  // build a mini proxy for Tokyo
  function TokyoProxy(park_id) {
    this.GetWaitTimes = function() {
      DisneyTokyoAPI.GetWaitTimes(park_id, arguments[arguments.length - 1]);
    };

    this.GetSchedule = function() {
      DisneyTokyoAPI.GetSchedule(park_id, arguments[arguments.length - 1]);
    };
  }

  // Tokyo Disneyland
  this.TokyoDisneyland = new TokyoProxy("tdl");
  // Tokyo DisneySea
  this.TokyoDisneySea = new TokyoProxy("tds");

  // Universal Studios Orlando
  this.UniversalStudiosOrlando = new UniversalOrlando({
    park_id: 10010,
    calendar_URL: "https://www.universalorlando.com/Resort-Information/USF-Park-Hours-Mobile.aspx",
    calendar_VStarget: "UniversalStudiosFloridaCalendar$ECalendar",
  });
  // Universal Island Of Adventure Orlando
  this.UniversalIslandOfAdventure = new UniversalOrlando({
    park_id: 10000,
    calendar_URL: "https://www.universalorlando.com/Resort-Information/IOA-Park-Hours-Mobile.aspx",
    calendar_VStarget: "IslandOfAdventureCalendar$ECalendar",
  });

  // == export DRequest exports too (if asked for) ==
  if (options && options.WDWRequests) {
    for (var func in DRequest) {
      this[func] = DRequest[func];
    }
  }
}

// export this object
module.exports = DisneyAPI;