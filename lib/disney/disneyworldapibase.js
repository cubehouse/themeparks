const Moment = require('moment-timezone');
const Park = require('../park');
const DisneyUtil = require('./disneyUtil');

// maintain a global object of resort facilities
const DisneyFacilities = require('./disneyFacilityChannel');
// object of resort ID -> facility channel object
const FacilityChannels = {};

// build our own custom channel to get facility statuses
const DisneyChannel = require('./couchbaseChannelDisney');
// again, there is one channel per resort, so share one between all the parks per-resort
const FacilityStatusChannels = {};

// private symbols
const sResortCode = Symbol('Resort Code');
const sParkID = Symbol('Park ID');
const sResortID = Symbol('Resort ID');
const sResortRegion = Symbol('Resort Region');
const sAccessTokenBody = Symbol('Access Token Body Data');
const sAPIAuthURL = Symbol('API Auth Token URL');
const sAPIBaseURL = Symbol('API Base URL');
const sAppID = Symbol('App ID');
const sOfflineFacilities = Symbol('Use Offline Facilities Database');

class DisneyPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Disney Park';

    super(options);

    this[sAccessTokenBody] = options.accessTokenBody || 'grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD';
    this[sAPIAuthURL] = options.apiAuthURL || 'https://authorization.go.com/token';
    this[sAPIBaseURL] = options.apiBaseURL || 'https://api.wdpro.disney.go.com/';

    this[sAppID] = options.appID || 'WDW-MDX-ANDROID-4.12';

    if (options.parkId === undefined) throw new Error('No parkId passed to Disney Park constructor');
    this[sParkID] = options.parkId;

    if (options.resortId === undefined) throw new Error('No resortId passed to Disney Park constructor');
    this[sResortID] = options.resortId;

    if (options.resortCode === undefined) throw new Error('No resortCode passed to Disney Park constructor');
    this[sResortCode] = options.resortCode;

    this[sResortRegion] = options.resortRegion || 'us';

    this[sOfflineFacilities] = options.offlineFacilities || false;

    // setup facility channel for this resort
    if (FacilityChannels[this[sResortCode]] === undefined) {
      // create facility channel if it doesn't already exist
      FacilityChannels[this[sResortCode]] = new DisneyFacilities({
        resortId: this[sResortCode],
        useOffline: this[sOfflineFacilities],
      });
    }

    if (FacilityStatusChannels[this[sResortCode]] === undefined) {
      FacilityStatusChannels[this[sResortCode]] = new DisneyChannel({
        dbName: `facilitystatus_${this[sResortCode]}`,
        channel: `${this[sResortCode]}.facilitystatus.1_0`,
      });

      /* eslint-disable no-console */
      FacilityStatusChannels[this[sResortCode]].on('error', console.error);
      /* eslint-enable no-console */
    }
  }

  // return an object of facility ID -> name
  GetFacilityData(facilityIDs) {
    return this.FacilityChannel.GetFacilitiesData(facilityIDs, {
      // match our park
      park_id: this[sParkID],
    }).then((facilityDocs) => {
      const rideData = {};
      facilityDocs.forEach((facility) => {
        rideData[DisneyUtil.CleanID(facility.id)] = {
          name: facility.name,
          fastpass: facility.fastPassPlus || facility.fastPass || false, // sometimes it's fastPassPlus (wdw) or fastPass (dl)
          // some extra data that's nice for ride metadata
          area: facility.ancestorLand || null,
          longitude: Number(facility.longitude),
          latitude: Number(facility.latitude),
        };
      });
      return Promise.resolve(rideData);
    });
  }

  FetchTodaysRefurbishments() {
    // figure out what day we're on
    return this.GetOpeningTimes().then(() => {
      const todaysDate = this.Schedule.GetCurrentParkSchedule().date;

      // don't worry about starting the facility channel here, this.FetchOpeningTimes() above will have already done that for us
      return this.FacilityChannel.GetCalendarDates([todaysDate]).then((calendarDocs) => {
        if (!calendarDocs || calendarDocs.length === 0 || !calendarDocs[0].refurbishments) {
          return Promise.resolve({
            refurbishments: [],
            closed: [],
          });
        }

        const closedRideIDs = [];
        calendarDocs[0].closed.forEach((closed) => {
          closedRideIDs.push(DisneyUtil.CleanID(closed.facilityId));
        });
        const refurbRideIDs = [];
        calendarDocs[0].refurbishments.forEach((refurb) => {
          refurbRideIDs.push(DisneyUtil.CleanID(refurb.facilityId));
        });

        // get today's calendar data, we're looking for rides down for refurbishment
        return Promise.resolve({
          refurbishments: refurbRideIDs,
          closed: closedRideIDs,
        });
      });
    });
  }

  FetchWaitTimes() {
    // make sure the channel is started and synced
    return this.FacilityStatusChannel.Start().then(() => this.FacilityStatusChannel.GetAllDocuments()
      .then(docs => this.FetchTodaysRefurbishments()
        .then((refurbishedRides) => {
          // build a list of wait times and facility documents to fetch
          const docsToFetch = [];
          const waitTimes = {};
          const metadata = {};

          docs.forEach((rideEntry) => {
            const ride = rideEntry.doc;
            docsToFetch.push(ride.id);

            const cleanRideID = DisneyUtil.CleanID(ride.id);

            if (refurbishedRides.refurbishments.indexOf(cleanRideID) >= 0) {
              // our ride is in our refurbishment list, return -3 for refurb
              waitTimes[cleanRideID] = -3;
            } else if (refurbishedRides.closed.indexOf(cleanRideID) >= 0) {
              // if the calendar has marked this attraction as closed, return early with Closed state
              waitTimes[cleanRideID] = -1;
            } else if (ride.status === 'Down') {
              waitTimes[cleanRideID] = -2;
            } else if (ride.status === 'Closed') {
              waitTimes[cleanRideID] = -1;
            } else if (ride.status === 'Operating') {
              waitTimes[cleanRideID] = ride.waitMinutes || 0;
            }

            metadata[cleanRideID] = {};

            // add fastpass availability slot if present
            if (ride.fastPassAvailable) {
              if (ride.fastPassEndTime !== '' && ride.fastPassStartTime.indexOf('not available') < 0) {
                metadata[cleanRideID].fastPassStartTime = ride.fastPassStartTime;
                metadata[cleanRideID].fastPassEndTime = ride.fastPassEndTime;
              } else {
                metadata[cleanRideID].fastPassStartTime = null;
                metadata[cleanRideID].fastPassEndTime = null;
              }
            }

            // add any extra metadata we have available
            metadata[cleanRideID].singleRider = ride.singleRider;
          });

          // get facility data for each attraction to match up our wait times to our park and apply their ride names
          return this.GetFacilityData(docsToFetch).then((facilityData) => {
            Object.keys(facilityData).forEach((facilityId) => {
              const rideMetaObject = {};
              if (metadata[facilityId]) {
                Object.keys(metadata[facilityId]).forEach((k) => {
                  rideMetaObject[k] = metadata[facilityId][k];
                });
              }

              rideMetaObject.area = facilityData[facilityId].area || undefined;
              rideMetaObject.longitude = facilityData[facilityId].longitude || undefined;
              rideMetaObject.latitude = facilityData[facilityId].latitude || undefined;
              rideMetaObject.photoPass = facilityData[facilityId].photoPass || undefined;
              rideMetaObject.singleRider = (metadata[facilityId] ? metadata[facilityId].singleRider : null) || facilityData[facilityId].singleRider || undefined;

              this.UpdateRide(facilityId, {
                name: facilityData[facilityId].name,
                waitTime: waitTimes[facilityId] !== undefined ? waitTimes[facilityId] : -1,
                fastPass: facilityData[facilityId].fastpass,
                meta: rideMetaObject,
              });
            });

            return Promise.resolve();
          });
        })));
  }

  // Disney World API parks support Fast Pass
  get FastPass() {
    return true;
  }

  FetchOpeningTimes() {
    // make sure the channel is started and synced
    return this.FacilityChannel.Start().then(() => {
      const dates = [];
      const endFillDate = Moment().tz(this.Timezone).add(this.GetNumScheduleDays + 1, 'days');
      for (let m = Moment().tz(this.Timezone).subtract(1, 'days'); m.isBefore(endFillDate); m.add(1, 'day')) {
        dates.push(m.format('YYYY-MM-DD'));
      }

      return this.FacilityChannel.GetCalendarDates(dates).then((docs) => {
        docs.forEach((doc) => {
          // find our park
          doc.parkHours.forEach((parkHours) => {
            if (DisneyUtil.CleanID(parkHours.facilityId) === this[sParkID]) {
              this.Schedule.SetDate({
                date: Moment.tz(doc.parsedDate, 'YYYY-MM-DD', this.Timezone),
                openingTime: Moment(parkHours.startTime, 'YYYY-MM-DDTHH:mm:ssZ').tz(this.Timezone),
                closingTime: Moment(parkHours.endTime, 'YYYY-MM-DDTHH:mm:ssZ').tz(this.Timezone),
                type: parkHours.scheduleType,
                specialHours: parkHours.scheduleType !== 'Operating',
              });
            }
          });
        });

        return Promise.resolve();
      });
    });
  }

  /**
   * Get the couchbase lite channel for this park's resort facilities
   * @returns {FacilityChannel} Disney Park facility live channel
   */
  get FacilityChannel() {
    return FacilityChannels[this[sResortCode]];
  }

  /**
   * Get the couchbase lite channel for this park's resort facility statuses
   * @returns {CouchbaseChannelDisney} Disney live channel
   */
  get FacilityStatusChannel() {
    return FacilityStatusChannels[this[sResortCode]];
  }

  /**
   * Get the park's resort code
   */
  get GetResortCode() {
    return this[sResortCode];
  }

  /**
   * Get the park's resort ID
   */
  get GetResortID() {
    return this[sResortID];
  }

  /**
   * Get this park's region code
   */
  get GetResortRegion() {
    return this[sResortRegion];
  }

  /**
   * Get this park's park ID
   */
  get GetParkID() {
    return this[sParkID];
  }

  /**
   * Park API Base URL
   */
  get GetAPIBase() {
    return this[sAPIBaseURL];
  }

  /**
   * Get an access token for accessing the non-live portions of the WDW API
   */
  GetAccessToken() {
    let expiresIn;
    return this.Cache.Wrap('accesstoken',
      () => this.HTTP({
        url: this[sAPIAuthURL],
        method: 'POST',
        body: this[sAccessTokenBody],
        // Disney API doesn't want to return as application/JSON, so we'll manually parse it into a nice object
        forceJSON: true,
      }).then((body) => {
        if (!body.access_token) {
          this.Log('Error body', body);
          return Promise.reject(new Error('Returned access token data missing access_token'));
        }
        if (!body.expires_in) {
          this.Log('Error body', body);
          return Promise.reject(new Error('Returned access token data missing expires_in'));
        }

        // parse expires_in into an int
        const ttlExpiresIn = parseInt(body.expires_in, 10);

        // The ttlExpiresIn is the maximum time the access_token is valid.
        // It's possible for the token to be given back just moments before
        // it is invalid. Therefore we should force the ttl value in the
        // cache lower than this value so requests don't fail.
        expiresIn = Math.ceil(ttlExpiresIn * 0.90);

        this.Log(`Fetched new WDW access_token ${body.access_token}, expires in ${body.expires_in}, caching for a maximum of ${expiresIn}`);

        // return our new access token
        return Promise.resolve(body.access_token);
      }),
      () => Promise.resolve(expiresIn));
  }

  /**
   * Fetch a URL from the Disney API
   */
  GetAPIUrl(requestObject) {
    // get access token
    return this.GetAccessToken().then((accessToken) => {
      // make sure headers exist if they weren't set already
      if (!requestObject.headers) requestObject.headers = [];

      // add our auth headers
      requestObject.headers.Authorization = `BEARER ${accessToken}`;
      requestObject.headers.Accept = 'application/json;apiversion=1';
      requestObject.headers['X-Conversation-Id'] = 'WDPRO-MOBILE.MDX.CLIENT-PROD';
      requestObject.headers['X-App-Id'] = this[sAppID];
      requestObject.headers['X-Correlation-ID'] = Date.now();

      // make sure we get JSON back
      requestObject.forceJSON = true;

      // send network request
      return this.HTTP(requestObject);
    });
  }
}

module.exports = DisneyPark;
