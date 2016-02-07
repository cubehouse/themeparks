// This script is purely to save time typing up all the Six Flags park
//  configuration objects
// We can actually get a park list from the API, so we make that request, then
//  work out each park's timezone from it's geo location data

// You must get an API key from timezonedb.com and set it as environment variable
//  TIMEZONEKEY=...

var fs = require("fs");
var path = require("path");
var async = require("async");
var request = require("request");

var SixFlagsBase = require("../SixFlags/SixFlagsBase");

console.log("  ___ _       ___ _              \n / __(_)_ __ | __| |__ _ __ _ ___\n \\__ \\ \\ \\ / | _|| / _` / _` (_-<\n |___/_/_\\_\\ |_| |_\\__,_\\__, /__/\n                        |___/    \n\n");
console.log("*** Script to generate all the park configurations for Six Flags parks ***");
console.log("*** Writes to SixFlags/SixFlagsParks.js ***");

if (!process.env.TIMEZONEKEY) {
  return console.error("\n\n ! Missing TIMEZONEKEY environment variable !");
}

// make request directly to get park list
var basePark = new SixFlagsBase();
basePark.GetAccessToken(function() {
  basePark.MakeRequest(basePark.APIBase + basePark.APIPrefix + "park", {
    json: true
  }, function(err, data) {
    if (err) {
      return console.error(err);
    }

    // print out code for each SixFlags park
    var todo = [];
    for (var i = 0, park; park = data.parks[i++];) {
      todo.push(park);
    }

    // start building file output
    var fileOutput = "var SixFlagsBase = require(\"./SixFlagsBase.js\");\n\n";
    var moduleExports = [];

    async.eachSeries(todo, function(park, cb) {
      console.log("Processing " + park.name + " timezone...");

      request({
        url: "http://api.timezonedb.com?key=" + process.env.TIMEZONEKEY + "&format=json&lat=" + park.location.latitude + "&lng=" + park.location.longitude,
        json: true
      }, function(err, resp, data) {
        if (err) return cb("Error GEOing: " + err);

        var parkName = park.name;
        var parkFuncName = park.name.replace(/[^a-zA-Z]/g, "");
        if (parkFuncName.indexOf("SixFlags") < 0) parkFuncName = "SixFlags" + parkFuncName;
        var parkID = park.parkId;

        fileOutput +=
          "\nfunction " + parkFuncName + "(config) {\n" +
          "  var self = this;\n\n" +
          "  // park configuration\n" +
          "  self.name = \"" + parkName + "\";\n" +
          "  self.park_id = " + parkID + ";\n" +
          "  self.park_timezone = \"" + data.zoneName + "\";\n\n" +
          "  SixFlagsBase.call(self, config);\n" +
          "};\n";

        moduleExports.push("  " + parkFuncName);

        cb();
      });
    }, function() {
      // add module exports to end of file
      fileOutput += "\nmodule.exports = [\n" + moduleExports.join(",\n") + "\n];";

      fs.writeFile(path.join(__dirname, "..", "SixFlags", "SixFlagsParks.js"), fileOutput, function(err) {
        if (err) return console.error("Failed to write file: " + err);

        console.log("Done");
      });
    });
  });
});