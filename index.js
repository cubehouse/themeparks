var DisneyRequest = require("./disneyRequest");
var DisneyParks = require("./disneyParks");
var DisneyParis = require("./disneyParis");

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

    // Disneyland Paris
    var DisneyParisAPI = new DisneyParis();
    // build a mini proxy for Paris parks
    function ParisProxy(park_id)
    {
        this.GetWaitTimes = function()
        {
            DisneyParisAPI.GetWaitTimes(park_id, arguments[ arguments.length - 1 ]);
        };

        this.GetSchedule = function()
        {
            // return error for now, will be implemented soon
            arguments[ arguments.length - 1 ]("Not implemented yet.");
        };
    }

    // Disneyland Paris Magic Kingdon
    this.DisneylandParis = new ParisProxy(1);
    // Disneyland Paris Disney Studios
    this.WaltDisneyStudios = new ParisProxy(2);
    
    // == export DRequest exports too ==
    for(var func in DRequest)
    {
        this[func] = DRequest[func];
    }
}

// export this object
module.exports = DisneyAPI;