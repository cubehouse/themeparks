var DisneyAPI = require("./disney.js");
var api = new DisneyAPI();

api.GetMagicKingdomTimes(function(error, data) {
    if (error)
    {
        console.log("Error fetching times: " + error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
});
