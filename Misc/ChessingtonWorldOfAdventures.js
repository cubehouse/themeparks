// schedule: https://www.chessington.com/plan/chessington-opening-times.aspx
//   schedule data is inside the HTML... euch...

var Park = require("../parkBase");

var moment = require("moment-timezone");
var crypto = require('crypto');
var random_useragent = require("random-useragent");


module.exports = [ChessingtonWorldOfAdventures];

// timeout session after 15 minutes
var chessingtonSessionLength = 1000 * 60 * 15;

function ChessingtonWorldOfAdventures(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Chessington World Of Adventures";

  // Alton Towers in London timezone
  self.park_timezone = "Europe/London";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://legacy-api.attractions.io/apps/command/chessington/";
  // API key to access ride times
  self.APIKey = self.APIKey || "edqXyMWFtuqGY6BZ9Epkzg4ptqe6v3c7tdqa97VbXjvrgZHC";

  // Chessingon resort ID
  self.resort_id = "44";

  // grab opening times calendar from the website
  self.CalendarAPI = self.CalendarAPI || "https://www.chessington.com/plan/chessington-opening-times.aspx";

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // generate a random Android useragent
  self.RandomiseUseragent(function(ua) {
    return (ua.osName == "Android");
  });

  self._session = null;

  this.GetSession = function(callback) {
    // check for cached session
    if (self._session && self._session.expires && self._session.expires > Date.now()) {
      return callback(null, self._session.id);
    }

    // fetch new session token
    self.MakeNetworkRequest({
      "url": self.APIBase + "account",
      "method": "POST",
      "json": true,
    }, function(err, resp, data) {
      if (err) return self.Error("Error getting session token", err, callback);

      if (!data || !data.session) {
        return self.Error("Missing session token", data, callback);
      }

      // store session token in cache
      self._session = {
        id: data.session,
        expires: Date.now() + chessingtonSessionLength,
      };

      // return session token
      return callback(null, self._session.id);
    });
  };

  // create the response to a supplied challenge string
  this.ChallengeResponse = function(challenge) {
    return crypto.createHash('md5').update(challenge + self.APIKey).digest("hex");
  }

  // Get wait times
  this.GetWaitTimes = function(callback) {
    // get our session token
    self.GetSession(function(err, session_token) {
      if (err) return self.Error("Failed to get session token for wait times", err, callback);

      var timeNow = Date.now();

      // get challenge
      self.MakeNetworkRequest({
        "url": self.APIBase + "queue-times",
        "method": "POST",
        "formData": {
          "session": session_token,
          "resort": self.resort_id,
          "challenge": timeNow,
          "response": self.ChallengeResponse(timeNow),
        },
        "json": true
      }, function(err, resp, data) {
        if (err) return self.Error("Error fetching challenge string for wait times", err, callback);

        if (!data || !data.challenge) {
          return self.Error("Error reading challenge string from challenge request", data, callback);
        }

        var challenge = data.challenge;

        // now make actual wait times request
        self.MakeNetworkRequest({
          "url": self.APIBase + "queue-times",
          "method": "POST",
          "formData": {
            "session": session_token,
            "resort": self.resort_id,
            "challenge": challenge,
            "response": self.ChallengeResponse(challenge),
          },
          "json": true
        }, function(err, resp, data) {
          if (err) return self.Error("Failed to fetch wait times", err, callback);

          if (!data["queue-times"]) return self.Error("No queue times returned", data, callback);

          var rides = [];
          for (var i = 0, ride; ride = data["queue-times"][i++];) {
            rides.push({
              "id": ride.id,
              // TODO
              "name": null,
              "active": ride.is_operational,
              "waitTime": ride.wait_time,
              "status": ride.is_operational ? "Operating" : "Closed",
              "fastPass": false,
            });
          }

          return callback(null, rides);
        });
      });
    });
  };
}

if (!module.parent) {
  var test = new ChessingtonWorldOfAdventures();
  test.GetWaitTimes(console.log);
}