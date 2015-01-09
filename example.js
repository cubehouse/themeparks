var DisneyAPI = require("./index");
var api = new DisneyAPI();

api.MagicKingdom.GetWaitTimes(function(err, data) {
    if (err)
    {
        console.log("Error fetching times: " + err);
        return;
    }
    
    console.log(JSON.stringify(data, null, 2));
});

api.GetURL("https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/theme-parks/80007944", function(e, d) {
   console.log(JSON.stringify(d, null, 2));
});

api.GetURL("https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/destinations/80007798", function(e, d) {
   console.log(JSON.stringify(d, null, 2));
});

api.GetPage(80010208, "Attraction", function(error, data) {
    console.log(JSON.stringify(data, null, 2));
});

api.MagicKingdom.GetSchedule(function(err, data) {
    console.log(JSON.stringify(data, null, 2));
});