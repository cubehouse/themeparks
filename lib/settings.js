"use strict";

module.exports = {
    // location of Sqlite DB file
    Cache: `${process.cwd()}/themeparks.db`,
    // default time to cache any data
    DefaultCacheTime: 60 * 60 * 6, // 6 hours
    // default request timeout values
    OpenTimeout: 10000, // 10 seconds; timeout in milliseconds
    ReadTimeout: 0, // 0 seconds; timeout in milliseconds
    // socks proxy url to use
    ProxyURL: null, // e.g. "socks://127.0.0.1:1080"
    // default Park Settings
    DefaultParkName: "Default Park",
    DefaultParkTimezone: "Europe/London",
    DefaultParkTimeFormat: null,
    // cache settings (in seconds)
    DefaultCacheWaitTimesLength: 60 * 5, // 5 minutes
    DefaultCacheOpeningTimesLength: 60 * 60, // 1 hour
    // number of days to return for opening time schedules
    DefaultScheduleDays: 30,
};