// this script generates the timezone and supported parks lists found in the README.md
const fs = require('fs');
const path = require('path');
const ThemeParks = require('../lib/index');

let timezoneMarkdown = '\n';
let supportedParksMarkdown = `\n**${ThemeParks.AllParks.length}** Parks Supported\n\n`;
let parkFeaturesMarkdown = `|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
`;

// search for these tags to inject our new content
const supportedParkListStart = '<!-- START_SUPPORTED_PARKS_LIST -->';
const supportedParkListEnd = '<!-- END_SUPPORTED_PARKS_LIST -->';
const timezoneListStart = '<!-- START_PARK_TIMEZONE_LIST -->';
const timezoneListEnd = '<!-- END_PARK_TIMEZONE_LIST -->';
const parkFeaturesListStart = '<!-- START_PARK_FEATURES_SUPPORTED -->';
const parkFeaturesListEnd = '<!-- END_PARK_FEATURES_SUPPORTED -->';

// local path to the README file
const readmeFilePath = path.join(__dirname, '..', 'README.md');

// symbols to use for parks supporting/not-supporting features
const featureAvailable = '&#10003;';
const featureUnavailable = '&#10007;';

// construct our park objects and keep them in memory for fast access later
const Parks = {};
Object.keys(ThemeParks.Parks).forEach((park) => {
  Parks[park] = new ThemeParks.Parks[park]();
});

Object.keys(Parks).forEach((park) => {
  const parkObj = Parks[park];
  // print out each supported park object name and "pretty name"
  supportedParksMarkdown += `* ${parkObj.Name} (ThemeParks.Parks.${park})\n`;
  // print each park's timezone into timezoneMarkdown
  timezoneMarkdown += `* ${parkObj.Name} [${parkObj.LocationString}]: (${parkObj.Timezone})\n`;

  parkFeaturesMarkdown += `|${parkObj.Name}|${parkObj.SupportsWaitTimes ? featureAvailable : featureUnavailable}|${parkObj.SupportsOpeningTimes ? featureAvailable : featureUnavailable}|${parkObj.SupportsRideSchedules ? featureAvailable : featureUnavailable}|\n`;
});

// read in README.md
fs.readFile(readmeFilePath, (err, readmeFileData) => {
  // convert buffer to string
  const readmeData = readmeFileData.toString();

  // find START/END comments and replace with new content
  let newReadmeData = readmeData.replace(
    new RegExp(`${supportedParkListStart}[^<]*${supportedParkListEnd}`, 'g'),
    `${supportedParkListStart}\n${supportedParksMarkdown}\n${supportedParkListEnd}`
  );
  newReadmeData = newReadmeData.replace(
    new RegExp(`${timezoneListStart}[^<]*${timezoneListEnd}`, 'g'),
    `${timezoneListStart}\n${timezoneMarkdown}\n${timezoneListEnd}`
  );
  newReadmeData = newReadmeData.replace(
    new RegExp(`${parkFeaturesListStart}[^<]*${parkFeaturesListEnd}`, 'g'),
    `${parkFeaturesListStart}\n${parkFeaturesMarkdown}\n${parkFeaturesListEnd}`
  );

  // only write new README data if file contents have changed
  if (newReadmeData.trim() !== readmeData.trim()) {
    // write back new readme file
    fs.writeFile(readmeFilePath, newReadmeData, () => {
      process.exit(0);
    });
  }
});
