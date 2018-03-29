"use strict";

module.exports = {
    // location of Sqlite DB file
    Cache: `${process.cwd()}/themeparks.db`,
    // default time to cache any data
    DefaultCacheLength: 60 * 60 * 6, // 6 hours
    // default request timeout values
    OpenTimeout: 10000, // 10 seconds; timeout in milliseconds
    ReadTimeout: 0, // 0 seconds; timeout in milliseconds
    // cache settings (in seconds)
    CacheWaitTimesLength: 60 * 5, // 5 minutes
    CacheOpeningTimesLength: 60 * 60, // 1 hour
};