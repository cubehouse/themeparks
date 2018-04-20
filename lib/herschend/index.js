"use strict";

// base park objects
var Park = require("../park.js");

// Moment date/time library
var Moment = require("moment-timezone");

// include our Promise library
var Promise = require("../promise");

// API settings
var base_url = "http://pulse.hfecorp.com/api/waitTimes/";

/**
 * Implements the Walt Disney World API framework. All Disney parks use this one API.
 * @class
 * @extends Park
 */
class HerschendBase extends Park {
    /**
     * Create new HerschendBase Object.
     * This object should not be called directly, but rather extended for each of the individual Herschend Parks
     * @param {Object} options
     * @param {String} options.park_id is Herschend API park ID
     */
    constructor(options = {}) {
        // inherit from base class
        super(options);
    }

    /**
     * Fetch this Herschend Park's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise(function(resolve, reject) {
            this.Log("Running Herschend Park: ${options['name']}");
            this.HTTP({
                url: base_url + this.park_id
            }).then(function(body) {
                var main = this;
                body.forEach(function(ride) {
                  main.Log("Accessing ride ${ride['rideName']}")
                  var rideObject = main.GetRideObject({
                    id: ride['rideId'],
                    name: ride['rideName']
                  })
                  // Assume that all "UNKNOWN" times are closed rides.
                  if(ride['operationStatus'].includes('CLOSED') || ride['operationStatus'].includes('UNKNOWN')) {
                    rideObject.WaitTime = -1
                  }
                  // Wait time is not defined if text says "Under x minutes" - we'll set the ride time to x
                  else if(ride['waitTimeDisplay'].includes('UNDER')) {
                    rideObject.WaitTime = parseInt(ride['waitTimeDisplay'].split(' ')[1])
                  }
                  else {
                    rideObject.WaitTime = parseInt(ride['waitTime'])
                  }
                });
                return resolve();
            }.bind(this), reject);
        }.bind(this));
    }
}

// export just the Base Herschend Park class
module.exports = HerschendBase
