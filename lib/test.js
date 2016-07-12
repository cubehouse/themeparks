var assert = require("assert");
var Park = require("./park.js");
var Settings = require("./settings");

// optional environment variable to print out API results
var PRINTDATA = process.env.PRINTDATA ? true : false;

try {
  console.log("Starting themeparks tests...");

  // test base park implementation doesn't implement anything invalid
  describe("Test base park implementation", function() {
    var parkBase;
    it("should not create the park base successfully without mandatory options", function(done) {
      try {
        parkBase = new Park();
        assert(parkBase, "parkBase should not successfully construct without mandatory configuration");
      } catch (err) {
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

  // some caching tests
  describe("Test caching module", function() {
    it("should not return valid data when no data is present", function(done) {
      Settings.Cache.get("cachekey", function(err, data) {
        assert(!err, "Getting non-existant cache data shouldn't return an error");
        assert(!data, "Cache returned data when it should not have");
        done();
      });
    });

    it("should return valid data from cache after setting data", function(done) {
      Settings.Cache.set("cachekey", "data", function() {
        Settings.Cache.get("cachekey", function(err, data) {
          assert(!err, "Getting set cache data shouldn't return an error");
          assert(data == "data", "Cache didn't return data when it should have");
          done();
        });
      });
    });
  });
} catch (err) {
  console.error("Unit tests failed")
  console.error(err);
  process.exit(1);
}