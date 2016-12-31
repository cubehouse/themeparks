var assert = require("assert");
var Park = require("./park.js");
var themeparks = require("./index");
var Cache = require("./cache");
var crypto = require("crypto");

// define Mocha functions for eslint
/*global describe it*/

// allow console for unit tests
/* eslint-disable no-console */

try {
    console.log("Starting themeparks tests...");

    // test base park implementation doesn't implement anything invalid
    describe("Test base park implementation", function() {
        var parkBase;
        it("should not create the park base successfully", function(done) {
            try {
                parkBase = new Park();
                assert(!parkBase, "parkBase should not successfully construct");
            } catch (err) {
                done();
            }
        });
    });

    // some caching tests
    describe("Test caching module", function() {
        // extend the timeout of these tests to handle ttl test case
        this.timeout(1000 * 5);

        var cacher = new Cache({
            prefix: "test"
        });
        // create a unique key for testing against
        var cacheKey = (new Date()).toUTCString();

        it("should fail for cache items not yet set", function(done) {
            cacher.Get(cacheKey + "_invalid").then(function() {
                done("Cache should not return data for a not set key");
            }, done);
        });

        it("should return identical data on get after cache data has been set", function(done) {
            var randomString = GenerateRandomString();
            cacher.Set(cacheKey, randomString, {
                ttl: 10
            }).then(function() {
                // now test we can get the data back
                cacher.Get(cacheKey).then(function(data) {
                    if (data != randomString) return done("Returned data doesn't match set random string");
                    done();
                }, function() {
                    done("Failed to get cache string response back");
                });
            }, function() {
                done("Failed to set cache string");
            });
        });

        it("should expire items after request ttl", function(done) {
            var randomString = GenerateRandomString();
            var ttlTime = 1;

            cacher.Set(cacheKey + "timed", randomString, {
                ttl: ttlTime
            }).then(function() {
                cacher.Get(cacheKey + "timed").then(function(data) {
                    assert(data == randomString, "Returned data doesn't match set random string (timed test)");
                    setTimeout(function() {
                        cacher.Get(cacheKey + "timed").then(function() {
                            done("Should not return valid data after the ttl has expired");
                        }, done);
                    }, (ttlTime + 0.5) * 1000);
                }, function() {
                    done("Failed to get cached data immediately (timed test)");
                });
            }, function() {
                done("Failed to set cache string (timed test)");
            });
        });

        // cache wrap tests
        it("should cache wrap correctly with non-existant key", function(done) {
            var wrapCallbackCalled = false;
            var randomString = GenerateRandomString();

            cacher.Wrap(cacheKey + "wrap", function() {
                // mark callback as called
                wrapCallbackCalled = true;

                return new Promise(function(resolve) {
                    resolve(randomString);
                });
            }, 10).then(function(data) {
                if (!wrapCallbackCalled) return done("Wrap data setter function failed to be called for missing key");
                if (data != randomString) return done("Wrapped data returned doesn't match generated random string");
                done();
            }, function() {
                done("Failed to call wrap function");
            });
        });

        it("should cache wrap correctly with already set key", function(done) {
            var randomString = GenerateRandomString();

            cacher.Set(cacheKey + "wrapsetkey", randomString).then(function() {
                // test key set, now test wrapping against it
                cacher.Wrap(cacheKey + "wrapsetkey", function() {
                    // this callback should never be called, because the key exists
                    done("Callback to set key in Wrap called, but key already exists");
                }, 10).then(function(data) {
                    if (data != randomString) return done("Wrapped data returned doesn't match generated random string");
                    done();
                }, function() {
                    done("Failed to call wrap function after manually setting key");
                });

            }.bind(this), function() {
                done("Failed to set wrap set key test");
            }.bind(this));
        });
    });

    // test exposed parks are done correctly
    describe("Test exposed parks are setup correctly", function() {
        it("should have an array of parks as .AllParks", function() {
            assert(Array.isArray(themeparks.AllParks), ".AllParks should be an array of all the parks available");
        });

        it("should have an object of parks as .Parks", function() {
            assert(themeparks.Parks.constructor === {}.constructor, ".Parks should be an object of available parks");

            for(var i in themeparks.Parks) {
                if(!themeparks.Parks.hasOwnProperty(i)) {
                    continue;
                }

                var park = new themeparks.Parks[i]();
                assert(!!park, 'Park ' + i + ' failed to initialize.');
            }
        });

        for (var i = 0, park; park = themeparks.AllParks[i++];) {
            (function(park) {
                it(`park .AllParks[${i}]{${park.name}} should have a corresponding .Parks entry`, function() {
                    assert(themeparks.Parks[park.name] !== undefined, `park ${park.name} should have an entry called ${park.name} in .Parks`);
                });
            }(park));
        }

        for (var parkName in themeparks.Parks) {
            (function(parkName) {
                it(`park .Parks[${parkName}] should have a corresponding .AllParks entry`, function() {
                    var foundPark = false;
                    for (var i = 0, park; park = themeparks.AllParks[i++];) {
                        if (park.name == parkName) {
                            foundPark = true;
                            break;
                        }
                    }

                    assert(foundPark, `.AllParks should have a reference to ${parkName}`);
                });
            }(parkName));
        }
    });

} catch (err) {
    console.error("Unit tests failed");
    console.error(err);
    process.exit(1);
}

function GenerateRandomString() {
    return crypto.randomBytes(20).toString("hex");
}

/* eslint-enable no-console */