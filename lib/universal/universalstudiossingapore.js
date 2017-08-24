// include core Park class
const Park = require("../park");

const GeoLocation = require("../geoLocation");

const s_APIBase = Symbol();
const s_APILanguage = Symbol();
const s_parkLocationMin = Symbol();
const s_parkLocationMax = Symbol();

/**
 * Implements the Universal Singapore API.
 * @class
 * @extends Park
 */
class UniversalStudiosSingapore extends Park {
    /**
     * Create new UniversalStudiosSingapore Object.
     * @param {Object} options
     * @param {String} [options.api_base] API URL base for accessing API
     * @param {String} [options.api_langauge] Language ID for API results (default: 1)
     */
    constructor(options = {}) {
        options.name = options.name || "Universal Studios Singapore";

        // set park's location as it's entrance
        options.latitude = options.latitude || 1.254251;
        options.longitude = options.longitude || 103.823797;

        options.timezone = "Asia/Singapore";

        // inherit from base class
        super(options);

        this[s_APIBase] = options.api_base || "http://cma.rwsentosa.com/Service.svc/GetUSSContent";
        this[s_APILanguage] = options.api_langauge || 1;

        // Geofence corners (to generate random location for API requests)
        this[s_parkLocationMin] = new GeoLocation({
            latitude: 1.2547872658731591,
            longitude: 103.8217341899872
        });
        this[s_parkLocationMax] = new GeoLocation({
            latitude: 1.2533177673892697,
            longitude: 103.82408380508424
        });
    }

    /**
     * Fetch Universal Singapore's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise((resolve, reject) => {
            // generate random geo location to fetch with
            const randomGeoLocation = GeoLocation.RandomBetween(this[s_parkLocationMin], this[s_parkLocationMax]);

            this.Log("Running Universal Studios Singapore");
            this.HTTP({
                url: this[s_APIBase],
                body: {
                    "languageID": this[s_APILanguage],
                    "filter": "Ride",
                    "Latitude": randomGeoLocation.LatitudeRaw,
                    "Longitude": randomGeoLocation.LongitudeRaw
                },
            }).then((body) => {
                // check the response is as we expect
                if (!body || !body.ResponseOfUSS || !body.ResponseOfUSS.Result || !body.ResponseOfUSS.Result.USSZoneList || !body.ResponseOfUSS.Result.USSZoneList.USSZone) {
                    this.Log(`Error parsing Universal Studios Singapore response: ${body}`);
                    return reject("Unable to parse Universal Studios Singapore wait times response");
                }

                // loop through each zone
                body.ResponseOfUSS.Result.USSZoneList.USSZone.forEach((zone) => {
                    var rides = zone.Content.USSContent;

                    // loop through each ride
                    rides.forEach((ride) => {
                        var rideObject = this.GetRideObject({
                            id: ride.USSContentID,
                            name: ride.Name
                        });
                        rideObject.WaitTime = parseInt(ride.QueueTime, 10) || -1;
                    });
                });

                return resolve();
            }, reject);
        });
    }
}
// export the class
module.exports = UniversalStudiosSingapore;