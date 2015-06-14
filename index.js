var DisneyRequest = require("./disneyRequest");
var DisneyParks = require("./disneyParks");

/** This is a wrapper object to tie the API components together */

function DisneyAPI(options)
{
    // == make our own DisneyRequest object to make API calls ==
    var DRequest = new DisneyRequest(options);
    
    // == make park objects ==
    // DisneyWorld Resorts
    this.Epcot = new DisneyParks("80007838", DRequest);
    this.MagicKingdom = new DisneyParks("80007944", DRequest);
    this.HollywoodStudios = new DisneyParks("80007998", DRequest);
    this.AnimalKingdom = new DisneyParks("80007823", DRequest);

    // Disneyland California
    this.Disneyland = new DisneyParks("330339", DRequest);
    this.CaliforniaAdventure = new DisneyParks("336894", DRequest);
    
    // == export DRequest exports too ==
    for(var func in DRequest)
    {
        this[func] = DRequest[func];
    }
}

// export this object
module.exports = DisneyAPI;