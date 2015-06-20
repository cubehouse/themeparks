// Setup API
var DisneyAPI = new (require("wdwjs"))();

var MagicKingdom = DisneyAPI.MagicKingdom;
var Paris = DisneyAPI.DisneylandParis;

// Get Magic Kingdom wait times
MagicKingdom.GetWaitTimes(function(err, data) {
    if (err) return console.error("Error fetching Magic Kingdom wait times: " + err);

    console.log(JSON.stringify(data, null, 2));
});

DisneylandParis.GetSchedule(function(err, data) {
    console.log(JSON.stringify(data, null, 2));
});

DisneyAPI.GetURL("https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/theme-parks/80007944", function(e, d) {
   console.log(JSON.stringify(d, null, 2));
});

DisneyAPI.GetURL("https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/destinations/80007798", function(e, d) {
   console.log(JSON.stringify(d, null, 2));
});

DisneyAPI.GetPage(80010208, "Attraction", function(error, data) {
    console.log(JSON.stringify(data, null, 2));
});