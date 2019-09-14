const uuid = require('uuid');
// zip lib to extract data
const unzip = require('yauzl');

const Moment = require('moment');

// include core Park class
const Park = require('../park');

const sApiBase = Symbol('Merlin Park API Base URL');
const sAppBuild = Symbol('Merlin Park APP Build Number');
const sAppVersion = Symbol('Merlin Park API Version');
const sDeviceID = Symbol('Merlin Park API Device ID');
const sApiKey = Symbol('Merlin Park API Key');
const sDataVersion = Symbol('Merlin Park API Initial Data Version');
const sFallbackData = Symbol('Merlin Park API Fallback Data Cache');

// static functions
function ReadZipFile(zip, file) {
  return new Promise((resolve, reject) => {
    let data = '';
    // eslint-disable-next-line consistent-return
    zip.openReadStream(file, (err, readStream) => {
      if (err) {
        return reject(err);
      }

      readStream.on('data', (chunk) => {
        data += chunk;
      }).on('end', () => {
        // parse JSON data
        try {
          data = JSON.parse(data);
          return resolve(data);
        } catch (e) {
          return reject(new Error(`JSON parse error extracting ${file.fileName}: ${e}`));
        }
      });
    });
  });
}

/**
 * Implements the Merlin Park API framework.
 * @class
 * @extends Park
 */
class MerlinPark extends Park {
  /**
   * Create new MerlinPark Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   * @param {String} [options.apiKey]
   * @param {String} [options.appBuild]
   * @param {String} [options.appVersion]
   * @param {String} [options.deviceID]
   */
  constructor(options = {}) {
    options.name = options.name || 'Merlin Park';

    // Use the Android app's user-agent
    options.useragent = options.useragent || 'okhttp/3.9.0';

    // inherit from base class
    super(options);

    // can only construct actual parks, not the MerlinPark object itself
    //  see http://ilikekillnerds.com/2015/06/abstract-classes-in-javascript/
    if (this.constructor === MerlinPark) {
      throw new TypeError('Cannot create MerlinPark object directly, only implementations of MerlinPark');
    }

    if (!options.apiKey) throw new Error('Merlin Parks require an API key');
    this[sApiKey] = options.apiKey;
    if (!options.initialDataVersion) throw new Error('Merlin Parks require an initial data version to fetch ride names');
    this[sDataVersion] = options.initialDataVersion;

    // optional fallback data
    this[sFallbackData] = options.fallbackData;

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://api.attractions.io/v1/';
    // API settings
    this[sAppBuild] = options.appBuild || '267';
    this[sAppVersion] = options.appVersion || '5.1.7';
    this[sDeviceID] = options.deviceID || 'ca3ff252-ag6f-5f07-a5ed-3ff525ac4434';
  }

  /**
   * Get an API token from cache or through registering a new device
   */
  RegisterDevice() {
    // fetch new device token if we haven't already got one in our cache
    return this.Cache.Wrap('device_token', () => {
      // first, get (or generate) a new user ID
      return this.GenerateUserID().then((userID) => {
        // request token for further API requests
        return this.HTTP({
          url: `${this[sApiBase]}installation`,
          method: 'POST',
          data: {
            user_identifier: userID,
            device_identifier: '123',
            app_version: this[sAppVersion],
            app_build: this[sAppBuild],
          },
          headers: {
            'occasio-platform': 'Android',
            'occasio-platform-version': '9',
            authorization: `Attractions-Io api-key="${this[sApiKey]}"`,
            'occasio-data-version': this.DataVersion,
            'occasio-native-version': '2.1',
            'occasio-app-version': this[sAppVersion],
            'occasio-app-build': this[sAppBuild],
            date: Moment().format(),
          },
        }).then((data) => {
          if (data && data.token) {
            return Promise.resolve(data.token);
          }

          return Promise.reject(new Error('No data returned'));
        });
      });
    }, 86400000);
  }

  /**
   * Generate (or fetch a cached) user ID
   */
  GenerateUserID() {
    return this.Cache.Wrap('user_id', () => {
      // generate new UUID if cache hit fails
      const newUserID = uuid();

      this.Log(`Generated new UserID ${newUserID}`);

      return Promise.resolve(newUserID);
    }, 43200000);
  }

  /**
   * Get the API Base URL
   */
  get APIBase() {
    return this[sApiBase];
  }

  /**
   * Fetch Wait times
   * @returns {Promise}
   */
  FetchWaitTimes() {
    // first, make sure we have our park data (ride names etc.)
    return this.GetParkData().then((rideNames) => {
      // fetch wait times
      return this.MakeAPICall({
        url: `${this.APIBase}live-data`,
      }).then((data) => {
        data.entities.Item.records.forEach((ride) => {
          if (rideNames[ride._id]) {
            this.UpdateRide(ride._id, {
              name: rideNames[ride._id],
              waitTime: ride.IsOpen ? (ride.QueueTime / 60) : -1,
            });
          }
        });

        return Promise.resolve();
      });
    });
  }

  /**
   * Get (or fetch new) park data
   */
  GetParkData() {
    return this.Cache.Wrap('data', () => {
      // fetch fresh/updated data
      return this.FetchParkData(this.DataVersion).then((data) => {
        const rideData = {};
        data.Item.forEach((item) => {
          rideData[item._id] = item.Name;
        });
        return Promise.resolve(rideData);
      });
    }, 43200000);
  }

  /**
   * Get the latest data version timestamp
   */
  get DataVersion() {
    return this[sDataVersion];
  }

