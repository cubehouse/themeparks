var DisneyBase = require("./DisneyBase.js");
var moment = require("moment-timezone");

// cache schedule data
var scheduleCache = {};

// ParisBase object (we need to override some functions for Disneyland Paris)
function DisneylandParisBase(config) {
  var self = this;

  // set resort ID
  self.resort_id = self.resort_id;
  if (config && !self.resort_id) self.resort_id = config.resort_id;
  // default resort ID is "dlp" (Disneyland Paris)
  if (!self.resort_id) self.resort_id = "dlp";

  // inherit from base Disney park object
  DisneyBase.call(self, config);

  // override wait times URL for Paris API
  this.ContructWaitTimesURL = function() {
    return self.APIBase + "theme-parks/" + self.park_id + ";destination\u003d" + self.resort_id + "/wait-times";
  };

  // override schedule URL construction
  this.ConstructScheduleURL = function(startDate, endDate) {
    // get schedules for theme parks and attractions
    return "https://api.wdpro.disney.go.com/mobile-service/public/ancestor-activities-schedules/" + self.resort_id + ";entityType=destination";
  };

  this.ConstructScheduleData = function(startDate, endDate) {
    return {
      "filters": "theme-park,Attraction",
      // start and end date to fetch between
      "startDate": startDate.format("YYYY-MM-DD"),
      "endDate": endDate.format("YYYY-MM-DD"),
      // must supply a region for DLP
      "region": self.park_region
    };
  };

  // override opening times so we can inject our cache if needed
  this.GetOpeningTimes = function(callback) {
    if (scheduleCache[self.resort_id]) {
      if (scheduleCache[self.resort_id].expires >= Date.now()) {
        // return cached data!
        return callback(null, scheduleCache[self.resort_id].data[self.park_id]);
      }
    }

    // get start and end date in park's timezone
    var startDate = moment().tz(self.park_timezone);
    var endDate = moment().add(self.scheduleMaxDates, "days").tz(self.park_timezone);

    self.FetchURL(self.ConstructScheduleURL(startDate, endDate), {
      data: self.ConstructScheduleData(startDate, endDate)
    }, function(err, data) {
      if (err) return self.Error("Error fetching park schedule", err, callback);
      if (!data) return self.Error("No schedule data returned", null, callback);

      // parse/extract schedule data
      self.ParseScheduleData(data, startDate, endDate, function(err, times) {
        if (err) return callback(err);

        return callback(null, times);
      });
    });
  };

  // parse Disneyland Paris style schedule data
  this.ParseScheduleData = function(data, startDate, endDate, callback) {
    if (!data.activities) return self.Error("No schedule data returned", data, callback);

    var schedule = {};

    for (var i = 0, sched; sched = data.activities[i++];) {
      // if object has no schedule data, ignore
      if (!sched.schedule || !sched.schedule.schedules) continue;

      var times = {};

      // first add all the "normal" operating hours
      for (var j = 0, time; time = sched.schedule.schedules[j++];) {
        if (time.type == "Operating") {
          var day = moment(time.date);
          // skip this entry if it's after the last date we are interested in
          if (day.isAfter(endDate)) continue;
          if (day.isBefore(startDate)) continue;

          // add standard opening times to object
          var dayObj = self.ParseScheduleEntry(time);
          dayObj.special = [];
          dayObj.date = day.format(self.dateFormat);
          times[dayObj.date] = dayObj;
        }
      }

      // now back-fill all the special hours
      for (var j = 0, time; time = sched.schedule.schedules[j++];) {
        if (time.type != "Operating") {
          var day = moment(time.date);
          // skip this entry if it's after the last date we are interested in
          if (day.isAfter(endDate)) continue;
          if (day.isBefore(startDate)) continue;

          var dayFormatted = day.format(self.dateFormat);

          // add non-standard to the standard date objects
          var dayObj = self.ParseScheduleEntry(time);

          // inject special hours type into object
          dayObj.type = time.type;

          // add onto special hours array for this day
          if (times[dayFormatted]) times[dayFormatted].special.push(dayObj);
        }
      }

      // convert from object into array
      var timeArray = [];
      for (var day in times) {
        timeArray.push(times[day]);
      }

      // store schedule for this park/ride
      schedule[self.CleanRideID(sched.id)] = timeArray;
    }

    // store schedule data for this resort in cache
    scheduleCache[self.resort_id] = {
      // refetch every 12 hours
      expires: Date.now() + 1000 * 60 * 60 * 12,
      data: schedule,
    };

    // return schedule data for this park
    return callback(null, scheduleCache[self.resort_id].data[self.park_id]);
  };
}
DisneylandParisBase.prototype = Object.create(DisneyBase.prototype);
DisneylandParisBase.prototype.constructor = DisneylandParisBase;

module.exports = DisneylandParisBase;