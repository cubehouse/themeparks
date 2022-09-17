const fetch = require('node-fetch');

class ThemeParksWikiPark {
    constructor(options = {}) {
        this.name = options.name;
        if (!this.name) {
            throw new Error('ThemeParksWikiPark requires a name');
        }

        this.entityId = options.entityId;
        if (!this.entityId) {
            throw new Error('entityId is required');
        }
    }

    get SupportsRideSchedules() {
        return false;
    }

    get SupportsOpeningTimes() {
        return true;
    }

    get SupportsWaitTimes() {
        return true;
    }

    get FastPassReturnTimes() {
        return false;
    }

    get FastPass() {
        return false;
    }

    get GetNumScheduleDays() {
        return 30;
    }

    GetWaitTimes() {
        return fetch(`https://api.themeparks.wiki/v1/entity/${this.entityId}/live`).then((response) => {
            return response.json();
        }).then((data) => {
            return data.liveData.map((ride) => {
                const hasFastpass = !!(ride.queue && (ride.queue['RETURN_TIME'] || ride.queue['PAID_RETURN_TIME']));
                const waitTime = (ride.queue && ride.queue['STANDBY']) ? ride.queue['STANDBY'].waitTime : (
                    // no standby queue, deduce waitTime from status (to match v5 style)
                    ride.status === 'OPERATING' ? 0 : null
                );
                return {
                    id: ride.externalId,
                    name: ride.name,
                    waitTime: waitTime,
                    status: ride.status.charAt(0).toUpperCase() + ride.status.slice(1).toLowerCase(),
                    active: ride.status === 'OPERATING',
                    fastPass: hasFastpass,
                    meta: {
                        type: ride.entityType,
                        entityId: ride.id,
                    },
                    lastUpdate: new Date(ride.lastUpdated),
                };
            });
        });
    }

    GetOpeningTimes() {
        return fetch(`https://api.themeparks.wiki/v1/entity/${this.entityId}/schedule`).then((response) => {
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
