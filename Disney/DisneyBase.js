// get the base Park class
var Park = require("../parkBase");
// request library
var request = require("request");

// export the Disney base park object
module.exports = DisneyBase;

function DisneyBase(config) {
  // keep hold of 'this'
  var self = this;

  self.name = "Generic Disney Park";

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // generate a random Android useragent
  self.RandomiseUseragent(function(ua) {
    return (ua.osName == "Android");
  });

  // store/cache access token
  //  will be an object with string 'token' and unix timestamp 'expires'
  self._accessToken = null;
  // access token URL requester
  self._accessTokenURL = "https://authorization.go.com/token";
  self._accessTokenURLBody = "assertion_type=public&client_id=WDPRO-MOBILE.CLIENT-PROD&grant_type=assertion";
  self._accessTokenURLMethod = "POST";

  // TODO - some generic processing for Disney parks
  //  each implementation will need to define some extra logic/vars for this
  this.GetOpeningTimes = function(callback) {
    return callback("TODO - implement this");
  };

  // Fetch cached/new access token for Disney API methods
  this.GetAccessToken = function(callback) {
    // if we already have an access token, check it is still valid
    if (self._accessToken) {
      // if token has expired...
      if (self._accessToken.expires <= new Date().getTime()) {
        // ... set to null ...
        self.Dbg("Access token has expired, fetching new one");
        self._accessToken = null;
      } else {
        // ... otherwise, return it
        return callback(null, self._accessToken.token);
      }
    }

    // no (valid) cached access token, request a new one!
    self.FetchAccessToken(function(err, token, expires) {
      if (err) return callback(err);

      // cache token for later
      self._accessToken = {
        token: token,
        expires: expires,
      };

      // return access token
      return callback(null, token);
    });
  };

  // Make the network request to create a new access token
  this.FetchAccessToken = function(callback) {
    // request new access token
    request({
        url: self._accessTokenURL,
        method: self._accessTokenURLMethod,
        headers: {
          "User-Agent": self.useragent,
        },
        body: self._accessTokenURLBody,
      },
      function(err, resp, body) {
        if (err) return self.Error("Failed to get access token", err, callback);

        if (resp.statusCode != 200) {
          return self.Error("Unexpected status code for access token response, expected 200", "Got " + resp.statusCode, callback);
        }

        // parse JSON data from response
        var data;
        try {
          data = JSON.parse(body);
        } catch (e) {
          return self.Error("Invalid JSON returned for access token", e, callback);
        }

        if (data && data.access_token && data.expires_in) {
          self.Dbg("Fetched access token " + data.access_token);

          return callback(null, data.access_token, (new Date().getTime()) + ((data.expires_in - 30) * 1000));
        }

        return self.Error("Invalid body response for access token", null, callback);
      }
    );
  };

  // Fetch a WDWjs API URL
  this.FetchURL = function(url, options, callback) {
    // first, get a valid access token
    self.GetAccessToken(function(err, token) {
      if (err) return self.Error("Error getting access token for API URL", err, callback);

      // setup request headers
      var headers = {
        'Authorization': "BEARER " + self._accessToken.token,
        'Accept': 'application/json;apiversion=1',
        'X-Conversation-Id': '~WDPRO-MOBILE.CLIENT-PROD',
        "User-Agent": self.useragent,
      };

      // add/override headers if passed in
      if (options.headers) {
        for (var name in options.headers) headers[name] = options.headers;
      }

      // add stored load balancer instance if we have one saved
      if (self._accessToken.correlation) {
        headers["X-Correlation-Id"] = self._accessToken.correlation;
      }

      // setup options for request lib
      var requestBody = {
        url: url,
        method: options.method || "GET",
        headers: headers,
      };

      // add data to request object (if we have any)
      if (options.data) {
        if (requestBody.method == "GET") {
          requestBody.qs = options.data;
        } else {
          requestBody.data = options.data;
        }
      }

      // make request
      request(requestBody, function(err, resp, body) {
        // if we get an instance ID from the load balancer, store it
        //  (even if we get an error)
        if (resp && resp.headers && resp.headers["x-correlation-id"]) {
          self._accessToken.correlation = resp.headers["x-correlation-id"];
        }

        if (err) return self.Error("Error making API request", err, callback);

        // attempt to parse the body for JSON Data
        var JSONData = false;
        try {
          JSONData = JSON.parse(body);
        } catch (e) {
          return self.Error("Invalid JSON data returned by API", e, callback);
        }

        return callback(null, JSONData);
      });
    });
  };
}

// sort out prototype inheritance
DisneyBase.prototype = Object.create(Park.prototype);
DisneyBase.prototype.constructor = DisneyBase;

// DEBUG TEST CODE
if (!module.parent) {
  // test request
  var d = new DisneyBase();
  // test getting Disneyland Paris schedule
  d.FetchURL("https://api.wdpro.disney.go.com/mobile-service/public/ancestor-activities-schedules/dlp;entityType=destination", {
    data: {
      "filters": "theme-park,Attraction",
      "startDate": "2016-01-09",
      "endDate": "2016-01-29",
      "region": "fr",
    }
  }, console.log);
}