const moment = require('moment-timezone');

const assert = require('assert');
const parks = require('../lib/index').Parks;

// use in-memory caching for unit tests
require('../lib/settings').Cache = ':memory:';


// define Mocha functions for eslint
/* global describe it */

// allow console for unit tests
/* eslint-disable no-console */

// catch any unhandled rejections
process.on('unhandledRejection', (error) => {
  console.log('! Unhandled Rejection!');
  console.log(error.message);
  console.log(error.stack);
  console.log('! Make sure rejections are handled cleanly !');
});

// optional environment variable to print out API results
const PRINTDATA = !!process.env.PRINTDATA;

function ValidateDateTime(obj, key) {
  assert(obj, 'Date parent is not a valid object');
  assert(obj[key], `Date field ${key} is not a valid object`);

  // parse date using momentjs
  const date = moment(obj[key]);
  // var yesterday = moment().subtract(1, "day");
  // make sure date is valid
  assert(date.isValid(), `Date ${obj[key]} is invalid`);
  // dates returned should be from today onwards
  // TODO - fix this logic, timezones mean that some parks will genuinely be open "yesterday"
  // assert(date.isAfter(yesterday), "Date " + obj[key] + " is before today (<= " + yesterday.format() + ")");
}

function ValidateType(obj, key, types) {
  // force types to an array

  assert(obj, 'Object passed to type validator is not valid');

  const objectType = typeof obj[key];

  let foundValidType = false;
  [].concat(types).forEach((t) => {
    // exit function if we find a required type
    if (objectType === t) {
      foundValidType = true;
    }
  });

  assert(foundValidType, `Object ${obj[key]} is not of any required types: ${JSON.stringify(types)} (got ${objectType})`);
}

function TestPark(park) {
  // === Test Wait Times Fetching ===
  describe('Get Park Wait Times', function TestParkWaitTimes() {
    // give each test 2 minutes to finish
    this.timeout(1000 * 60 * 2);

    let times = [];

    it('should not return an error fetching ride times', (done) => {
      park.GetWaitTimes().then((_times) => {
        times = _times;
        if (PRINTDATA) console.log(JSON.stringify(times, null, 2));
        done();
      }).catch((err) => {
        done(err);
        throw err;
      });
    });

    it('should have some ride data', () => {
      assert(times);

      // Sesame Place doesn't return data in downtime, so sorry. This is a bad unit test.
      if (park.name === 'Sesame Place') return;

      assert(times.length > 3, `Not enough ride times to be valid data (<= 3), actual: ${times.length}`);
    });

    it('should have an ID for every ride', () => {
      times.forEach((ride) => {
        ValidateType(ride, 'id', ['string', 'number']);
      });
    });

    it('should have a wait time for every operating ride (or should be null)', () => {
      times.forEach((ride) => {
        if (ride.status === 'Operating') {
          if (ride.waitTime !== null) {
            ValidateType(ride, 'waitTime', 'number');
          }
        }
      });
    });

    it('should have a name for every ride', () => {
      times.forEach((ride) => {
        ValidateType(ride, 'name', 'string');
      });
    });

    it('should have an active state for every ride', () => {
      times.forEach((ride) => {
        ValidateType(ride, 'active', 'boolean');
      });
    });

    it('should have a fastpass field for every ride', () => {
      times.forEach((ride) => {
        ValidateType(ride, 'fastPass', 'boolean');

        // if any ride claims to have FastPass, so should the park
        if (ride.fastPass) {
          assert(park.FastPass, 'If any ride has fastPass available, the park should also support FastPass');
        }
      });
    });

    it('should have a status field for every ride', () => {
      times.forEach((ride) => {
        ValidateType(ride, 'status', 'string');
        // status string should only ever be one of these three options
        assert(
          ride.status === 'Operating' || ride.status === 'Refurbishment' || ride.status === 'Closed' || ride.status === 'Down',
          `Invalid status string returned by ${ride.name}: ${ride.status}`,
        );
      });
    });

    it('should have matching status and active fields', () => {
      times.forEach((ride) => {
        // check status and active variables match up
        if (ride.status === 'Operating') assert(ride.active, 'Ride cannot have Operating status and be inactive');
        else assert(!ride.active, "Ride can't be active without Operating status");
      });
    });
  });

  // === Test Schedule Fetching ===
  describe('Get Schedule', function TestParkSchedule() {
    // give each test 2 minutes to finish
    this.timeout(1000 * 60 * 2);

    let schedule = [];
    it('should not error when fetching schedule', (done) => {
      park.GetOpeningTimes().then((_schedule) => {
        schedule = _schedule;

        if (PRINTDATA) console.log(JSON.stringify(schedule, null, 2));

        done();
      }).catch((err) => {
        done(err);
        throw err;
      });
    });

    it('should have schedule data', () => {
      assert(schedule);
      assert(schedule.length > 3, `Should be at least 4 schedule items. Found ${schedule.length}`);
    });

    it('should have a valid date for each schedule entry', () => {
      schedule.forEach((time) => {
        ValidateDateTime(time, 'date');
      });
    });

    // skip if this day is closed
    it('should have a valid opening time for each schedule entry', () => {
      schedule.forEach((time) => {
        if (time.type !== 'Closed') {
          ValidateDateTime(time, 'openingTime');
        }
      });
    });

    it('should have a valid closing time for each schedule entry', () => {
      for (let i = 0; i < schedule.length; i += 1) {
        schedule.forEach((time) => {
          if (time.type !== 'Closed') {
            ValidateDateTime(time, 'closingTime');
          }
        });
      }
    });

    // TODO - test the "special hours" array has valid data too
  });
}

function Run() {
  if (process.env.PARKID) {
    const parkID = process.env.PARKID;
    if (parks[parkID]) {
      // run tests against a single park
      describe(`Park ${parks[parkID].name}`, () => {
        TestPark(new parks[parkID]());
      });
      return;
    }
    // else park missing, just fall through to standard full test
  }

  // test all parks supported (and exposed) by the API
  Object.keys(parks).forEach((park) => {
    describe(`Park ${parks[park].name}`, () => {
      TestPark(new parks[park]());
    });
  });
}

Run();

/* eslint-enable no-console */
