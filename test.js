var assert = require("assert");
var Park = require("./parkBase");
var DisneyBase = require("./Disney/DisneyBase");
var parks = require("./index");
var moment = require("moment-timezone");

describe("ParkBase", function() {
  var parkBase = new Park();

  it("should error attempting to fetch wait times", function(done) {
    parkBase.GetWaitTimes(function(err, res) {
      assert(err);
      assert(!res);
      done();
    });
  });
});

describe("DisneyBase", function() {
  var DisneyPark = new DisneyBase();

  var access_token = null;
  it("should get a valid access token", function(done) {
    DisneyPark.GetAccessToken(function(err, token) {
      assert(!err, "GetAccessToken returned an error: " + err);
      assert(token && token.length, "Invalid access token returned: " + token);
      access_token = token;
      done();
    });
  });

  it("fetching again should have same token (from cache)", function(done) {
    DisneyPark.GetAccessToken(function(err, token) {
      assert(!err, "Second call to GetAccessToken returned an error: " + err);
      assert(token && token.length, "Invalid access token returned second time: " + token);
      assert(access_token == token, "Tokens are not identical! Caching has failed");
      done();
    });
  });
});

function TestPark(park) {
  // === Test Wait Times Fetching ===
  describe("Get Park Wait Times", function() {
    // give each test 2 minutes to finish
    this.timeout(1000 * 60 * 2);

    var times = [];

    it("should not return an error fetching ride times", function(done) {
      park.GetWaitTimes(function(err, _times) {
        times = _times;
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
      for (var i = 0, ride; ride = times[i++];) ValidateType(ride, "fastPass", "boolean");
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
  var yesterday = moment().subtract(1, "day");
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