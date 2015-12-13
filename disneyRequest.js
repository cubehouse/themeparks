// need pluralize to turn types into plural versions for API pages
var pluralize = require('pluralize');
// moment to sort out schedule dates/times
var moment = require("moment-timezone");

function DisneyRequest(options) {
  /* ===== Exports ===== */

  var config = {
    // region to report to API
    region: "us",
  };

  // overwrite config with supplied options if they exist
  if (options) {
    for (var key in options) {
      config[key] = options[key];
    }
  }

  /** Get a URL from the Disney API */
  this.GetURL = function(url, cb) {
    MakeGet(url, {}, cb);
  };


  /** Get an API page
   * id: Page ID (eg. 80007944 - ID for the Magic Kingdom)
   * type: Page type (eg. "wait-times" - for park wait times)
   * options (optional): Pass subpage or apiopts settings to API (see WDW and DLP)
   *   subpage example: "wait-times"
   *   apiopts example: "destination=dlp"
   * callback: function return with arguments (error, data)
   */
  this.GetPage = function(id, type, options, cb) {
    if (typeof options == "function") {
      cb = options;
      options = {};
    }

    // handle optional subpage option
    if (options.subpage) {
      // subpage must start with /
      if (options.subpage !== "" && options.subpage[0] != "/") options.subpage = "/" + options.subpage;
    } else {
      options.subpage = "";
    }

    // initialise optional apiopts option if not set
    if (!options.apiopts) {
      options.apiopts = "";
    } else if (options.apiopts[0] != ";") {
      // make sure apiopts starts with ;
      options.apiopts = ";" + options.apiopts;
    }

    // tidy up inputs
    type = type.toLowerCase().replace(/[^a-z0-9-]/g, "");
    // pluralize type
    type = pluralize(type);

    // pass region to API
    var data = {
      region: config.region,
    };

    MakeGet("https://api.wdpro.disney.go.com/facility-service/" + type + "/" + id + options.apiopts + options.subpage, data, cb);
  };

  /** Get the schedule for DLP
   * This is separate as we can fetch all schedules for parks and rides in one request
   *  If we can work out this for WDW etc. we can use it there too :)
   */
  this.GetDLPSchedule = function(cb) {
    // work out today's day (in the target timezone)
    var date = moment().tz("Europe/Paris").format("YYYY-MM-DD");

    if (!dlpScheduleCache || !dlpScheduleLastCacheDay || dlpScheduleLastCacheDay != date) {
      // cache is empty or invalid! Fetch new data

      // calculate end date to grab schedules for (30 days after today)
      // TODO - expose this as an API setting
      var endDate = moment().add(30, 'days').tz("Europe/Paris").format("YYYY-MM-DD");

      MakeGet("https://api.wdpro.disney.go.com/mobile-service/public/ancestor-activities-schedules/dlp;entityType=destination", {
        // fetch park and attraction data
        "filters": "theme-park,Attraction",
        // start and end date to fetch between
        "startDate": date,
        "endDate": endDate,
        // must supply a region for DLP
        "region": config.region
      }, function(err, data) {
        if (err) {
          console.error("Error fetching DLP schedule: " + err);
          return cb("Error fetching DLP schedule data");
        }

        // parse response into a useful data format
        var schedule = {};
        for (var i = 0, sched; sched = data.activities[i++];) {
          // if object has no schedule data, ignore
          if (!sched.schedule || !sched.schedule.schedules) continue;

          // tidy up object (mainly sorting out the ID)
          TidyObject(sched);

          // start building schedule object
          var scheduleData = {
            id: sched.id,
            times: {},
          };

          for (var j = 0, time; time = sched.schedule.schedules[j++];) {
            // calculate opening and closing time using moment-timezone
            if (!scheduleData.times[time.date]) scheduleData.times[time.date] = [];
            scheduleData.times[time.date].push({
              openingTime: moment.tz(time.date + time.startTime, "YYYY-MM-DDHH:mm:ss", "Europe/Paris"),
              closingTime: moment.tz(time.date + time.endTime, "YYYY-MM-DDHH:mm:ss", "Europe/Paris"),
              // usually "Operating" or "Extra Magic Hours", but can occasionally be "Event" or something unusual! So expect anything to be here
              type: time.type,
            });
          }
          schedule[sched.id] = scheduleData;
        }

        // store current date so we re-fetch once a day
        dlpScheduleCache = schedule;
        dlpScheduleLastCacheDay = date;

        return cb(null, schedule);
      });
    } else {
      // return cached data
      return cb(null, dlpScheduleCache);
    }
  };
  var dlpScheduleLastCacheDay = null;
  var dlpScheduleCache = null;

  /* ===== Variables ===== */



  // keep session data
  var session = {
    access_token: false,
    expire_time: 0
  };

  // our default user-agent
  var useragent = "Mozilla/5.0 (Linux; U; Android 4.3; en-GB; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30";

  // define any Request settings we want
  var request_vars = {
    jar: true
  };

  // support passing extra config for Request (eg. proxy/Tor settings)
  if (config && config.request) {
    for (var k in config.request) {
      request_vars[k] = config.request[k];
    }
  }

  // load request library
  var request = require('request').defaults(request_vars);



  /* ===== Internal Functions ===== */



  // get fresh access token from Disney API
  function GetAccessToken(cb) {
    request({
        url: "https://authorization.go.com/token",
        method: "POST",
        headers: {
          "User-Agent": useragent
        },
        body: "assertion_type=public&client_id=WDPRO-MOBILE.CLIENT-PROD&grant_type=assertion"
      },
      function(err, resp, body) {
        if (err) {
          if (cb) cb(err);
          return;
        }

        if (resp.statusCode == 200) {
          var data = JSON.parse(body);
          if (data && data.access_token && data.expires_in) {
            session.access_token = data.access_token;
            session.expire_time = (new Date().getTime()) + ((data.expires_in - 30) * 1000);

            if (cb) cb();
          } else {
            if (cb) cb("GetAccessToken: Invalid data body returned");
          }
        } else {
          if (cb) cb("GetAccessToken: Unexpected status code: " + resp.statusCode);
          return;
        }
      }
    );
  }

  function CheckAccessToken(cb) {
    // check if we have an access token or our access token has expired
    if (!session.access_token || session.expire_time <= new Date().getTime()) {
      GetAccessToken(function(error) {
        if (error) {
          if (cb) cb(error);
          return;
        }
        if (cb) cb();
      });
    } else {
      if (cb) cb();
    }
  }

  /** Make a GET request to the Disney API */
  function MakeGet(url, data, cb) {
    CheckAccessToken(function(error) {
      if (error) {
        if (cb) cb(error);
        return;
      }

      var headers = {
        'Authorization': "BEARER " + session.access_token,
        'Accept': 'application/json;apiversion=1',
        'X-Conversation-Id': '~WDPRO-MOBILE.CLIENT-PROD',
        "User-Agent": useragent
      };

      // add stored load balancer instance if we have one
      if (session.correlation) {
        headers["X-Correlation-Id"] = session.correlation;
      }

      request({
        url: url,
        method: "GET",
        headers: headers,
        qs: data
      }, function(error, resp, body) {
        // if we get an instance ID from the load balancer, store it
        if (resp && resp.headers && resp.headers["x-correlation-id"]) {
          session.correlation = resp.headers["x-correlation-id"];
        }

        if (error) {
          if (cb) cb(error);
          return;
        }

        // attempt to parse the body for JSON Data
        var JSONData = false;

        try {
          JSONData = JSON.parse(body);
        } catch (e) {
          if (cb) cb(false, body);
        }

        if (JSONData) {
          TidyObject(JSONData);
          if (JSONData.entries) {
            for (var i = 0; i < JSONData.entries.length; i++) {
              TidyObject(JSONData.entries[i]);
            }
          }
          if (cb) cb(false, JSONData, resp);
        }
      });
    });
  }

  /** Helper function to call all tidy functions in-use */
  function TidyObject(obj) {
    TidyID(obj);
    TidyGPS(obj);
  }

  /** Tidy up any IDs in the returned object */
  var regexTidyID = /^([^;]+)/;

  function TidyID(obj) {
    if (!obj) return;
    if (!obj.id) return;
    var capture = regexTidyID.exec(obj.id);
    if (capture && capture.length > 1) {
      obj.id = capture[1];
    }
  }

  /** Look for any GPS data in the object and replace it with more human-friendly information */
  function TidyGPS(object) {
    if (!object) return;

    if (!object.coordinates) return;

    for (var place in object.coordinates) {
      var obj = object.coordinates[place];

      if (obj.xyMaps && obj.xyMaps.x && obj.xyMaps.y) {
        obj.xyMaps.x = parseInt(obj.xyMaps.x, 10);
        obj.xyMaps.y = parseInt(obj.xyMaps.y, 10);
      }

      if (obj.gps && obj.gps.longitude && obj.gps.latitude) {
        obj.gps.longitude = parseFloat(obj.gps.longitude);
        obj.gps.latitude = parseFloat(obj.gps.latitude);
        obj.gmap = "https://www.google.com/maps/place/" + obj.gps.latitude + "," + obj.gps.longitude + "/@" + obj.gps.latitude + "," + obj.gps.longitude + ",20z";
      }
    }

    // Disney themed Google Map links
    if (object.type && object.id) {
      // Disney.go.com uses a Base64 encoded JSON object to pass map configurations around
      //  this is passed through a bookmark hash to tell the map what to load
      //  below I create my own JSON object and encode it to generate my own map URL
      var mapObject = {
        options: {
          pins: [
            // create a pin on the map to make it center at this position
            {
              type: object.type,
              id: object.id
            }
          ]
        }
      };

      var mapHash = new Buffer(JSON.stringify(mapObject)).toString('base64');

      object.disneyMap = "https://disneyworld.disney.go.com/maps/" + "#" + mapHash;
      object.disneyMapMini = "https://disneyworld.disney.go.com/maps/thumbnail" + "#" + mapHash;
    }
  }
}

// export module object
module.exports = DisneyRequest;

if (!module.parent) {
  var api = new DisneyRequest();
  api.GetDLPSchedule(function(err, data) {
    if (err) return console.error(err);
    console.log(JSON.stringify(data, null, 2));
  });
}