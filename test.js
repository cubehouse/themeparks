var wdwjs = new(require("./index"))();
var moment = require("moment-timezone");
var assert = require("assert");

function TestPark(park) {
  // === Test Wait Times Fetching ===
  describe("Get Park Wait Times", function() {
    // give each test a minute to finish
    this.timeout(1000 * 60);

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
      assert(times.length > 3, "Not enough ride times to be valid data (<= 3)");
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
    // give each test a minute to finish
    this.timeout(1000 * 60);

    var schedule = [];
    it("should not error when fetching schedule", function(done) {
      park.GetSchedule(function(err, _schedule) {
        assert(!err, "GetSchedule returned an error: " + err);

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

    it("should have a valid opening time for each schedule entry", function() {
      for (var i = 0, day; day = schedule[i++];) ValidateDateTime(day, "openingTime");
    });

    it("should have a valid closing time for each schedule entry", function() {
      for (var i = 0, day; day = schedule[i++];) ValidateDateTime(day, "closingTime");
    });

    it("should have a valid type string for each schedule entry", function() {
      for (var i = 0, day; day = schedule[i++];) ValidateType(day, "type", "string");
    });
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

// setup tests for each park supported by the API
for (var park in wdwjs) {
  if (wdwjs[park].GetWaitTimes) {
    describe("Park " + park, function() {
      TestPark(wdwjs[park]);
    });
  }
}