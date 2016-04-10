var Park = require("../parkBase");

var moment = require("moment-timezone");
var crypto = require('crypto');
var random_useragent = require("random-useragent");

module.exports = [AltonTowers];

function AltonTowers(config) {
  // keep hold of 'this'
  var self = this;

  self.name = self.name || "Alton Towers";

  // Alton Towers in London timezone
  self.park_timezone = "Europe/London";

  // base API URL to use for requests
  self.APIBase = self.APIBase || "http://scarefestsounds.altontowers.com/api/";
  // API key to access ride times
  self.APIKey = self.APIKey || "ufkPRqH3AmqwWMr66nyUzepe";

  // grab opening times calendar from the website
  self.CalendarAPI = self.CalendarAPI || "https://www.altontowers.com/Umbraco/Api/Calendar/GetAllOpeningTimes";

  // app uses this user agent for requests
  self.useragent = "Apache-HttpClient/UNAVAILABLE (java 1.4)";

  // make another useragent for making calendar requests
  self.web_useragent = random_useragent.getRandom(function(ua) {
    return (ua.osName == "Android");
  });

  // Call to parent class "Park" to inherit
  Park.call(self, config);

  // Get Alton Towers wait times
  self.GetWaitTimes = function(callback) {
    var reqObj = {
      url: self.APIBase + "queue-times",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Connection": "Keep-Alive",
      },
      json: true,
    };

    // first, we get the challenge string from the API
    self.MakeNetworkRequest(reqObj, function(err, resp, data) {
      if (err) return self.Error("Failed to fetch queue times challenge", err, callback);
      if (!data || !data.challenge) return self.Error("No challenge sent from Alton Towers API", data, callback);

      self.Dbg("Got Alton Towers challenge string: " + data.challenge);

      // create response MD5 hash
      var response = crypto.createHash('md5').update(self.APIKey + data.challenge).digest("hex");

      var rideReqObj = {
        url: self.APIBase + "queue-times",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Connection": "Keep-Alive",
        },
        json: true,
        body: "response=" + response + "&challenge=" + data.challenge,
      };

      // with the challenge string hashed with the API key, we can now request the actual queue times
      self.MakeNetworkRequest(rideReqObj, function(err, resp, data) {
        if (err) return self.Error("Failed to fetch queue times data", err, callback);
        if (!data || !data.length) return self.Error("API didn't return any times", data, callback);

        var rides = [];

        for (var i = 0, ride; ride = data[i++];) {
          rides.push({
            id: ride.id,
            name: ride.ride,
            waitTime: ride.time || 0,
            active: ride.status == "open" ? true : false,
            status: ride.status == "open" ? "Operating" : "Closed",
            // Fastpass at Alton Towers is a separate paid package, so no rides are really "fastpass" enabled
            fastPass: false,
          });
        }

        return callback(null, rides);
      });
    });
  };

  self.GetOpeningTimes = function(callback) {
    var reqObj = {
      url: self.CalendarAPI,
      method: "GET",
      headers: {
        "User-Agent": self.web_useragent,
        "Referer": "https://www.altontowers.com/info-help/opening-times/",
        "X-Requested-With": "XMLHttpRequest",
      },
      json: true
    };

    self.MakeNetworkRequest(reqObj, function(err, resp, data) {
      if (err) return self.Error("Failed to fetch opening times data", err, callback);
      if (!data || !data.length) return self.Error("API didn't return any opening hours", data, callback);

      var today = moment().tz(self.park_timezone);
      var endDay = moment().add(self.scheduleMaxDates, 'days').tz(self.park_timezone);

      // find theme park dates from response
      //  it contains "WatterPark"[sic] times as well in a separate array
      var parkDates = null;
      for (var i = 0, times; times = data[i++];) {
        if (times.Type == "ThemePark") {
          parkDates = times.OpeningHours;
          break;
        }
      }
      if (!parkDates) return self.Error("Could not find Theme Park opening hours in calendar API", data, callback);

      // rather than per-day, each week/weekend is a group with a unique opening/closing time
      // so create lookup object for finding opening hours for a given day
      var hoursLookups = {};
      for (var i = 0, period; period = parkDates[i++];) {
        var startDay = moment(period.From, "YYYY-MM-DDT00:00:00").tz(self.park_timezone);
        var finishDay = moment(period.To, "YYYY-MM-DDT00:00:00").tz(self.park_timezone);

        // if hours aren't set yet, just mark as open for 1 minute in the middle of the day
        var hours = {
          openingTime: "12:00pm",
          closingTime: "12:01pm",
        };

        // work out the opening hours from the data string
        var result;
        // long format, if they have typed "10am - 5:30pm" or the like
        if (result = /([0-9\:]+[ap]m)\s*\-\s*([0-9\:]+[ap]m)/gi.exec(period.Open)) {
          hours.openingTime = result[1];
          hours.closingTime = result[2];
        }
        // try shorthand format too, in case someone entered the times in badly
        else if (result = /([0-9]+)\s*\-\s*([0-9]+)/gi.exec(period.Open)) {
          hours.openingTime = result[1] + ":00am";
          hours.closingTime = result[2] + ":00pm";
        }

        // iterate through each day for the date period
        for (var currentDay = moment(startDay); currentDay.isSameOrBefore(finishDay); currentDay.add(1, 'day')) {
          // extract year/month/date from each day in the opening period
          var year = currentDay.format("YYYY");
          var month = currentDay.format("MM");
          var day = currentDay.format("DD");

          // add to our lookup object
          if (!hoursLookups[year]) hoursLookups[year] = {};
          if (!hoursLookups[year][month]) hoursLookups[year][month] = {};
          if (!hoursLookups[year][month][day]) hoursLookups[year][month][day] = hours;
        }
      }

      // create schedule result
      var schedule = [];
      for (var currentDay = moment(today); currentDay.isSameOrBefore(endDay); currentDay.add(1, 'day')) {
        var year = currentDay.format("YYYY");
        var month = currentDay.format("MM");
        var day = currentDay.format("DD");

        if (!hoursLookups[year] || !hoursLookups[year][month] || !hoursLookups[year][month][day]) {
          // park closed
          schedule.push({
            date: currentDay.format(self.dateFormat),
            type: "Closed",
          });
        } else {
          // park open! add hours onto our current day
          var dayString = currentDay.format("YYYY-MM-DD");
          schedule.push({
            date: currentDay.format(self.dateFormat),
            openingTime: moment.tz(dayString + " " + hoursLookups[year][month][day].openingTime, "YYYY-MM-DD HH:mma", self.timezone).format(self.timeFormat),
            closingTime: moment.tz(dayString + " " + hoursLookups[year][month][day].closingTime, "YYYY-MM-DD HH:mma", self.timezone).format(self.timeFormat),
            type: "Operating",
          });
        }
      }

      return callback(null, schedule);
    });
  };
}