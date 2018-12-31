// allow console for unit tests
/* eslint-disable no-console */

const fs = require('fs');
const util = require('util');
const HTTP = require('../lib/http');
const SixFlagsPark = require('../lib/sixflags/sixflagsbase');

console.log('# This script generated the SixFlags park files automatically');
console.log('# There are so many parks by SixFlags, this is a far more convenient way of updating the codebase!');
console.log('');

// ADD THIS - get an API key from timezoned, and put it here to run this script
const timezonedbapikey = process.env.APIKEY || '';

function GetTimeZone(lat, long) {
  return HTTP({
    url: 'http://api.timezonedb.com/v2/get-time-zone',
    data: {
      key: timezonedbapikey,
      format: 'json',
      lat,
      lng: long,
      by: 'position',
    },
  }).then((data) => {
    console.log(`Got timezone ${data.zoneName}`);
    return Promise.resolve(data.zoneName);
  });
}

function CreateParkString(park) {
  const parkID = park.name.replace(/é/g, 'e').replace(/[^a-zA-Z0-9]/g, '');
  const filename = parkID.toLowerCase();
  const filepath = `${__dirname}/../lib/sixflags/${filename}.js`;

  // skip any parks that already exist
  if (fs.existsSync(filepath)) {
    return Promise.resolve(parkID);
  }

  const long = park.entranceLocation ? park.entranceLocation.longitude : park.location.longitude;
  const lat = park.entranceLocation ? park.entranceLocation.latitude : park.location.latitude;

  return GetTimeZone(lat, long).then((timezone) => {
    console.log(`Filling in ${parkID}`);

    let parkString = `const SixFlagsPark = require('./sixflagsbase');

/**
 * ${park.name}
 * @class
 * @extends SixFlagsPark
 */
class ${parkID} extends SixFlagsPark {
  /**
   * Create a new ${parkID} object
   */
  constructor(options = {}) {
    options.name = options.name || '${park.name}';
    options.timezone = options.timezone || '${timezone}';

    // set park's location as it's entrance
    options.latitude = options.latitude || ${lat};
    options.longitude = options.longitude || ${long};

    options.park_id = options.park_id || '${park.parkId}';

    // inherit from base class
    super(options);
  }
}

module.exports = ${parkID};
`;
    // use proper newlines
    parkString = parkString.replace(/[\n\r]/g, '\r\n');

    // write file
    console.log(`Writing file ${filename}.js`);
    return util.promisify(fs.writeFile)(filepath, parkString).then(() => Promise.resolve(parkID));
  });
}

if (!timezonedbapikey) {
  console.error("Missing Timezoned API key, this is needed for figuring out each park's timezone from it's geo location");
  console.error('Please fill in the variable in the script and re-run');
  process.exit(0);
}
// make pretend SixFlagsPark to get API access setup
const sf = new SixFlagsPark({
  park_id: 1,
  name: 'Six Flags',
  latitude: 33.7675,
  longitude: -84.5514,
  timezone: 'Europe/London',
});

// request park list from API
sf.GetAPIUrl({
  url: `${sf.APIBase}park`,
}).then((data) => {
  const todo = [];
  data.parks.forEach((park) => {
    todo.push(park);
  });

  const requires = [];

  const step = () => {
    const c = todo.shift();

    if (!c) {
      console.log('');
      requires.forEach((r) => {
        console.log(`const ${r} = require('./sixflags/${r.toLowerCase()}');`);
      });
      console.log('');
      requires.forEach((r) => {
        console.log(`${r},`);
      });
      return;
    }

    console.log(' ');
    console.log(`Processing ${c.name}`);

    // write park file
    CreateParkString(c).then((requirename) => {
      requires.push(requirename);

      process.nextTick(step);
    }, console.error);
  };
  process.nextTick(step);
});

/* eslint-enable no-console */
