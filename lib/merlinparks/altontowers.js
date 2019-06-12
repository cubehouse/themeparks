const MerlinPark = require('./merlinpark');
const defaultFallbackData = require('./altontowers_data.json');

/**
 * Alton Towers
 * @class
 * @extends MerlinPark
 */
class AltonTowers extends MerlinPark {
  /**
   * Create a new AltonTowers object
   */
  constructor(options = {}) {
    options.name = options.name || 'Alton Towers';
    options.timezone = options.timezone || 'Europe/London';

    // set park's location as it's entrance
    options.latitude = options.latitude || 52.991064;
    options.longitude = options.longitude || -1.892292;

    // Park API options
    options.apiKey = options.apiKey || '5bf34ca0-1428-4163-8dde-f4db4eab6683';
    options.initialDataVersion = options.initialDataVersion || '2019-05-01T14:58:20Z';

    // Fallback data if the /data webservice doesn't work
    options.fallbackData = options.fallbackData || defaultFallbackData;

    // inherit from base class
    super(options);
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: 'https://www.altontowers.com/Umbraco/Api/OpeningTimes/GetAllAttractionOpeningTimes',
      method: 'GET',
      headers: {
        Referer: 'https://www.altontowers.com/useful-info/opening-times/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then((calendarData) => {
      // find theme park dates from response
      // it also contains "waterpark", "treetopquest", "extraordinarygolf" and "altontowersspa" [sic] times as well in a separate array
      if (calendarData.Attractions) {
        // find theme park data
        const themeParkOpeningTimes = calendarData.Attractions.find(item => item.Attraction === 'themepark');

        if (themeParkOpeningTimes && themeParkOpeningTimes.DateRanges) {
          themeParkOpeningTimes.DateRanges.forEach((timeRange) => {
            const isClosed = timeRange.IsClosed === true || timeRange.OpeningHours === 'Closed'; // Best API ever !
            this.applyDateRange(timeRange.StartDate, timeRange.EndDate, !isClosed, timeRange.OpeningHours);
          });
        }
      }
    });
  }
}

module.exports = AltonTowers;
