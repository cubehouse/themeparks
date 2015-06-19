var DisneyRequest = require("./disneyRequest");

/** Class to hold park-specific API calls for ease of access
 * Setup with a park ID and a DisneyRequest object
 * eg. new DisneyPark("80007944", new DisneyRequest());
 */
function DisneyPark(ParkID, DRequest)
{
    /** ===== Exports ===== */
    
    
    
    /** Get park waiting times for rides */
    this.GetWaitTimes = function(include_entertainment)
    {
        // callback is the last argument sent to the function
        var cb = arguments[ arguments.length - 1 ];

        // include_entertainment defaults to false
        if (typeof include_entertainment == "function") include_entertainment = false;

        // fetch wait times from the API
        DRequest.GetPage(ParkID, "theme-park", "wait-times", function(err, data) {
            if (err) return cb(err);

            // build ride array
            var rides = [];
            for(var i=0; i<data.entries.length; i++)
            {
                var ride = data.entries[i];

                if (ride.id && ride.name && ride.type && ride.type == "Attraction")
                {
                    // skip non attraction rides if we've not been told to include them
                    if (!include_entertainment)
                    {
                        if (ride.type != "Attraction") continue;
                    }

                    var obj = {
                        id: ride.id,
                        name: ride.name
                    };

                    // try to find wait time value
                    if (ride.waitTime && ride.waitTime && ride.waitTime.postedWaitMinutes)
                    {
                        // report the posted wait time if present
                        obj.waitTime = ride.waitTIme.postedWaitMinutes;
                    }
                    else
                    {
                        // zero if we cannot find a wait time
                        obj.waitTime = 0;
                    }

                    // work out if the ride is active
                    obj.active = (ride.waitTime && ride.waitTime.status == "Operating") ? true : false;

                    // work out if we have fastpass
                    obj.fastPass = (ride.waitTime.fastPass && ride.waitTime.fastPass.available);

                    // add to our return rides array
                    rides.push(obj);
                }
            }

            // return rides
            cb(null, rides);
        });
    };
    
    /** Get park opening hours */
    this.GetSchedule = function(cb)
    {
        // TODO - format this data nicely
        DRequest.GetPage(ParkID, "schedule", cb);
    };
    
    
    
    /** ===== Variables ===== */
    
    
    
    // make sure we have a request object if it wasn't supplied
    if (!DRequest) DRequest = new DisneyRequest();
}

// export this module
module.exports = DisneyPark;
