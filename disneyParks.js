var DisneyRequest = require("./disneyRequest");

/** Class to hold park-specific API calls for ease of access
 * Setup with a park ID and a DisneyRequest object
 * eg. new DisneyPark("80007944", new DisneyRequest());
 */
function DisneyPark(ParkID, DRequest)
{
    /** ===== Exports ===== */
    
    
    
    /** Get park waiting times for rides */
    this.GetWaitTimes = function(cb)
    {
        DRequest.GetPage(ParkID, "theme-park", "wait-times", cb);
    };
    
    /** Get park opening hours */
    this.GetSchedule = function(cb)
    {
         DRequest.GetPage(ParkID, "schedule", cb);
    };
    
    
    
    /** ===== Variables ===== */
    
    
    
    // make sure we have a request object if it wasn't supplied
    if (!DRequest) DRequest = new DisneyRequest();
}

// export this module
module.exports = DisneyPark;
