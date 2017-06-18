var assert = require("assert");
var parks = require("./index").Parks;
var moment = require("moment-timezone");

// define Mocha functions for eslint
/*global describe it*/

// allow console for unit tests
/* eslint-disable no-console */

// optional environment variable to print out API results
var PRINTDATA = process.env.PRINTDATA ? true : false;

function TestPark(park) {
    // === Test Wait Times Fetching ===
    describe("Get Park Wait Times", function() {
        // give each test 2 minutes to finish
        this.timeout(1000 * 60 * 2);

        var times = [];

        it("should not return an error fetching ride times", function(done) {
            park.GetWaitTimes(function(err, _times) {
                times = _times;
                if (PRINTDATA) console.log(JSON.stringify(times, null, 2));
                assert(!err);
                done(err);
            });
        });

        it("should have some ride data", function() {
            assert(times);

            // Sesame Place doesn't return data in downtime, so sorry. This is a bad unit test.
            if (park.name == "Sesame Place") return;

            assert(times.length > 3, "Not enough ride times to be valid data (<= 3), actual: " + times.length);
        });

        it("should have an ID for every ride", function() {
            for (var i = 0, ride; ride = times[i++];) ValidateType(ride, "id", ["string", "number"]);
        });

        it("should have a wait time for every ride", function() {
            for (var i = 0, ride; ride = times[i++];) ValidateType(ride, "waitTime", "number");
        });

        it("should have a name for every ride", function() {
            for (var i = 0, ride; ride = times[i++];) ValidateType(ride, "name", "string");
        });

        it("should have an active state for every ride", function() {
            for (var i = 0, ride; ride = times[i++];) ValidateType(ride, "active", "boolean");
        });

        it("should have a fastpass field for every ride", function() {
            for (var i = 0, ride; ride = times[i++];) {
                ValidateType(ride, "fastPass", "boolean");

                // if any ride claims to have FastPass, so should the park
                if (ride.fastPass) {
                    assert(park.FastPass, "If any ride has fastPass available, the park should also support FastPass");
                }
            }
        });

        it("should have a status field for every ride", function() {
            for (var i = 0, ride; ride = times[i++];) {
                ValidateType(ride, "status", "string");
                // status string should only ever be one of these three options
                assert(
                    ride.status == "Operating" || ride.status == "Refurbishment" || ride.status == "Closed" || ride.status == "Down",
                    "Invalid status string returned by " + ride.name + ": " + ride.status
                );
            }
        });

        it("should have matching status and active fields", function() {
            for (var i = 0, ride; ride = times[i++];) {
                // check status and active variables match up
                if (ride.status == "Operating") assert(ride.active, "Ride cannot have Operating status and be inactive");
                else assert(!ride.active, "Ride can't be active without Operating status");
            }
        });
    });

    // === Test Schedule Fetching ===
    describe("Get Schedule", function() {
        // give each test 2 minutes to finish
        this.timeout(1000 * 60 * 2);

        var schedule = [];
        it("should not error when fetching schedule", function(done) {
            park.GetOpeningTimes(function(err, _schedule) {
                assert(!err, "GetOpeningTimes returned an error: " + err);

                schedule = _schedule;

                if (PRINTDATA) console.log(JSON.stringify(schedule, null, 2));

                done(err);
            });
        });

        it("should have schedule data", function() {
            assert(schedule);
            assert(schedule.length > 3, "Should be at least 4 schedule items. Found " + schedule.length);
        });

        it("should have a valid date for each schedule entry", function() {
            for (var i = 0, day; day = schedule[i++];) ValidateDateTime(day, "date");
        });

        // skip if this day is closed
        it("should have a valid opening time for each schedule entry", function() {
            for (var i = 0, day; day = schedule[i++];) {
                if (day.type && day.type == "Closed") continue;
                ValidateDateTime(day, "openingTime");
            }
        });

        it("should have a valid closing time for each schedule entry", function() {
            for (var i = 0, day; day = schedule[i++];) {
                if (day.type && day.type == "Closed") continue;
                ValidateDateTime(day, "closingTime");
            }
        });

        // TODO - test the "special hours" array has valid data too
    });
}

function ValidateDateTime(obj, key) {
    assert(obj, "Date parent is not a valid object");
    assert(obj[key], "Date field " + key + " is not a valid object");

    // parse date using momentjs
    var date = moment(obj[key]);
    //var yesterday = moment().subtract(1, "day");
    // make sure date is valid
    assert(date.isValid(), "Date " + obj[key] + " is invalid");
    // dates returned should be from today onwards
    // TODO - fix this logic, timezones mean that some parks will genuinely be open "yesterday"
    //assert(date.isAfter(yesterday), "Date " + obj[key] + " is before today (<= " + yesterday.format() + ")");
}

function ValidateType(obj, key, types) {
    // force types to an array
    types = [].concat(types);

    assert(obj, "Object passed to type validator is not valid");

    var objectType = typeof(obj[key]);
    for (var i = 0, t; t = types[i++];) {
        // exit function if we find a required type
        if (objectType == t) return;
    }

    console.log(obj);

    assert.fail("Object " + obj[key] + " is not of any required types: " + JSON.stringify(types) + " (got " + objectType + ")");
}

function Run() {
    if (process.env.PARKID) {
        var park_id = process.env.PARKID;
        if (parks[park_id]) {
            // run tests against a single park
            describe("Park " + parks[park_id].name, function() {
                TestPark(new parks[park_id]());
            });
            return;
        }
        // else park missing, just fall through to standard full test
    }

    // test all parks supported (and exposed) by the API
    for (var park in parks) {
        describe("Park " + parks[park].name, function() {
            TestPark(new parks[park]());
        });
    }
}
Run();

/* eslint-enable no-console */