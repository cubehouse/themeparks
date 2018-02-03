const themeparks = require("./index");

// use in-memory caching for unit tests
themeparks.Settings.Cache = ":memory:";

const assert = require("assert");
const Park = require("./park");
const Resort = require("./resort");
const Location = require("./location");
const Cache = require("./cache");
const crypto = require("crypto");
const tzlookup = require("tz-lookup");

// define Mocha functions for eslint
/*global describe it*/

// allow console for unit tests
/* eslint-disable no-console */

try {
    console.log("Starting themeparks tests...");

    describe("Location Class", function() {
        let locationBase;

        it("should not create the location base successfully", function(done) {
            try {
                locationBase = new Location();
                assert(!locationBase, "locationBase should not successfully construct");
            } catch (err) {
                done();
            }
        });

        class LocationNoName extends Location {
            constructor(options = {}) {
                options.latitude = options.longitude = 0;
                options.timezone = "America/New_York";
                super(options);
            }
        }
        it("should not create a Location without a name", function(done) {
            try {
                locationBase = new LocationNoName();
                assert(!locationBase, "location should not successfully construct");
            } catch (err) {
                done();
            }
        });

        class LocationNoTimezone extends Location {
            constructor(options = {}) {
                options.latitude = options.longitude = 0;
                options.name = "LocationNoTimezone";
                super(options);
            }
        }
        it("should not create a Location without a timezone", function(done) {
            try {
                locationBase = new LocationNoTimezone();
                assert(!locationBase, "location should not successfully construct");
            } catch (err) {
                done();
            }
        });

        class LocationInvalidTimezone extends Location {
            constructor(options = {}) {
                options.latitude = options.longitude = 0;
                options.name = "LocationInvalidTimezone";
                options.timezone = "Westeros/Hogsmead";
                super(options);
            }
        }
        it("should not create a Location without a valid timezone", function(done) {
            try {
                locationBase = new LocationInvalidTimezone();
                assert(!locationBase, "location should not successfully construct");
            } catch (err) {
                done();
            }
        });

        class ValidLocation extends Location {
            constructor(options = {}) {
                options.latitude = options.longitude = 0;
                options.name = "ValidLocation";
                options.timezone = "America/New_York";
                super(options);
            }
        }
        it("should create a valid Location successfully", function(done) {
            locationBase = new ValidLocation();
            assert(locationBase, "location should be successfully constructed");
            done();
        });
    });

    // test base park implementation doesn't implement anything invalid
    describe("Park Class", function() {
        let parkBase;
        it("should not create the park base successfully", function(done) {
            try {
                parkBase = new Park();
                assert(!parkBase, "parkBase should not successfully construct");
            } catch (err) {
                done();
            }
        });
    });

    describe("Resort Class", function() {
        let resortBase;
        it("should not create the resort base successfully", function(done) {
            try {
                resortBase = new Resort();
                assert(!resortBase, "resortBase should not successfully construct");
            } catch (err) {
                done();
            }
        });

        class ResortWithNoParks extends Location {
            constructor(options = {}) {
                options.latitude = options.longitude = 0;
                options.name = "ResortWithNoParks";
                options.timezone = "America/New_York";
                options.parks = [];
                super(options);
            }
        }
        it("should not create a Resort without any associated Parks", function(done) {
            try {
                resortBase = new ResortWithNoParks();
                assert(!resortBase, "resort should not successfully construct");
            } catch (err) {
                done();
            }
        });
    });

    // some caching tests
    describe("Test caching module", function() {
        // extend the timeout of these tests to handle ttl test case
        this.timeout(1000 * 5);

        const cacher = new Cache({
            prefix: "test"
        });
        // create a unique key for testing against
        const cacheKey = (new Date()).toUTCString();

        it("should fail for cache items not yet set", function(done) {
            cacher.Get(cacheKey + "_invalid").then(function() {
                done("Cache should not return data for a not set key");
            }, done);
        });

        it("should return identical data on get after cache data has been set", function(done) {
            const randomString = GenerateRandomString();
            cacher.Set(cacheKey, randomString, 10).then(function() {
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
            const randomString = GenerateRandomString();
            const ttlTime = 1;

            cacher.Set(cacheKey + "timed", randomString, ttlTime).then(function() {
                cacher.Get(cacheKey + "timed").then(function(data) {
                    assert(data == randomString, "Returned data doesn't match set random string (timed test)");
                    setTimeout(function() {
                        cacher.Get(cacheKey + "timed").then(function() {
                            done("Should not return valid data after the ttl has expired");
                        }, done);
                    }, (ttlTime + 2) * 1000);
                }, function(err) {
                    done(`Failed to get cached data immediately (timed test): ${err}`);
                });
            }, function() {
                done("Failed to set cache string (timed test)");
            });
        });

        // cache wrap tests
        it("should cache wrap correctly with non-existant key", function(done) {
            let wrapCallbackCalled = false;
            const randomString = GenerateRandomString();

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
            const randomString = GenerateRandomString();

            cacher.Set(cacheKey + "wrapsetkey", randomString).then(() => {
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

            }, () => done("Failed to set wrap set key test"));
        });
    });

    // test exposed parks are done correctly
    describe("Test exposed parks are setup correctly", function() {
        it("should have an array of parks as .AllParks", function() {
            assert(Array.isArray(themeparks.AllParks), ".AllParks should be an array of all the parks available");
        });

        it("should have an object of parks as .Parks", function() {
            assert(themeparks.Parks.constructor === {}.constructor, ".Parks should be an object of available parks");

            for (let i in themeparks.Parks) {
                if (!themeparks.Parks.hasOwnProperty(i)) {
                    continue;
                }

                const park = new themeparks.Parks[i]();
                assert(!!park, "Park " + i + " failed to initialize.");
            }
        });

        for (let i = 0, park; park = themeparks.AllParks[i++];) {
            (function(park) {
                it(`park .AllParks[${i}]{${park.name}} should have a corresponding .Parks entry`, function() {
                    assert(themeparks.Parks[park.name] !== undefined, `park ${park.name} should have an entry called ${park.name} in .Parks`);
                });
            }(park));
        }

        for (let parkName in themeparks.Parks) {
            (function(parkName) {
                it(`park .Parks[${parkName}] should have a corresponding .AllParks entry`, function() {
                    let foundPark = false;
                    for (let i = 0, park; park = themeparks.AllParks[i++];) {
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

    describe("Test parks have correct timezone setup", function() {
        for (let parkName in themeparks.Parks) {
            (function(parkName) {
                it(`park .Parks[${parkName}] should use the correct timezone`, function() {
                    const park = new themeparks.Parks[parkName]();
                    let locationTimezone = tzlookup(park.Location.LatitudeRaw, park.Location.LongitudeRaw);

                    // Montreal was removed from timezone database in 2013
                    //  so manually change this to Toronto (I want to remain compatible with any systems with modern tzdata files)
                    //  see https://en.wikipedia.org/wiki/America/Montreal#Relation_to_America.2FToronto
                    if (locationTimezone == "America/Montreal") {
                        locationTimezone = "America/Toronto";
                    }

                    assert.equal(locationTimezone, park.Timezone, `${parkName} should have ${locationTimezone} set as Timezone`);
                });
            }(parkName));
        }
    });

    describe("Check parks have unique geo-positions", function() {
        // create a list of park locations first
        const positions = {};
        for (let parkName in themeparks.Parks) {
            const park = new themeparks.Parks[parkName]();
            const positionString = park.Location.toString();
            if (!positions[positionString]) positions[positionString] = [];
            positions[positionString].push(parkName);
        }

        for (let parkName in themeparks.Parks) {
            (function(parkName) {
                it(`park .Parks[${parkName}] should have a unique geo location`, function() {
                    const park = new themeparks.Parks[parkName]();

                    const positionString = park.Location.toString();

                    assert.equal(positions[positionString].length, 1, `${parkName}'s position (${positionString}) should be unique`);
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