var assert = require("assert");
import Park from "./park.js";

// optional environment variable to print out API results
var PRINTDATA = process.env.PRINTDATA ? true : false;

// run mocha tests wrapped in async to benefit from async/await
(async function () {
    try {
        console.log("Starting themeparks tests...");
        
        // test base park implementation doesn't implement anything invalid
        describe("Test base park implementation", function() {
          var parkBase;
          it("should not create the park base successfully without mandatory options", function(done) {
            try {
              parkBase = new Park();
              assert(parkBase, "parkBase should not successfully construct without mandatory configuration");
            } catch(err) {
              done();
            }
          });
          
          it("should construct park base successfully when mandatory configurations are provided", function() {
            parkBase = new Park({
              // pass in zero geolocation settings to make parkBase construct
              longitude: 0,
              latitude: 0,
            });
          });
          
          it("should not implement features that only implemented parks should have", function() {
            assert(!parkBase.FastPass, "Base park implementation cannot support fast pass");
            assert(!parkBase.SetupOfflineTests(), "Base park implementation shouldn't have offline tests");
          });
        });
    } catch (err) {
      console.error("Unit tests failed")
      console.error(err);
      process.exit(1);
    }
} ());