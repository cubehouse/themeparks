// shim promisify into older NodeJS versions (6)

const util = require('util');

if (util.promisify === undefined) {
  Object.defineProperty(util, 'promisify', {
    configurable: true,
    enumerable: true,
    value: func => (...args) => new Promise((resolve, reject) => func(...args, (err, res) => (
      err ? reject(err) : resolve(res)
    ))),
    writable: true,
  });
}

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
