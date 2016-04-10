// use the standard park base, as Tokyo setup is completely different to wdw
var ParkBase = require("../parkBase");

// parse cookies returned by server
var cookie = require('cookie');
// date/time parsing
var moment = require("moment-timezone");
// astify to parse localisation code to get English :)
var astify = require('astify');
// sandbox to execute the gathered JavaScript code safely
var jailed = require('jailed');
// cheerio, a jQuery-style HTML parser
var cheerio = require('cheerio');
// async lib for general tidyness
var async = require("async");

var cachedGeoCookie = null;
var cachedLocalisation = null;
var cachedRideData = null;

function DisneylandTokyoBase(config) {
  var self = this;

  self.name = self.name || "Generic Disney Tokyo Park";

  self.park_timezone = "Asia/Tokyo";

  // TokyoBase supports ride schedules from parsed HTML page
  self.supports_ride_schedules = true;

  // Call to parent class "Park" to inherit
  ParkBase.call(self, config);

  // generate a random useragent
  self.RandomiseUseragent(function(ua) {
    // any user agent will do
    return true;
  });

  /** Get wait times for given park_id
   * eg. DisneySea: tds
   */
  this.GetWaitTimes = function(callback) {
    // make sure we have all our data up-to-date
    self.SetupAPI(function(err) {
      if (err) return this.Error("Failed to setup API", err, callback);

      // make request to disney server with our cookie
      self.FetchURL("http://info.tokyodisneyresort.jp/rt/s/realtime/" + self.park_id + "_attraction.html", {
        headers: {
          'Cookie': 'tdrloc=' + encodeURIComponent(cachedGeoCookie.cookie)
        }
      }, function(err, body) {
        if (err) return self.Error("Error fetching ride times", err, callback);

        // parse fetched body
        self.ParseTokyoHTML(body, function(err, result) {
          if (err) return callback(err);

          // turn object into array and return
          var res = [];
          for (var ride in result) res.push(result[ride]);
          return callback(err, res);
        });
      });
    });
  };

  // Helper function to make sure the API is setup and ready to use
  this.SetupAPI = function(callback) {
    self.GetGeoCookie(function(err) {
      if (err) return self.Error("Failed to get geo cookie", err, callback);

      self.GetLocalisationData(function(err) {
        if (err) return self.Error("Failed to get localisation data", err, callback);

        self.GetRideNames(function(err) {
          if (err) return self.Error("Failed to get ride localisation data", err, callback);
          return callback();
        });

      });
    });
  };

  this.ParseTokyoHTML = function(body, callback) {
    var results = {};

    // make a parsed HTML object of our HTML body
    var $ = cheerio.load(body);

    // search for all ride time list objects
    var rides = $(".schedule .midArw");
    for (var i = 0, ride; ride = rides[i++];) {
      var el = $(ride);
      var ride_data = {};

      // extract URL (finding ride name/id)
      var ride_url = el.find("a")
        .attr("href");
      var ride_id_match = /attraction\/detail\/str_id\:([a-z0-9_]+)/gi.exec(ride_url);

      // if we can't get a ride ID, just continue
      if (!ride_id_match) {
        continue;
      }

      // got the ride ID!
      ride_data.id = ride_id_match[1];

      // get waiting time!
      // first, check for rides under maintenance
      if (el.text().indexOf("運営・公演中止") >= 0) {
        // found the maintenance text, mark ride as inactive
        ride_data.waitTime = -1;
        ride_data.active = false;
      } else {
        var waitTime = el.find(".waitTime");
        if (!waitTime || !waitTime.length) {
          ride_data.waitTime = 0;
        } else {
          // extract number
          ride_data.waitTime = parseInt(waitTime.remove("span")
            .text(), 10);
          // if we didn't get a number, time is unavailable! (but ride is still open)
          //  this usually means you have to go to the ride to get wait times, and they're not on the app
          if (isNaN(ride_data.waitTime)) ride_data.waitTime = -1;
        }
      }

      // does this ride have FastPass?
      if (el.find(".fp")
        .length) {
        // fastpass is supported! But we can also grab the current fastpass time slot!
        ride_data.fastPass = true;

        // extract time from HTML
        var fastpass_time_text = el.find(".fp")
          .text();
        var fastpass_time_match = /\((\d{2}\:\d{2})\-(\d{2}\:\d{2})\)/g.exec(fastpass_time_text);
        if (fastpass_time_match) {
          // convert time
          ride_data.fastPassStart = self.ParseTokyoTime(fastpass_time_match[1]);
          ride_data.fastPassEnd = self.ParseTokyoTime(fastpass_time_match[2]);

          ride_data.fastPassStatus = "Fastpass booking: " + fastpass_time_match[1] + " - " + fastpass_time_match[2];
        }
      } else if (el.find(".fp-no")
        .length) {
        // ride supports fastpass! but they've ran out :(
        ride_data.fastPass = true;
        ride_data.fastPassStatus = "All Fastpass Claimed";
      } else {
        ride_data.fastPass = false;
      }

      // extract opening and closing time
      var closingTimes = el.find(".run");
      if (closingTimes.length) {
        for (var j = 0, time; time = closingTimes[j++];) {
          // extract opening and closing times
          //  annoyingly these seem to be hand-entered, as they're missing leading zeroes on time earlier than 10:00
          var time_match = /((?:[5-9]|[12]\d)\:\d{2}).*(\d{2}\:\d{2})/g.exec($(time)
            .text());
          if (time_match) {
            // parse opening and closing time
            ride_data.schedule = {
              openingTime: self.ParseTokyoTime(time_match[1]),
              closingTime: self.ParseTokyoTime(time_match[2]),
              type: "Operating",
            };

            break;
          }
        }
      }

      // if no schedule data was found, this ride is probably closed
      //  create an entry marking ride as closed for today
      if (!ride_data.schedule) {
        ride_data.schedule = {
          openingTime: moment().tz(self.park_timezone).startOf("day").format(self.timeFormat),
          closingTime: moment().tz(self.park_timezone).endOf("day").format(self.timeFormat),
          type: "Closed",
        };
      }

      // if we haven't found any reason to mark this ride as active or inactive yet...
      if (typeof(ride_data.active) == "undefined") {
        // ...check we're inside it's opening times to see if we're active!
        ride_data.active = moment().isBetween(ride_data.schedule.openingTime, ride_data.schedule.closingTime);
      }

      // return a status string based on whether we're active
      // TODO - it's hard to determine Down status from Japanese HTMl, monitor it and figure it out
      ride_data.status = ride_data.active ? "Operating" : "Closed";

      // get ride name from the loc data
      if (cachedRideData[self.park_id][ride_data.id]) {
        ride_data.name = cachedRideData[self.park_id][ride_data.id].name;
      }

      // tell us when this data updated
      var updateTimes = el.find(".update");
      if (updateTimes.length) {
        // we got the update time text in format like "(更新時間：8:00) or (更新時間：14:34)"
        // then strip the prefix and suffix
        var update_time_text = el.find(".update");

        var update_time_match = /\s?(\d{1,2}\:\d{2})\s?/g.exec(update_time_text);

        ride_data.updateTime = self.ParseTokyoTime(update_time_match);
      }

      results[ride_data.id] = ride_data;
    }

    // check for any rides we know about (from localisation data)
    //  but doesn't have a wait time. Assume it is closed (or the park is closed and returning no data)
    for (var ride in cachedRideData[self.park_id]) {
      if (!results[ride]) {
        results[ride] = {
          id: ride,
          waitTime: 0,
          fastPass: false,
          active: false,
          name: cachedRideData[self.park_id][ride].name,
          status: "Closed",
          schedule: {
            openingTime: moment().tz(self.park_timezone).startOf("day").format(self.timeFormat),
            closingTime: moment().tz(self.park_timezone).endOf("day").format(self.timeFormat),
            type: "Closed",
          },
        };
      }
    }

    return callback(null, results);
  };

  this.ParseTokyoTime = function(time) {
    // add the current date in Tokyo to the time to make sure it's in the right day!
    var day = moment().tz(self.park_timezone).format("YYYY-MM-DD ");

    return moment.tz(day + time, "YYYY-MM-DD HH:mm", self.park_timezone).tz(self.timeFormatTimezone).format(self.timeFormat);
  };

  this.GetOpeningTimes = function(callback) {
    // get today's date in Tokyo time and the ending date for our schedule fetch
    var today = moment().tz(self.park_timezone);
    var endDay = moment().add(30, 'days').tz(self.park_timezone);

    // get today's date and the current month
    var dateToday = today.format("YYYY/MM/DD");
    var requestStart = today.format("YYYYMM");

    // get formatted end date for fetching
    var dateEnd = endDay.format("YYYY/MM/DD");
    var requestEnd = endDay.format("YYYYMM");

    // get list of month calendars to process (either just this month, or this month and next)
    var todo = [requestStart];
    if (requestEnd != requestStart) {
      todo.push(requestEnd);
    }

    var schedule = [];
    var startDateFound = false;

    async.eachSeries(todo, function(calendarMonth, callback) {
      self.FetchURL("http://www.tokyodisneyresort.jp/api/v1/wapi_monthlycalendars/detail/ym:" + calendarMonth + "/", {
        headers: {
          "Referer": "http://www.tokyodisneyresort.jp/en/attraction/lists/park:" + self.park_id,
          "X-Requested-With": "XMLHttpRequest"
        },
        json: true
      }, function(err, body, resp) {
        if (err) return callback(err);

        // loop through returned dates
        for (var date in body.entry) {
          // don't start adding to return object until we find our start date value
          if (!startDateFound && !schedule.length) {
            if (date != dateToday) continue;
            startDateFound = true;
          }

          if (body.entry[date][self.park_id]) {
            var schedDate = moment(date, "YYYY/MM/DD").format(self.dateFormat);
            schedule.push({
              date: schedDate,
              openingTime: moment.tz(schedDate + body.entry[date][self.park_id].open_time_1, "YYYY-MM-DD HH:mm", self.park_timezone).tz(self.timeFormatTimezone).format(self.timeFormat),
              closingTime: moment.tz(schedDate + body.entry[date][self.park_id].close_time_1, "YYYY-MM-DD HH:mm", self.park_timezone).tz(self.timeFormatTimezone).format(self.timeFormat),
              type: "Operating",
            });
          }

          if (date == dateEnd) {
            // reached desired end date, return
            return callback();
          }
        }

        // not reached end date yet, return for next async series to process
        return callback();
      });
    }, function(err) {
      if (err) return this.Error("Failed to fetch Tokyo calendar", err, callback);

      return callback(null, schedule);
    });
  };

  this.GetGeoCookie = function(callback) {
    // check if we have a valid cookie still
    if (cachedGeoCookie && cachedGeoCookie.expires > Date.now()) {
      return callback(null, cachedGeoCookie.cookie);
    }

    // otherwise, fetch a fresh cookie
    self.FetchGeoCookie(callback);
  };

  // Fetch a geo cookie for accessing Tokyo API
  this.FetchGeoCookie = function(callback) {
    // generate random GPS position
    if (!self.gpsRange) return self.Error("No GPS data supplied for park", null, callback);
    var gpsPosition = [
      self.RandomBetween(self.gpsRange[0][0], self.gpsRange[1][0]).toFixed(14),
      self.RandomBetween(self.gpsRange[0][1], self.gpsRange[1][1]).toFixed(14),
    ];

    // fetch cookie
    self.FetchURL("http://info.tokyodisneyresort.jp/s/gps/tdl_index.html", {
        ignoreRedirects: true,
        data: {
          nextUrl: "http://info.tokyodisneyresort.jp/rt/s/realtime/tdl_attraction.html",
          lat: gpsPosition[0],
          lng: gpsPosition[1],
        },
      },
      function(err, body, resp) {
        if (err) return self.Error("Failed to get geoCookie response", err, callback);

        // search for our GPS cookie
        if (resp.headers && resp.headers['set-cookie'] && resp.headers['set-cookie'].length) {
          var GPScookie = null;
          var GPSExpires = null;
          for (var i = 0, cookie_string; cookie_string = resp.headers['set-cookie'][i++];) {
            var cookie_data = cookie.parse(cookie_string);

            // search for any tdrloc cookie
            //  keep searching and keep the last set one
            //  their server usually sets it twice, first deleting it, then setting the correct one
            if (cookie_data && cookie_data.tdrloc) {
              GPScookie = cookie_data.tdrloc;
              // parse cookie date into unix timestamp
              GPSExpires = moment(cookie_data.expires, "ddd, DD-MMM-YYYY HH:mm:ss z").valueOf();
            }
          }

          // check we found a GPS Cookie
          if (!GPScookie) {
            return self.Error("No valid cookies for GPS authentication found", resp.headers['set-cookie'], callback);
          }

          self.Dbg("Fetched GPS cookie", GPScookie, "Expires", GPSExpires);

          // save GPS cookie in our state
          cachedGeoCookie = {
            cookie: GPScookie,
            expires: GPSExpires,
          };

          // we got this far! hurrah! return the cookie value
          return callback(null, GPScookie);
        } else {
          return self.Error("No cookies found for GPS authentication", resp.headers, callback);
        }
      });
  };

  // helper function to fetch a random value between two numbers
  this.RandomBetween = function(a, b) {
    return a + (Math.random() * (b - a));
  };

  this.GetLocalisationData = function(callback) {
    // skip if we've already got localisation data fetched
    if (cachedLocalisation && cachedLocalisation.expires > Date.now()) {
      return callback(null);
    }

    self.FetchURL("http://www.tokyodisneyresort.jp/en/js/sys-js/wapi.js", {}, function(err, body) {
      if (err) return self.Error("Error fetching localisation data", err, callback);

      // parse JS to extract the localisation data
      var ast = astify.parse(body);
      if (ast && ast.ast && ast.ast.body) {
        for (var i = 0, obj; obj = ast.ast.body[i++];) {
          // search for the _set_common localisation object
          if (obj && obj.kind == "var" && obj.declarations && obj.declarations.length && obj.declarations[0].id && obj.declarations[0].id.name && obj.declarations[0].id.name == "_set_common") {
            // found the localisation object! parse it!
            var loc_src = obj.toSource() + "application.remote.send_loc(_set_common);";

            // setup sandbox with callback to receive the loc object
            var loc_sandbox = new jailed.DynamicPlugin(loc_src, {
              send_loc: function(obj) {
                // store returned object
                cachedLocalisation = {
                  data: obj,
                  // refetch once a day
                  expires: Date.now() + 1000 * 60 * 60 * 24,
                };

                // disconnect sandbox
                loc_sandbox.disconnect();

                return callback(null);
              }
            });
          }
        }
      } else {
        return self.Error("Failed to find localisation data", body, callback);
      }
    });
  };

  // Get (and cache) ride names for this park
  this.GetRideNames = function(callback) {
    if (cachedRideData && cachedRideData[self.park_id]) return callback();

    // make API request to get ride list
    self.FetchURL("http://www.tokyodisneyresort.jp/api/v1/wapi_attractions/lists/sort_type:1/locale:1/park_kind:" + self.park_kind + "/", {
      json: true
    }, function(err, body) {
      if (err) return self.Error("Error fetching ride names", err, callback);

      // reset ride cache
      if (!cachedRideData) cachedRideData = {};
      cachedRideData[self.park_id] = {};

      if (body && body.entries && body.entries.length) {
        for (var i = 0, ride; ride = body.entries[i++];) {
          // TODO: calculate tags
          /*var tags = [];
          if (ride.tag_ids) {
            for (var tag in ride.tag_ids) tags.push(GetLoc("tags", tag));
          }*/

          cachedRideData[self.park_id][ride.str_id] = {
            id: ride.str_id,
            name: ride.name,
            name_yomi: ride.name_yomi,
            image: ride.thum_url_pc,
            // localise the tags from the website
            // TODO - add these back
            //tags: tags,
            park_id: self.park_id,
            // get park and area names
            // TODO - work these out
            //park_name: state.loc.place["1"][ride.park_kind],
            //area_name: GetLoc("area_name", ride.park_kind, ride.m_areas_id),
          };
        }
      }

      return callback();
    });
  };

  this.FetchURL = function(url, options, callback) {
    var reqObj = {
      url: url,
      headers: {
        "Referer": "http://www.tokyodisneyresort.jp/en/attraction/lists/park:" + self.park_id,
      },
    };

    // add/override headers if passed in
    if (options.headers) {
      for (var name in options.headers) reqObj.headers[name] = options.headers[name];
    }

    if (options.json) reqObj.json = true;

    if (options.ignoreRedirects) reqObj.followRedirect = false;

    // add data to request object (if we have any)
    if (options.data) {
      if (reqObj.method == "GET" || !reqObj.method) {
        reqObj.qs = options.data;
      } else {
        reqObj.data = options.data;
      }
    }

    self.MakeNetworkRequest(reqObj, function(err, resp, body) {
      if (err) return this.Error("API returned an error", err, callback);

      return callback(null, body, resp);
    });
  };
}
DisneylandTokyoBase.prototype = Object.create(ParkBase.prototype);
DisneylandTokyoBase.prototype.constructor = DisneylandTokyoBase;

module.exports = DisneylandTokyoBase;