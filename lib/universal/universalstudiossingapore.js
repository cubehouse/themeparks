// include core Park class
var Park = require("../park");

var singapore_url = "http://cma.rwsentosa.com/Service.svc/GetUSSContent?languageID=1&filter=Ride&Latitude='1.254251'&Longitude='103.823797'";
var body = 'languageID=1&filter=Ride&Latitude=1.254251&Longitude=103.823797'
/**
 * Implements the Universal Singapore API.
 * @class
 * @extends Park
 */
class UniversalStudiosSingapore extends Park {
    constructor(options = {}) {
        options.name = options.name || "Universal Studios Singapore"

        // set park's location as it's entrance
        options.latitude = options.latitude || 1.254251;
        options.longitude = options.longitude || 103.823797;

        options.timezone = 'Asia/Singapore'

        // inherit from base class
        super(options);
    }

    /**
     * Fetch Universal Singapore's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            this.Log("Running Universal Studios Singapore");
            this.HTTP({
                url: singapore_url,
                body: body,
            }).then(function(body) {
                var main = this;
                var zones = body['ResponseOfUSS']['Result']['USSZoneList']['USSZone'];
                zones.forEach(function(zone){
                  main.Log("Accessing zone ${zone['Name']}")
                  var rides = zone['Content']['USSContent'];
                  rides.forEach(function(ride){
                    main.Log("Accessing ride ${ride['Name']}")
                    var rideObject = main.GetRideObject({
                      id: ride['USSContentID'],
                      name: ride['Name']
                    });
                    rideObject.WaitTime = parseInt(ride['QueueTime']) || -1
                  });
                });
                return resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}
// export the class
module.exports = UniversalStudiosSingapore;
