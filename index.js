var DisneyRequest = require("./disneyRequest");
var DisneyParks = require("./disneyParks");
var DisneyParis = require("./disneyParis");
var DisneyTokyo = require("./disneyTokyo");

/** This is a wrapper object to tie the API components together */

function DisneyAPI(options)
{
    // == make our own DisneyRequest object to make API calls ==
    var DRequest = new DisneyRequest(options);
    
    // == make park objects ==
    // DisneyWorld Resorts
    this.Epcot = new DisneyParks({wdw_park_id: "80007838"}, DRequest);
    this.MagicKingdom = new DisneyParks({wdw_park_id: "80007944"}, DRequest);
    this.HollywoodStudios = new DisneyParks({wdw_park_id: "80007998"}, DRequest);
    this.AnimalKingdom = new DisneyParks({wdw_park_id: "80007823"}, DRequest);

    // Disneyland California
    this.Disneyland = new DisneyParks({wdw_park_id: "330339", timezone: "America/Los_Angeles"}, DRequest);
    this.CaliforniaAdventure = new DisneyParks({wdw_park_id: "336894", timezone: "America/Los_Angeles"}, DRequest);

    // push options through to objects
    this.Epcot.TakeOptions(options);
    this.MagicKingdom.TakeOptions(options);
    this.HollywoodStudios.TakeOptions(options);
    this.AnimalKingdom.TakeOptions(options);
    this.Disneyland.TakeOptions(options);
    this.CaliforniaAdventure.TakeOptions(options);

    // Disneyland Paris
    var DisneyParisAPI = new DisneyParis(options);
    // build a mini proxy for Paris parks
    function ParisProxy(park_id)
    {
        this.GetWaitTimes = function()
        {
            DisneyParisAPI.GetWaitTimes(park_id, arguments[ arguments.length - 1 ]);
        };

        this.GetSchedule = function()
        {
            DisneyParisAPI.GetSchedule(park_id, arguments[ arguments.length - 1 ]);
        };
    }

    // Disneyland Paris Magic Kingdon
    this.DisneylandParis = new ParisProxy(1);
    // Disneyland Paris Disney Studios
    this.WaltDisneyStudios = new ParisProxy(2);

    // Tokyo Disney
    var DisneyTokyoAPI = new DisneyTokyo(options);
    // build a mini proxy for Tokyo
    function TokyoProxy(park_id)
    {
        this.GetWaitTimes = function()
        {
            DisneyTokyoAPI.GetWaitTimes(park_id, arguments[ arguments.length - 1 ]);
        };

        this.GetSchedule = function()
        {
            arguments[ arguments.length - 1 ]("Not Yet Implemented");
            //DisneyTokyoAPI.GetSchedule(park_id, arguments[ arguments.length - 1 ]);
        };
    }

    // Tokyo Disneyland
    this.TokyoDisneyland = new TokyoProxy("tdl");
    // Tokyo DisneySea
    this.TokyoDisneySea = new TokyoProxy("tds");
    
    // == export DRequest exports too (if asked for) ==
    if (options && options.WDWRequests)
    {
        for(var func in DRequest)
        {
            this[func] = DRequest[func];
        }
    }
}

// export this object
module.exports = DisneyAPI;