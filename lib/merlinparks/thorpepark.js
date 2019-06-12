const MerlinPark = require('./merlinpark');
const defaultFallbackData = require('./thorpepark_data.json');

/**
 * Thorpe Park
 * @class
 * @extends MerlinPark
 */
class ThorpePark extends MerlinPark {
  /**
   * Create a new ThorpePark object
   */
  constructor(options = {}) {
    options.name = options.name || 'Thorpe Park';
    options.timezone = options.timezone || 'Europe/London';
    options.useragent = 'okhttp/3.9.1';

    // set park's location as it's entrance
    options.latitude = options.latitude || 51.4055;
    options.longitude = options.longitude || -0.5105;

    // Park API options
    options.apiKey = options.apiKey || 'a070eedc-db3a-4c69-b55a-b79336ce723f';
    options.sAppVersion = options.sAppVersion || '1.1.72';
    options.appBuild = options.appBuild || '79';
    options.initialDataVersion = options.initialDataVersion || '2019-04-17T12:50:44Z';

    // Fallback data if the /data webservice doesn't work
    options.fallbackData = options.fallbackData || defaultFallbackData;

    // inherit from base class
    super(options);
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: 'https://www.thorpepark.com/Umbraco/Api/Calendar/GetAllOpeningTimes',
      method: 'GET',
      headers: {
        Referer: 'https://www.thorpepark.com/resort-info/opening-times-and-travel',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then((calendarData) => {
      calendarData.forEach((timeRange) => {
        // The API response only contains dates where the park is open
        this.applyDateRange(timeRange.From, timeRange.To, true, timeRange.Open);
      });
    });
  }
}

module.exports = ThorpePark;
