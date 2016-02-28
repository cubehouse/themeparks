// this script generates the timezone and supported parks lists found in the README.md
var fs = require("fs");
var path = require("path");
var DisneyAPI = require("../index");

var timezoneMarkdown = "";
var supportedParksMarkdown = "";
var parkFeaturesMarkdown =
  "|Park|Wait Times|Park Opening Times|Ride Opening Times|\n" +
  "|:---|:---------|:-----------------|:-----------------|\n";

// search for these tags to inject our new content
var supportedParkListStart = "<!-- START_SUPPORTED_PARKS_LIST -->";
var supportedParkListEnd = "<!-- END_SUPPORTED_PARKS_LIST -->";
var timezoneListStart = "<!-- START_PARK_TIMEZONE_LIST -->";
var timezoneListEnd = "<!-- END_PARK_TIMEZONE_LIST -->";
var parkFeaturesListStart = "<!-- START_PARK_FEATURES_SUPPORTED -->";
var parkFeaturesListEnd = "<!-- END_PARK_FEATURES_SUPPORTED -->";

// local path to the README file
var readmeFilePath = path.join(__dirname, "..", "README.md");



for (var park in DisneyAPI) {
  var parkObj = new DisneyAPI[park]();
  // print out each supported park object name and "pretty name"
  supportedParksMarkdown += "* " + parkObj.name + " (DisneyAPI." + park + ")\n";
  // print each park's timezone into timezoneMarkdown
  timezoneMarkdown += "    * " + parkObj.name + " => " + parkObj.park_timezone + "\n";

  parkFeaturesMarkdown +=
    "|" + parkObj.name + "|:thumbsup:|:thumbsup:|" + (parkObj.supports_ride_schedules ? ":thumbsup:" : ":heavy_multiplication_x:") + "|\n";
}

// read in README.md
fs.readFile(readmeFilePath, function(err, readmeData) {
  if (err) return console.log(err);

  // find START/END comments and replace with new content
  readmeData = readmeData.toString().replace(
    new RegExp(supportedParkListStart + "[^<]*" + supportedParkListEnd, 'g'),
    supportedParkListStart + "\n" + supportedParksMarkdown + "\n" + supportedParkListEnd
  );
  readmeData = readmeData.toString().replace(
    new RegExp(timezoneListStart + "[^<]*" + timezoneListEnd, 'g'),
    timezoneListStart + "\n" + timezoneMarkdown + "\n" + timezoneListEnd
  );
  readmeData = readmeData.toString().replace(
    new RegExp(parkFeaturesListStart + "[^<]*" + parkFeaturesListEnd, 'g'),
    parkFeaturesListStart + "\n" + parkFeaturesMarkdown + "\n" + parkFeaturesListEnd
  );

  // write back new readme file
  fs.writeFile(readmeFilePath, readmeData);
});