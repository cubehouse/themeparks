// include core Park class
const Moment = require('moment-timezone');
const Park = require('../park');

/**
 * Implements the Hershey Park API framework.
 * @class
 * @extends Park
 */
class HersheyPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Hershey Park';
    options.timezone = options.timezone || 'America/New_York';
    options.latitude = options.latitude || 40.287681;
    options.longitude = options.longitude || -76.658579;

    options.useragent = 'Hersheypark Android App';

    // inherit from base class
    super(options);
  }

  FetchWaitTimes() {
    // grab ride names first
    return this.FetchRideNames().then(rideNames => this.HTTP({
      url: 'https://hpapp.hersheypa.com/v1/rides/wait',
    }).then((waitTimes) => {
      if (!waitTimes.wait) return Promise.reject(new Error('API missing expecting format'));

      const updatedRides = [];

      waitTimes.wait.forEach((ride) => {
        if (rideNames[ride.id]) {
          updatedRides.push(ride.id);

          this.UpdateRide(ride.id, {
            waitTime: ride.wait,
            name: rideNames[ride.id].name,
          });
        }
      });

      // closed rides are in this custom array
      waitTimes.closed.forEach((ride) => {
        if (rideNames[ride.id]) {
          updatedRides.push(ride.id);

          this.UpdateRide(ride.id, {
            waitTime: -1,
            name: rideNames[ride.id].name,
          });
        }
      });

      // fill in any missing rides as closed
      Object.keys(rideNames).forEach((rideId) => {
        const rideIdNum = Number(rideId);
        if (updatedRides.indexOf(rideIdNum) === -1) {
          this.UpdateRide(rideIdNum, {
            waitTime: -1,
            name: rideNames[rideIdNum].name,
          });
        }
      });

      return Promise.resolve();
    }));
  }

  FetchRideNames() {
    return this.Cache.Wrap('ridenames',
      () => this.HTTP({
        url: 'https://hpapp.hersheypa.com/v1/rides',
      }).then((rideData) => {
        const rideNames = {};
        rideData.forEach((ride) => {
          rideNames[ride.id] = {
            name: ride.name,
            latitude: ride.latitude,
            longitude: ride.longitude,
          };
        });
        return Promise.resolve(rideNames);
      }),
      60 * 60 * 24);
  }

  FetchOpeningTimes() {
    // get 30 days of opening hours
    const today = Moment().tz(this.Timezone);
    const endDate = today.clone().add(30, 'day');
    const todo = [];
    for (let day = today.clone(); day.isSameOrBefore(endDate); day.add(1, 'day')) {
      todo.push(day.clone());
    }

    // fetch each element in the todo array sequentially
    return todo.reduce((prev, nextDay) => prev.then(() => this.FetchDayOpeningHours(nextDay).then((hours) => {
      this.Schedule.SetDate(hours);
      return Promise.resolve();
    })), Promise.resolve());
  }

  /**
   * Fetch the opening hours for a specific day.
   * @param {MomentJS} date Date to request opening hours for (should be in correct timezone)
   */
  FetchDayOpeningHours(date) {
    if (!date) return Promise.reject(new Error('Invalid date object sent'));
    return this.Cache.Wrap(`openinghours_${date.format('YYYY-MM-DD')}`, () => this.HTTP({
      url: `https://hpapp.hersheypa.com/v1/hours/${date.startOf('day').format('X')}`,
    }).then((openingHours) => {
      let returnDate = {
        date,
        type: 'Closed',
      };
      openingHours.forEach((hours) => {
        if (hours.id === 9 || hours.id === 7 || hours.name === 'Hersheypark') {
          const matches = /([0-9]+:[0-9]{2})\s*([AP]M).*([0-9]+:[0-9]{2})\s*([AP]M)/.exec(hours.hours);
          if (matches) {
            returnDate = {
              openingTime: Moment.tz(`${date.format('YYYY-MM-DD')}T${matches[1]}${matches[2]}`, 'YYYY-MM-DDTHH:mmA', this.Timezone),
              closingTime: Moment.tz(`${date.format('YYYY-MM-DD')}T${matches[3]}${matches[4]}`, 'YYYY-MM-DDTHH:mmA', this.Timezone),
              type: 'Operating',
            };
          }
        }
      });

      return Promise.resolve(returnDate);
    }), 60 * 60 * 24 * 30);
  }
}

// export the class
module.exports = HersheyPark;
