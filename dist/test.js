"use strict";

var assert = require("assert");
var Park = require("./park.js");
var Settings = require("./settings");
var Debug = require("./debug");
var themeparks = require("./index");

// optional environment variable to print out API results
var PRINTDATA = process.env.PRINTDATA ? true : false;

try {
  console.log("Starting themeparks tests...");

  // test base park implementation doesn't implement anything invalid
  describe("Test base park implementation", function () {
    var parkBase;
    it("should not create the park base successfully", function (done) {
      try {
        parkBase = new Park();
        assert(parkBase, "parkBase should not successfully construct");
      } catch (err) {
        done();
      }
    });
  });

  // some caching tests
  describe("Test caching module", function () {
    it("should not return valid data when no data is present", function (done) {
      Settings.Cache.get("cachekey", function (err, data) {
        assert(!err, "Getting non-existant cache data shouldn't return an error");
        assert(!data, "Cache returned data when it should not have");
        done();
      });
    });

    it("should return valid data from cache after setting data", function (done) {
      Settings.Cache.set("cachekey", "data", function () {
        Settings.Cache.get("cachekey", function (err, data) {
          assert(!err, "Getting set cache data shouldn't return an error");
          assert(data == "data", "Cache didn't return data when it should have");
          done();
        });
      });
    });
  });

  // test exposed parks are done correctly
  describe("Test exposed parks are setup correctly", function () {
    it("should have an array of parks as .AllParks", function () {
      assert(Array.isArray(themeparks.AllParks), ".AllParks should be an array of all the parks available");
    });
    it("should have an object of parks as .Parks", function () {
      assert(themeparks.Parks.constructor === {}.constructor, ".Parks should be an object of available parks");
    });

    for (var i = 0, park; park = themeparks.AllParks[i++];) {
      (function (park) {
        it("park .AllParks[" + i + "]{" + park.name + "} should have a corresponding .Parks entry", function () {
          assert(themeparks.Parks[park.name] !== undefined, "park " + park.name + " should have an entry called " + park.name + " in .Parks");
        });
      })(park);
    }
  });
} catch (err) {
  console.error("Unit tests failed");
  console.error(err);
  process.exit(1);
}
//# sourceMappingURL=test.js.map