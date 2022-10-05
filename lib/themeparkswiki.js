const fetch = require('node-fetch');
const entityConvert = require('./entity_convert');

/**
 * Represents a ThemeParksWiki API object
 * Can be used to fetch park opening times from the api.themeparks.wiki service
 */
class ThemeParksWikiPark {
  /**
   *
   * @param {object} options
   * @param {string} options.entityId The ThemeParksWiki entity ID for this park
   * @param {string} options.name The name of this park
   * @param {string} options.oldParkId The old v5 park ID for this park
   */
  constructor(options = {}) {
    this.name = options.name;
    if (!this.name) {
      throw new Error('ThemeParksWikiPark requires a name');
    }

    this.entityId = options.entityId;
    if (!this.entityId) {
      throw new Error('entityId is required');
    }

    this.oldParkId = options.oldParkId;
    if (!options.oldParkId) {
      throw new Error('oldParkId is required');
    }

    // optional calendar entity Id override
    if (options.calendarEntityId) {
      this.calendarEntityId = options.calendarEntityId;
    }
  }

  /**
   * Does this park support ride schedules?
   * @returns {boolean} true if this park supports ride schedules
   */
  get SupportsRideSchedules() {
    return false;
  }

  /**
   * Does this park support park opening times?
   * @returns {boolean} true if this park supports park opening times
   */
  get SupportsOpeningTimes() {
    return true;
  }

  /**
   * Does this park support ride wait times?
   * @returns {boolean} true if this park supports ride wait times
   */
  get SupportsWaitTimes() {
    return true;
  }

  /**
   * Does this park support ride fastpass?
   * @returns {boolean} true if this park supports ride fastpass
   */
  get FastPassReturnTimes() {
    return false;
  }

  /**
   * Does this park support ride fastpass?
   * @returns {boolean} true if this park supports ride fastpass
   */
  get FastPass() {
    return false;
  }

  /**
   * Return how many possible opening time schedule days will be returned
   * Numer can be less if API doesn't have enough data
   * @returns {number} number of days of opening time schedule to return
   */
  get GetNumScheduleDays() {
    return 30;
  }

  /**
   * Fetch attraction wait times for this park
   * @returns {Promise} A promise that resolves with an array of ride objects
   * @example
   * [{
   *   id: 'rideid',
   *   name: 'Ride Name',
   *   active: true,
   *   waitTime: 10,
   *   status: 'Operating',
   *   lastUpdate: '2018-01-01T00:00:00.000Z',
   *   meta: {
   *     type: 'ATTACTION',
   *     entityId: 'themeparkswiki-entity-id',
   *   },
   * }]
   */
  GetWaitTimes() {
    const acceptedEntityTypes = ['ATTRACTION', 'RESTAURANT'];
    return fetch(`https://api.themeparks.wiki/v1/entity/${this.entityId}/live`).then((response) => {
      return response.json();
    }).then((data) => {
      return data.liveData.filter((x) => {
        return acceptedEntityTypes.indexOf(x.entityType) >= 0;
      }).map((ride) => {
        if (!ride.status) {
          return null;
        }
        const hasFastpass = !!(ride.queue && (ride.queue.RETURN_TIME || ride.queue.PAID_RETURN_TIME));
        // eslint-disable-next-line no-nested-ternary
        const waitTime = (ride.queue && ride.queue.STANDBY) ? ride.queue.STANDBY.waitTime : (
          // no standby queue, deduce waitTime from status (to match v5 style)
          ride.status === 'OPERATING' ? 0 : null
        );
        return {
          id: entityConvert.convert(ride.id, this.oldParkId),
          name: ride.name,
          waitTime,
          status: ride.status.charAt(0).toUpperCase() + ride.status.slice(1).toLowerCase(),
          active: ride.status === 'OPERATING',
          fastPass: hasFastpass,
          meta: {
            type: ride.entityType,
            entityId: ride.id,
          },
          lastUpdate: new Date(ride.lastUpdated),
        };
      }).filter((x) => !!x);
    });
  }

  /**
   * Fetch opening times for this park
   * @returns {Promise} A promise that resolves with an array of opening time objects
   */
  GetOpeningTimes() {
    const entityForSchedules = this.calendarEntityId || this.entityId;
    return fetch(`https://api.themeparks.wiki/v1/entity/${entityForSchedules}/schedule`).then((response) => {
      return response.json();
    }).then((data) => {
      // split data into regular opening times and "other"
      const openingTimes = data.schedule.filter((x) => {
        return x.type === 'OPERATING';
      });
      const specialTimes = data.schedule.filter((x) => {
        return x.type !== 'OPERATING';
      });

      const dates = openingTimes.map((x) => {
        const d = {
          date: x.date,
          openingTime: x.openingTime,
          closingTime: x.closingTime,
          type: x.type,
          special: [],
        };
        if (x.description) {
          d.description = x.description;
        }
        return d;
      });

      // inject special times into dates
      specialTimes.forEach((x) => {
        const date = dates.find((d) => {
          return d.date === x.date;
        });
        if (date) {
          const d = {
            date: x.date,
            openingTime: x.openingTime,
            closingTime: x.closingTime,
            type: x.type,
          };

          if (x.description) {
            d.description = x.description;
          }

          date.special.push(d);
        }
      });

      return dates;
    });
  }
}

module.exports = ThemeParksWikiPark;
