var Park = require("../parkBase");

var request = require("request");
var moment = require("moment-timezone");
var crypto = require("crypto");

module.exports = [EuropaPark];

function EuropaPark(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Europa-Park";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://apps.europapark.de/webservices/";
  self.APIVersion = self.APIVersion || "4"

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // include our EuropaData asset (cut from PhoneGap app JS)
  self.RideData = require(__dirname + "/EuropaData.json");

  // generate a code => name object to speed up look-ups
  self.RideNames = {};
  for (var i = 0, ride; ride = self.RideData[i++];) {
    self.RideNames[ride.code] = ride.en || ride.de || ride.fr;
  }

  // get park wait times
  this.GetWaitTimes = function(callback) {
    // now generate an access code to get wait times
    var waitTimesAccessCode = self.GenerateWaittimesCodes();

    // then fetch the wait times using the access code we created
    self.MakeNetworkRequest({
      url: self.APIBase + "waittimes/index.php",
      data: {
        "code": waitTimesAccessCode,
        "v": self.APIVersion
      },
      /*headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Accept-Language": "en-US",
        "Accept-Encoding": "gzip,deflate",
      }*/
    }, function(err, resp, body) {
      // check for standard network error for API response error
      if (err) return self.Error("Error fetching wait times", err, callback);

      // API doesn't return a proper JSON object, so parse it here
      var JSONData = body;
      if (typeof(body) == "string") {
        try {
          JSONData = JSON.parse(body);
        } catch (e) {
          return self.Error("Failed to parse JSON data from Europa API", e + ": " + body, callback);
        }
      }

      if (!JSONData || !JSONData.success) return self.Error("Europa API returned non-success result", JSONData, callback);
      if (!JSONData.results) return self.Error("No results data present in wait times data", JSONData, callback);

      // build ride object
      var rides = [];

      for (var i = 0, ridetime; ridetime = JSONData.results[i++];) {
        // FYI, ridetime.type:
        //   1: rollercoaster
        //   2: water
        //   3: adventure

        rides.push({
          id: ridetime.code,
          name: self.RideNames[ridetime.code] || "??",
          waitTime: parseInt(ridetime.time, 10),
          // TODO
          active: false,
          // Europa doesn't have a fastpass-like system
          fastPass: false,
          // TODO
          status: "Closed",
        });
      }

      return callback(null, rides);
    });
  };

  // generate wait times access code
  this.GenerateWaittimesCodes = function() {
    var hashString = "Europa-Park" + moment().tz(self.park_timezone).format("YYYYMMDDHHmm") + "SecondTry";
    var md5Buffer = crypto.createHash('md5').update(hashString).digest();
    var code = "";
    for (var i = 0; i < md5Buffer.length; i++) {
      code += ((0xF0 & md5Buffer[i]) >> 4).toString(16) + (0xF & md5Buffer[i]).toString(16);
    }

    self.Dbg("Generated Europa wait times code", code);

    return code;
  };
}