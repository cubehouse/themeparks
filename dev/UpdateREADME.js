// this script generates the timezone and supported parks lists found in the README.md
var fs = require("fs");
var path = require("path");
var ThemeParks = require("../lib/index");

var timezoneMarkdown = "\n";
var supportedParksMarkdown = "\n";
var parkFeaturesMarkdown = `|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
`;

// search for these tags to inject our new content
var supportedParkListStart = "<!-- START_SUPPORTED_PARKS_LIST -->";
var supportedParkListEnd = "<!-- END_SUPPORTED_PARKS_LIST -->";
var timezoneListStart = "<!-- START_PARK_TIMEZONE_LIST -->";
var timezoneListEnd = "<!-- END_PARK_TIMEZONE_LIST -->";
var parkFeaturesListStart = "<!-- START_PARK_FEATURES_SUPPORTED -->";
var parkFeaturesListEnd = "<!-- END_PARK_FEATURES_SUPPORTED -->";

// local path to the README file
var readmeFilePath = path.join(__dirname, "..", "README.md");

// symbols to use for parks supporting/not-supporting features
var featureAvailable = "&#10003;";
var featureUnavailable = "&#10007;";

for (var park in ThemeParks.Parks) {
    var parkObj = new ThemeParks.Parks[park]();
    // print out each supported park object name and "pretty name"
    supportedParksMarkdown += "* " + parkObj.Name + " (ThemeParks.Parks." + park + ")\n";
    // print each park's timezone into timezoneMarkdown
    timezoneMarkdown += "* " + parkObj.Name + " [" + parkObj.Location.toString() + "]: (" + parkObj.Timezone + ")\n";

    parkFeaturesMarkdown +=
        "|" + parkObj.Name + "|" +
        // Wait Times
        (parkObj.SupportsWaitTimes ? featureAvailable : featureUnavailable) + "|" +
        // Opening Times
        (parkObj.SupportsOpeningTimes ? featureAvailable : featureUnavailable) + "|" +
        // Ride Schedules
        (parkObj.SupportsRideSchedules ? featureAvailable : featureUnavailable) +
        "|\n";
}

// read in README.md
fs.readFile(readmeFilePath, function(err, readmeData) {
    // convert buffer to string
    readmeData = readmeData.toString();

    // find START/END comments and replace with new content
    var newReadmeData = readmeData.replace(
        new RegExp(supportedParkListStart + "[^<]*" + supportedParkListEnd, "g"),
        supportedParkListStart + "\n" + supportedParksMarkdown + "\n" + supportedParkListEnd
    );
    newReadmeData = newReadmeData.replace(
        new RegExp(timezoneListStart + "[^<]*" + timezoneListEnd, "g"),
        timezoneListStart + "\n" + timezoneMarkdown + "\n" + timezoneListEnd
    );
    newReadmeData = newReadmeData.replace(
        new RegExp(parkFeaturesListStart + "[^<]*" + parkFeaturesListEnd, "g"),
        parkFeaturesListStart + "\n" + parkFeaturesMarkdown + "\n" + parkFeaturesListEnd
    );

    // only write new README data if file contents have changed
    if (newReadmeData.trim() != readmeData.trim()) {
        // write back new readme file
        fs.writeFile(readmeFilePath, newReadmeData);
    }
});