  /**
   * Fetch/Sync park data
   * Warning: full sync is ~30MB
   */
  FetchParkData(version) {
    // this is a recursive function, and will keep fetching data until we get no more deltas to resolve
    //  note: we should attempt to periodically update the initialVersion to cut down on these requests

    // remember this as the latest version for next fetch
    this[sDataVersion] = version;

    // Fetch data
    return this.MakeAPICall({
      url: `${this[sApiBase]}data`,
      data: {
        version,
      },
      // we want the full response to get the status code
      returnFullResponse: true,
    }).then((response) => {
      if (response.statusCode === 304 || response.statusCode === 303) {
        // reject
        this.Log(`Reached status ${response.statusCode} accessing data version ${version}`);
        return Promise.reject();
      }

      this.Log(`Received data for version ${version}`);

      return new Promise((resolve, reject) => {
        // unzip data
        unzip.fromBuffer(response.body, {
          lazyEntries: true,
          // eslint-disable-next-line consistent-return
        }, (err, zip) => {
          let manifestData;
          let recordsData;

          this.Log('Parsing zip file');
          if (err) {
            return reject(err);
          }

          // eslint-disable-next-line consistent-return
          const GetNextEntry = () => {
            if (manifestData && recordsData) {
              // got both the files we need, stop reading the zip file

              // fetch next data URL
              if (manifestData.version) {
                this.FetchParkData(manifestData.version).catch(() => {
                  // as soon as we hit an error, return the current level or records data
                  return resolve(recordsData);
                });
              } else {
                return resolve(recordsData);
              }
            } else {
              // read next entry
              zip.readEntry();
            }
          };

          zip.on('entry', (file) => {
            this.Log(`Got zip file ${file.fileName}`);

            // look for the two files we want
            if (file.fileName === 'manifest.json') {
              ReadZipFile(zip, file).then((data) => {
                manifestData = data;

                GetNextEntry();
              });
            } else if (file.fileName === 'records.json') {
              ReadZipFile(zip, file).then((data) => {
                recordsData = data;

                GetNextEntry();
              });
            } else {
              GetNextEntry();
            }
          });

          // start reading file...
          zip.readEntry();
        });
      });
    }).catch((err) => {
      if (this[sFallbackData]) {
        return this[sFallbackData];
      }

      return Promise.reject(err);
    });
  }

  /**
   * Get default fallback data for this Merlin Park
   */
  get FallbackData() {
    return this[sFallbackData];
  }

  /**
   * Generic API request function, will sort out API token and send auth headers
   * @param {*} options
   * @param {String} options.url URL to access
   * @param {String} [options.method=GET] method to use
   * @param {Object} [options.data={}] data/query string to use
   */
  MakeAPICall(options = {
    method: 'GET',
    data: {},
  }) {
    // get token
    return this.RegisterDevice().then((token) => {
      // inject auth headers into request headers
      if (!options.headers) {
        options.headers = {};
      }
      options.headers['occasio-platform'] = 'Android';
      options.headers['occasio-platform-version'] = '9';
      options.headers['occasio-data-version'] = this.DataVersion;
      options.headers['occasio-native-version'] = '2.1';
      options.headers['occasio-app-version'] = this[sAppVersion];
      options.headers['occasio-app-build'] = this[sAppBuild];
      options.headers.date = Moment().format();
      options.headers.authorization = `Attractions-Io api-key="${this[sApiKey]}", installation-token="${token}"`;

      // make API call
      return this.HTTP(options);
    });
  }

  applyDateRange(startDate, endDate, isOpen, openingHours) {
    if (!startDate || !endDate) {
      this.Log(`Unable to process the range ${startDate} to ${endDate}`);
      return;
    }

    let validRange = true;
    const range = {
      startDate: Moment(startDate, 'YYYY-MM-DDTHH:mm:ss').startOf('day'),
      endDate: Moment(endDate, 'YYYY-MM-DDTHH:mm:ss').endOf('day'),
      type: isOpen ? 'Operating' : 'Closed',
    };

    this.Log(`Processing ${range.startDate} => ${range.endDate}`);

    if (isOpen) {
      const dateResult = /([0-9:]+\s?[ap]m)\s*-\s*([0-9:]+\s?[ap]m)/gi.exec(openingHours.replace(/\./g, ':'));
      // figure out opening times for this range
      if (dateResult) {
        let parseString = 'H:mma';
        if (dateResult[1].indexOf(':') < 0) {
          parseString = 'Ha';
        }
        range.openingTime = Moment(dateResult[1].replace(/ /g, ''), parseString);
        range.closingTime = Moment(dateResult[2].replace(/ /g, ''), parseString);
      } else {
        // try shorthand format too, in case someone entered the times in badly
        const shortHandResult = /([0-9]+)\s*-\s*([0-9]+)/gi.exec(openingHours.replace(/\./g, ':'));
        if (shortHandResult) {
          range.openingTime = Moment(`${shortHandResult[1]}:00am`, 'H:mma');
          range.closingTime = Moment(`${shortHandResult[2]}:00pm`, 'H:mma');
        } else {
          validRange = false;
          this.Log(`Unable to understand hour format: ${openingHours}`);
        }
      }
    }

    if (validRange) {
      this.Schedule.SetRange(range);
    }
  }

  /**
   * Fetch Merlin Park opening time data
   * @returns {Promise}
   */
  FetchOpeningTimes() {
    return Promise.reject(new Error('Missing Implemenation'));
  }
}

// export the class
module.exports = MerlinPark;
