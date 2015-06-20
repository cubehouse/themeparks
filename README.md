# wdwJS

An unofficial API library for accessing Disney park wait times, opening times and other information from the Disney API.

# Install

    npm install wdwjs
  
# Example Use

    // Setup API
    var DisneyAPI = require("wdwjs");
    var api = new DisneyAPI();
    
    // Get Magic Kingdom wait times
    api.MagicKingdom.GetWaitTimes(function(err, data) {
        if (err) return console.error("Error fetching Magic Kingdom wait times: " + err);
        
        console.log(JSON.stringify(data, null, 2));
    });
    
    // Get Magic Kingdom opening times
    api.MagicKingdom.GetSchedule(function(err, data) {
        if (err) return console.error("Error fetching Magic Kingdom schedule: " + err);

        console.log(JSON.stringify(data, null, 2));
    });

    // Parks available
    //  ** Disney World **
    //  api.MagicKingdom
    //  api.Epcot
    //  api.AnimalKingdom
    //  api.HollywoodStudios
    //
    //  ** Disney California **
    //  api.Disneyland
    //  api.CaliforniaAdventure
    //
    //  ** Disney Paris **
    //  api.DisneylandParis
    //  api.WaltDisneyStudios


# API Options

    var api = new DisneyAPI({
        // return all times in local time for each park
        //  or in UTC time
        //  defaults: true
        localTime: true,
        // turn on debug logging
        //  defaults: false
        debug: false
    });

# Advanced Use (Disney World / California APIs only)    

    // Get an API page using an ID and type
    api.GetPage(80010208, "Attraction", function(error, data) {
        console.log(JSON.stringify(data, null, 2));
    });
    
    // Get a specific API URL
    api.GetURL("https://api.wdpro.disney.go.com/global-pool-override-B/facility-service/theme-parks/80007944", function(e, data) {
       console.log(JSON.stringify(data, null, 2));
    });

# Acknowledgments

Based on code from lloydpick/echelon https://github.com/lloydpick/echelon/
