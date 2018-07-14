"use strict";

const themeparks = require("./index");

// use in-memory caching for unit tests
themeparks.Settings.Cache = ":memory:";

const assert = require("assert");
const Moment = require("moment-timezone");
const Park = require("./park");
const Resort = require("./resort");
const Location = require("./location");
const Cache = require("./cache");
const crypto = require("crypto");
const tzlookup = require("tz-lookup");
const Schedule = require("./schedule");

// define Mocha functions for eslint
/*global describe it*/

// allow console for unit tests
/* eslint-disable no-console */

try {
    console.log("Starting themeparks tests...");

    // ==== Location() ====
    describe("Location Class", function() {
        it("should not create the location base successfully", function(done) {
            try {
                new Location();
                assert(false, "locationBase should not successfully construct");
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
                new LocationNoName();
                assert(false, "location should not successfully construct");
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
                new LocationNoTimezone();
                assert(false, "location should not successfully construct");
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
                new LocationInvalidTimezone();
                assert(false, "location should not successfully construct");
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
            new ValidLocation();
            assert(true, "location should be successfully constructed");
            done();
        });
    });

    // ==== Park() ====
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

    // ==== Resort() ====
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

    // ==== Cache() ====
    // some caching tests
    describe("Test caching module", function() {
        // extend the timeout of these tests to handle ttl test case
        this.timeout(1000 * 5);

        const cacher = new Cache({
            prefix: "test"
        });
        // create a unique key for testing against
        const cacheKey = (new Date()).toUTCString();

        it("should fail for cache items not yet set", (done) => {
            cacher.Get(cacheKey + "_invalid").then((data) => {
                assert(data === null, "Cache should not return data for a not set key");
                done();
            });
        });

        it("should return identical data on get after cache data has been set", function(done) {
            const randomString = GenerateRandomString();
            cacher.Set(cacheKey, randomString, 10).then(() => {
                // now test we can get the data back
                cacher.Get(cacheKey).then((data) => {
                    if (data != randomString) return done("Returned data doesn't match set random string");
                    done();
                }).catch(() => {
                    done("Failed to get cache string response back");
                });
            }).catch(() => {
                done("Failed to set cache string");
            });
        });

        it("should expire items after request ttl", (done) => {
            const randomString = GenerateRandomString();
            const ttlTime = 1;

            cacher.Set(cacheKey + "timed", randomString, ttlTime).then(() => {
                cacher.Get(cacheKey + "timed").then((data) => {
                    assert(data == randomString, "Returned data doesn't match set random string (timed test)");
                    setTimeout(function() {
                        cacher.Get(cacheKey + "timed").then((data) => {
                            assert(data === null, "Should not return valid data after the ttl has expired");
                            done();
                        }).catch(done);
                    }, (ttlTime + 2) * 1000);
                }).catch((err) => {
                    done(`Failed to get cached data immediately (timed test): ${err}`);
                });
            }).catch(() => {
                done("Failed to set cache string (timed test)");
            });
        });

        // cache wrap tests
        it("should cache wrap correctly with non-existant key", (done) => {
            let wrapCallbackCalled = false;
            const randomString = GenerateRandomString();

            cacher.Wrap(cacheKey + "wrap", () => {
                // mark callback as called
                wrapCallbackCalled = true;

                return Promise.resolve(randomString);
            }, 10).then(function(data) {
                assert(wrapCallbackCalled, "Wrap data setter function failed to be called for missing key");
                assert(data === randomString, "Wrapped data returned doesn't match generated random string");
                done();
            }).catch(() => {
                done("Failed to call wrap function");
            });
        });

        it("should cache wrap correctly with already set key", (done) => {
            const randomString = GenerateRandomString();

            cacher.Set(cacheKey + "wrapsetkey", randomString).then(() => {
                // test key set, now test wrapping against it
                cacher.Wrap(cacheKey + "wrapsetkey", () => {
                    // this callback should never be called, because the key exists
                    done("Callback to set key in Wrap called, but key already exists");
                }, 10).then((data) => {
                    assert(data === randomString, "Wrapped data returned doesn't match generated random string");
                    done();
                }).catch(() => {
                    done("Failed to call wrap function after manually setting key");
                });

            }).catch(() => done("Failed to set wrap set key test"));
        });

        it("should cache Moment objects correctly with their timezone", (done) => {
            const date = Moment.tz("2017-07-05T01:02:03", "America/New_York");
            const originalTime = date.format();

            cacher.Set(cacheKey + "date", date).then(() => {
                return cacher.Get(cacheKey + "date").then(dateValue => {
                    const newTime = dateValue.format();

                    assert(originalTime === newTime, `Gotten cached time should match set cached time. Got ${newTime}, expected ${originalTime}`);
                    done();
                });
            }).catch(done);
        });

        it("should cache Moment sub-objects correctly with their timezone", (done) => {
            const date = Moment.tz("2017-07-05T01:02:03", "America/New_York");
            const originalTime = date.format();

            const dateObject = {
                date: date,
                lvl2: {
                    date: date,
                    lvl3: {
                        date: date,
                        lvl4: {
                            date: date
                        }
                    }
                }
            };

            cacher.Set(cacheKey + "dateWithSubObjects", dateObject).then(() => {
                return cacher.Get(cacheKey + "dateWithSubObjects").then(newDateObject => {
                    assert(originalTime === newDateObject.date.format(), "Gotten cached time should match set cached time.");
                    assert(originalTime === newDateObject.lvl2.date.format(), "Gotten cached time should match set cached time.");
                    assert(originalTime === newDateObject.lvl2.lvl3.date.format(), "Gotten cached time should match set cached time.");
                    assert(originalTime === newDateObject.lvl2.lvl3.lvl4.date.format(), "Gotten cached time should match set cached time.");
                    done();
                });
            }).catch(done);
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

                const park = new themeparks.Parks[i]({
                    forceCreate: true
                });
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
                    const park = new themeparks.Parks[parkName]({
                        forceCreate: true
                    });
                    let locationTimezone = tzlookup(park.LatitudeRaw, park.LongitudeRaw);

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
            const park = new themeparks.Parks[parkName]({
                forceCreate: true
            });
            const positionString = park.LocationString;
            if (!positions[positionString]) positions[positionString] = [];
            positions[positionString].push(parkName);
        }

        for (let parkName in themeparks.Parks) {
            (function(parkName) {
                it(`park .Parks[${parkName}] should have a unique geo location`, function() {
                    const park = new themeparks.Parks[parkName]({
                        forceCreate: true
                    });

                    const positionString = park.LocationString;

                    assert.equal(positions[positionString].length, 1, `${parkName}'s position (${positionString}) should be unique`);
                });
            }(parkName));
        }
    });

    describe("Cache Maps", () => {
        it("should cache Map objects correctly", (done) => {
            const cacher = new Cache({
                prefix: "test"
            });

            const cacheMap = new Map();
            cacheMap.set("key", "value");

            // write to cache
            cacher.Set("test_map", cacheMap).then(() => {
                cacher.Get("test_map").then((cached_data) => {
                    assert(cached_data.has("key"), "returned cached Map object should have key entry");
                    assert(cached_data.get("key") == "value", "returned cached Map object should have key == value");

                    done();
                });
            });
        });

        it("should cache nested Map objects correctly", (done) => {
            const cacher = new Cache({
                prefix: "test"
            });

            const cacheMap = new Map();
            cacheMap.set("key", "value");

            const nestedObject = {
                myMap: cacheMap,
            };

            // write to cache
            cacher.Set("test_nested_map", nestedObject).then(() => {
                cacher.Get("test_nested_map").then((cached_data) => {
                    assert(cached_data.myMap.has("key"), "returned nested cached Map object should have key entry");
                    assert(cached_data.myMap.get("key") == "value", "returned nested cached Map object should have key == value");

                    done();
                });
            });
        });
    });

    describe("Test Schedules", () => {
        it("should create a Schedule object successfully", () => {
            const sched = new Schedule({
                id: "test_schedule"
            });

            assert(sched !== undefined, "Schedule object should be created successfully");

            // add a schedule entry for today
            const today = Moment();
            sched.SetDate({
                date: today,
                openingTime: today,
                closingTime: today,
                type: "Operating"
            });

            const date = sched.GetDate({
                date: today
            });

            assert(Moment.isMoment(date.date), "returned date from schedule should be a Moment object");
            assert(Moment.isMoment(date.openingTime), "returned openingTime from schedule should be a Moment object");
            assert(Moment.isMoment(date.closingTime), "returned closingTime from schedule should be a Moment object");
            assert(date.type == "Operating", "returned type should be Operating");
        });

        it("should cache Schedule object data correctly", (done) => {
            let sched = new Schedule({
                id: "cached_schedule"
            });

            // add a schedule entry for today
            const today = Moment();
            sched.SetDate({
                date: today,
                openingTime: today,
                closingTime: today,
                type: "Operating"
            });

            sched.WriteToCache().then(() => {
                // clear out existing schedule object used to write to the cache
                sched = null;

                // create a second schedule object, and restore it from the cache
                const sched2 = new Schedule({
                    id: "cached_schedule"
                });

                sched2.ReadFromCache().then(() => {
                    const cachedDate = sched2.GetDate({
                        date: today
                    });

                    assert(Moment.isMoment(cachedDate.date), "returned date from cached schedule should be a Moment object");
                    assert(Moment.isMoment(cachedDate.openingTime), "returned openingTime from cached schedule should be a Moment object");
                    assert(Moment.isMoment(cachedDate.closingTime), "returned closingTime from cached schedule should be a Moment object");
                    assert(cachedDate.type == "Operating", "returned type should be Operating");

                    done();
                });
            });
        });
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