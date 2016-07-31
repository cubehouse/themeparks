var assert = require("assert");
var Park = require("./park.js");
var Settings = require("./settings");
var Debug = require("./debug");

// optional environment variable to print out API results
var PRINTDATA = process.env.PRINTDATA ? true : false;

try {
  console.log("Starting themeparks tests...");

  // test base park implementation doesn't implement anything invalid
  describe("Test base park implementation", function() {
    var parkBase;
    it("should not create the park base successfully", function(done) {
      try {
        parkBase = new Park();
        assert(parkBase, "parkBase should not successfully construct");
      } catch (err) {
        done();
      }
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