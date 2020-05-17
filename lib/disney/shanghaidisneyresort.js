// import the base Disney park class
const DisneyLegacy = require('./disneylegacyapi.js');
const DisneyUtil = require('./disneyUtil');
const ShanghaiBaseData = require('./shanghaiData');

/**
 * Shanghai Disney Resort - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class ShanghaiDisneyResortMagicKingdom extends DisneyLegacy {
  /**
   * Create a new ShanghaiDisneyResortMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Shanghai Disney Resort';
    options.timezone = options.timezone || 'Asia/Shanghai';

    // set park's location as it's entrance
    options.latitude = options.latitude || 31.1433;
    options.longitude = options.longitude || 121.6580;

    // Disney API configuration for Shanghai Magic Kingdom
    options.resortId = options.resortId || 'shdr';
    options.parkId = options.parkId || 'desShanghaiDisneyland';
    options.resortRegion = options.resortRegion || 'cn';
    options.resortCode = options.resortCode || 'shdr';

    // API auth is different for Shanghai for some reason...

    // override access token POST body
    options.accessTokenBody = options.accessTokenBody
      || 'grant_type=assertion&assertion_type=public&client_id=DPRD-SHDR.MOBILE.ANDROID-PROD';

    // override API auth URL
    options.apiAuthURL = options.apiAuthURL || 'https://authorization.shanghaidisneyresort.com/curoauth/v1/token';

    // override api base URL
    options.apiBaseURL = options.apiBaseURL || 'https://apim.shanghaidisneyresort.com/';

    // inherit from base class
    super(options);
  }

  async FetchFacilitiesData() {
    // TODO - perform rolling updates on this data
    return this.ParseFacilitiesUpdate(ShanghaiBaseData);
  }

  async FetchWaitTimes() {
    const resp = await this.GetAPIUrl({
      url: `${this.GetAPIBase}explorer-service/public/wait-times/${this.GetResortCode};entityType=destination`,
      data: {
        region: 'cn',
      },
    });

    const facilityData = await this.GetFacilityData(resp.entries.map(x => x.id));

    resp.entries.forEach((ride) => {
      const cleanID = DisneyUtil.CleanID(ride.id);
      if (facilityData[cleanID]) {
        let waitTime = -1;
        if (ride.waitTime.status === 'Operating') {
          waitTime = ride.waitTime.postedWaitMinutes || 0;
        } else if (ride.waitTime.status === 'Down') {
          waitTime = -2;
        } else if (ride.waitTime.status === 'Renewal') {
          waitTime = -3;
        }

        this.UpdateRide(cleanID, {
          name: facilityData[cleanID].name,
          waitTime,
          fastPass: facilityData[cleanID].fastpass,
        });
      }
    });
  }

  HTTP(options) {
    if (!options.headers) options.headers = [];
    // always request English names (if possible)
    options.headers['accept-language'] = 'en';

    // Allows unauthorized HTTPS certificates as ShanghaiDisneyResort uses a self-signed certificate
    options.rejectUnauthorized = false;
    return super.HTTP(options);
  }
}

module.exports = ShanghaiDisneyResortMagicKingdom;
