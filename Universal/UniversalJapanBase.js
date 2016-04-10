var Park = require("../parkBase");

var moment = require("moment-timezone");

module.exports = UniversalJapanBase;

function UniversalJapanBase(config) {
  var self = this;

  self.name = self.name || "Universal Japan Generic Park";

  this.GetWaitTimes = function(callback) {
    self.GetURL("http://ar02.biglobe.ne.jp/app/waittime/waittime.json", {
      json: true
    }, function(err, body) {
      if (err) return self.Error("Error getting wait times", err, callback);

      if (typeof(body.status) != "undefined" && body.status == 0) {
        // wait times are available!

        var times = [];
        // loop over times
        for (var i = 0, ride; ride = body.list[i++];) {
          self.Dbg(ride);
          times.push({
            id: ride.aid,
            name: ride.aid, // TODO - get ride names
            waitTime: ride.wait,
            active: true, // TODO - unsure how to tell if a ride is operating
            fastPass: false, // TODO - do they have fast pass?
          });
        }

        return callback(null, times);
      } else {
        // park is closed or wait times are unavailable
        return callback(null, []);
      }
    });
  };

  // Get a URL
  this.GetURL = function(url, options, callback) {
    var headers = {};

    // apply custom headers (if set)
    if (options && options.headers) {
      for (var k in options.headers) {
        headers[k] = options.headers[k];
      }
    }

    // build request object
    var requestBody = {
      method: (options && options.method) ? options.method : "GET",
      url: url,
      headers: headers,
    };

    // add JSON data if requested
    if (options.json) {
      requestBody.json = options.json;
    }

    // add data to request object (if we have any)
    if (options.data) {
      if (requestBody.method == "GET") {
        requestBody.qs = options.data;
      } else {
        requestBody.data = options.data;
      }
    }

    self.MakeNetworkRequest(requestBody, function(err, resp, body) {
      if (err) return self.Error("Error making Universal Japan API request", err, callback);

      return callback(null, body);
    });
  };
}