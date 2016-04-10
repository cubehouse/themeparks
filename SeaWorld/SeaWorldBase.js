var Park = require("../parkBase");

var moment = require("moment-timezone");

// export the Seaworld base park object
module.exports = SeaworldBase;

function SeaworldBase(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "SeaWorld Generic Park Object";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "https://seas.te2.biz/v1/rest/venue/";

  self.authToken = self.authToken || "c2Vhd29ybGQ6MTM5MzI4ODUwOA==";

  // POI types to fetch and cache
  self.poiTypes = self.poiTypes || ["Ride"];

  // local ride list cache
  self.rideIDs = [];
  // map of IDs -> ride names
  self.rideNames = {};

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // generate a random Android useragent
  self.RandomiseUseragent(function(ua) {
    return (ua.osName == "Android");
  });

  // fetch a URL from the SeaWorld API
  this.GetAPIURL = function(page, callback) {
    var requestObject = {
      url: self.APIBase + self.park_id + "/" + page,
      method: "GET",
      headers: {
        "Authorization": "Basic " + self.authToken,
      },
      json: true,
    };

    self.MakeNetworkRequest(requestObject, function(err, resp, body) {
      // if error, return error
      if (err) return self.Error("Error fetching " + page + " for SeaWorlds park " + park_id, err, callback);

      // return response body
      return callback(null, body);
    });
  };

  // Pre-fetch API data on rides, call before getting wait times etc.
  this.SetupAPI = function(callback) {
    // return data if we already have some cached
    // TODO - expire the cache periodically
    if (self.rideIDs && self.rideIDs.length) return callback(null, self.rideIDs);

    self.Dbg("Fetching POI names and IDs");

    // fetch points of interest data
    self.GetAPIURL("poi/all", function(err, pois) {
      if (err) return self.Error("Error fetching POI data", err, callback);

      var rides = [];
      for (var i = 0, poi; poi = pois[i++];) {
        // only include POIs of configured types
        if (self.poiTypes.indexOf(poi.type) >= 0) {
          rides.push(poi.id);
          // also store ride names, since some rides don't return their names in the /all/status URL (??)
          self.rideNames[poi.id] = poi.label;
        }
      }
      self.rideIDs = rides;

      return callback(null, self.rideIDs);
    });
  };

  // get the park wait times
  this.GetWaitTimes = function(callback) {
    // make sure we have the API pre-fetched data first
    self.SetupAPI(function(err) {
      if (err) return self.Error("Failed to setup API", err, callback);

      // get the POI status (not the full page)
      self.GetAPIURL("poi/all/status", function(err, pois) {
        if (err) return self.Error("Error fetching wait times from API", err, callback);

        var rides = [];

        for (var i = 0, poi; poi = pois[i++];) {
          if (self.rideIDs.indexOf(poi.id) >= 0) {
            rides.push({
              id: poi.id,
              name: self.rideNames[poi.id],
              // if no wait time is posted, assume zero wait time
              waitTime: poi.status.waitTime ? poi.status.waitTime : 0,
              // make sure this can't be "undefined" if isOpen just isn't there
              active: poi.status.isOpen ? true : false,
              // TODO - work out which rides have fastPass
              fastPass: false,
              // generate a status string based on active state
              //  status only includes isOpen and hasShowsRemaining, no Down status
              status: poi.status.isOpen ? "Operating" : "Closed",
            });
          }
        }

        return callback(null, rides);
      });
    });
  };

  // Fetch park opening times
  this.GetOpeningTimes = function(callback) {
    // what is today? (in the local timezone)
    var today = moment().tz(self.park_timezone);
    var endDate = moment().add(self.scheduleMaxDates, "days").tz(self.park_timezone);

    self.GetAPIURL("hours/" + today.format("YYYY-MM-DD") + "?days=" + self.scheduleMaxDates, function(err, data) {
      if (err) return self.Error("Failed to get park hours", err, callback);

      var daydata = {};
      for (var i = 0, day; day = data[i++];) {
        daydata[day.date] = day;
      }

      var schedule = [];
      day = today;
      for (var i = 0; i < self.scheduleMaxDates; i++) {
        var dayString = day.format("YYYY-MM-DD");
        if (!daydata[dayString] || !daydata[dayString].isOpen) {
          schedule.push({
            date: moment(dayString, "YYYY-MM-DD").format(self.dateFormat),
            openingTime: null,
            closingTime: null,
            type: "Closed",
          });
        } else {
          schedule.push({
            date: moment(daydata[dayString].date, "YYYY-MM-DD").format(self.dateFormat),
            // times are already in lovely timestamps!
            openingTime: moment(daydata[dayString].open, "YYYY-MM-DDTHH:mm:ss.SSSZ").tz(self.timeFormatTimezone).format(self.timeFormat),
            closingTime: moment(daydata[dayString].close, "YYYY-MM-DDTHH:mm:ss.SSSZ").tz(self.timeFormatTimezone).format(self.timeFormat),
            // jsut use standard opening type, API doesn't return any special hours
            type: "Operating",
          });
        }

        // incrememt day
        day.add(1, "day");
      }

      return callback(null, schedule);
    });
  };
}