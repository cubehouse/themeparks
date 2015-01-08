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