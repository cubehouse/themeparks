var assert = require("assert");
var Park = require("./parkBase");
var DisneyBase = require("./disney/DisneyBase");

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