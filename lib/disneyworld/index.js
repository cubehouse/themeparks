"use strict";

// base Disney World park objects
var Park = require("../park.js");

// HTTP library
var HTTP = require("../http");

// load user settings
var Settings = require("../settings");
// configure the Disney API's cache key
var cacheKey = "disneyapi_";

// Disney API configuration keys
var s_disneyAPIResortID = Symbol();
var s_disneyAPIParkID = Symbol();
var s_disneyAPIParkRegion = Symbol();

// API settings
var api_accessTokenURL = "https://authorization.go.com/token";
var api_accessTokenURLBody = "grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD";
var api_accessTokenURLMethod = "POST";
var api_appID = "WDW-MDX-ANDROID-3.4.1";
var api_baseURL = "https://api.wdpro.disney.go.com/facility-service/";

/**
 * Implements the Walt Disney World API framework. All Disney parks use this one API.
 * @class
 * @extends Park
 */
class WaltDisneyWorldPark extends Park {
  /**
   * Create new WaltDisneyWorldPark Object.
   * This object should not be called directly, but rather extended for each of the individual Disney parks
   * @param {Object} options
   * @param {String} options.resort_id Disney API resort ID
   * @param {String} options.park_id Disney API park ID
   * @param {String} options.park_region Disney API region ID
   */
  constructor(options = {}) {
    options.name = options.name || "Walt Disney World Resort";
    options.timezone = options.timezone || "America/New_York";

    // set resort's general center point
    options.latitude = options.latitude || 28.3852;
    options.longitude = options.longitude || -81.5639;

    // create a random Android useragent for use with the Disney API
    options.useragent = function(ua) {
      return (ua.osName == "Android");
    };

    // inherit from base class
    super(options);

    // grab disney API configuration settings (or throw an error if value is missing/null)
    if (!options.resort_id) throw new Error("Missing park's resort ID");
    this[s_disneyAPIResortID] = options.resort_id;
    if (!options.park_id) throw new Error("Missing park's API ID");
    this[s_disneyAPIParkID] = options.park_id;
    if (!options.park_region) throw new Error("Missing park's region");
    this[s_disneyAPIParkRegion] = options.park_region;
  }

  // override Fastpass Getter to declare support for FastPass
  //  (all Disney parks offer Fastpass)
  get FastPass() {
    return true;
  }

  /**
   * Get our current access token
   */
  GetAccessToken() {
    return new Promise(function(resolve, reject) {
      // first, check the cache!
      Settings.Cache.get(cacheKey + "accesstoken", function(err, accessToken) {
        if (err || !accessToken) {
          // request a fresh access token
          HTTP({
            url: api_accessTokenURL,
            method: api_accessTokenURLMethod,
            body: api_accessTokenURLBody,
            // Disney API doesn't want to return as application/JSON, so we'll manually parse it into a nice object
            forceJSON: true
          }).then(function(body) {
            if (!body.access_token) {
              return reject("Returned access token data missing access_token");
            }
            if (!body.expires_in) {
              return reject("Returned access token data missing expires_in");
            }

            // parse expires_in into an int
            var expiresIn = parseInt(body.expires_in, 10);

            // store access token in cache
            Settings.Cache.set(cacheKey + "accesstoken", body.access_token, {
              ttl: expiresIn
            }, function() {
              // return our new access token
              return resolve(body.access_token);
            });
          }, reject);
        } else {
          // found cached access token! return it
          return resolve(accessToken);
        }
      });
    }.bind(this)); // this ensures that the Promise remains in the scope of this object!
  }

  /**
   * Fetch a URL from the Disney API
   */
  GetAPIUrl(requestObject) {
    return new Promise(function(resolve, reject) {
      // get access token
      this.GetAccessToken().then(function(access_token) {
        // TODO - build request object
        // make sure headers exist if they weren't set already
        if (!requestObject.headers) requestObject.headers = [];
        requestObject.headers.Authorization = "BEARER " + access_token;
        requestObject.headers.Accept = 'application/json;apiversion=1';
        requestObject.headers['X-Conversation-Id'] = 'WDPRO-MOBILE.MDX.CLIENT-PROD';
        requestObject.headers['X-App-Id'] = api_appID;
        requestObject.headers['X-Correlation-ID'] = Date.now();

        // make sure we get JSON back
        requestObject.forceJSON = true;

        // send network request
        HTTP(requestObject).then(resolve, reject);

      }, reject);
    }.bind(this));
  }

  /**
   * Fetch this Disney Park's waiting times
   * @returns {Promise}
   */
  FetchWaitTimes() {
    return new Promise(function(resolve, reject) {
      this.GetAPIUrl({
        url: this.FetchWaitTimesURL
      }).then(
        // success!
        function(waitTimeData) {
          // check we have some data
          if (!waitTimeData || !waitTimeData.entries) {
            return reject("Invalid data returned by WDW API for FetchWaitTimes");
          }

          // apply each ride wait time
          for (var i = 0, ride; ride = waitTimeData.entries[i++];) {
            this.SetRideWaitTime({
              // WDW API ride IDs are weird, clean them up first
              id: CleanRideID(ride.id),
              name: ride.name || "???",
              // if no wait minutes are available, return -1
              wait_time: ride.waitTime.postedWaitMinutes || -1,
            });
          }

          // resolve successfully!
          return resolve();
        }.bind(this),
        // error
        reject
      );
    }.bind(this));
  }

  /**
   * The URL used to request this park's latest ride waiting times 
   * @type {String}
   */
  get FetchWaitTimesURL() {
    // this is a separate function for any parks that need to override this
    return `${api_baseURL}theme-parks/${this[s_disneyAPIParkID]};destination\u003d${this[s_disneyAPIResortID]}/wait-times?region=${this[s_disneyAPIParkRegion]}`;
  }
}

var regexTidyID = /^([^;]+)/;
/**
 * Clean up a WDW ride id
 * IDs are usually in form [id];entityType=Attraction
 * This will tidy that up to just return the numeric ID portion at the start
 * @private
 */
function CleanRideID(ride_id) {
  var capture = regexTidyID.exec(ride_id);
  if (capture && capture.length > 1) {
    return capture[1];
  }
  return ride_id;
};

// export just the Base Disney Park class
module.exports = WaltDisneyWorldPark;