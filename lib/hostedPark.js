const Moment = require('moment-timezone');
const Park = require('./park');

class HostedPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Hosted Park';
    super(options);
  }

  get ParkAPIID() {
    return this.constructor.name;
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `https://api.themeparks.wiki/preview/parks/${this.ParkAPIID}/waittime`,
    }).then((data) => {
      data.forEach((ride) => {
        this.UpdateRide(ride.id.slice(ride.id.indexOf('_') + 1), ride);
      });
    });
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: `https://api.themeparks.wiki/preview/parks/${this.ParkAPIID}/calendar`,
    }).then((data) => {
      data.forEach((date) => {
        this.Schedule.SetDate({
          date: Moment(date.date).tz(this.Timezone),
          openingTime: Moment(date.openingTime).tz(this.Timezone),
          closingTime: Moment(date.closingTime).tz(this.Timezone),
          type: date.type,
        });

        if (date.special) {
          date.special.forEach((special) => {
            this.Schedule.SetDate({
              date: Moment(date.date).tz(this.Timezone),
              openingTime: Moment(special.openingTime).tz(this.Timezone),
              closingTime: Moment(special.closingTime).tz(this.Timezone),
              type: special.type,
              specialHours: true,
            });
          });
        }
      });
    });
  }
}

module.exports = HostedPark;
