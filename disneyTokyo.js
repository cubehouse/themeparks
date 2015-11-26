// Tokyo is GPS locked! Sort of... :)
// first, we need to make a request to (replacing [LAT] and [LONG]:
//   http://info.tokyodisneyresort.jp/s/gps/tdl_index.html?nextUrl=http%3A%2F%2Finfo.tokyodisneyresort.jp%2Frt%2Fs%2Frealtime%2Ftdl_attraction.html&lat=[LAT]&lng=[LONG]
// we'll get a cookie "tdrloc" set
// TODO - what does this cookie mean? First day of testing, it's the same from multiple requests from multiple IPs!

// handy URL request module
var request = require("request");
// moment for time parsing
var moment = require("moment-timezone");
// user-agent generator
var random_useragent = require('random-useragent');
// cheerio, a jQuery-style HTML parser
var cheerio = require('cheerio');
// parse cookies returned by server
var cookie = require('cookie');
// astify to parse localisation code to get English :)
var astify = require('astify');
// sandbox to execute the gathered JavaScript code safely
var jailed = require('jailed');
// async task utility
var async = require("async");

module.exports = DisneyTokyo;

function DisneyTokyo(options) {

	// default options
	var config = {
		debug: true,
		// geo-coordinates to create fake GPS positions
		//  each park should have an array containing 2 "pair arrays"
		//  i.e, two points to form an equater-aligned rectangle enclosing the area we're after
		gps: {
			disneyland: [
				[35.63492433179704, 139.87755417823792],
				[35.63234322451754, 139.8831331729889],
			],
			disneysea: [
				[35.6277563214705, 139.8811161518097],
				[35.62465172824325, 139.88948464393616],
			]
		},
		// time format to return dates in (see momentjs doc http://momentjs.com/docs/#/displaying/format/)
		//  default is ISO8601 format YYYY-MM-DDTHH:mm:ssZ
		timeFormat: "YYYY-MM-DDTHH:mm:ssZ",
		// format for printing days
		dateFormat: "YYYY-MM-DD",
	};

	// merge options if we have any overrides
	if (options) {
		for (var key in options) {
			config[key] = options[key];
		}
	}

	// our saved state object
	var state = {};

	/** Get wait times for given park_id
	 * eg. DisneySea: tds
	 */
	this.GetWaitTimes = function(park_id) {
		var cb = arguments[arguments.length - 1];

		// TODO - validate the park ID

		// make sure we have all our data up-to-date
		CheckInitData(function(err) {
			if (err) {
				return cb(err);
			}

			// make request to disney server with our cookie
			request({
				url: "http://info.tokyodisneyresort.jp/rt/s/realtime/" + park_id + "_attraction.html",
				method: "GET",
				headers: {
					'User-Agent': state.userAgent,
					'Cookie': 'tdrloc=' + state.cookie,
				},
			}, function(err, resp, body) {
				if (err) {
					console.error("Error loading DisneyTokyo ride list for " + park_id + ": " + err);
					return cb(err);
				}

				// parse fetched body
				ParseTokyoHTML(body, park_id, function(err, result) {
					if (err) return cb(err);

					// turn object into array and return
					var res = [];
					for (var ride in result) res.push(result[ride]);
					return cb(err, res);
				});
			});
		});
	}

	/** Parse an HTML page from Tokyo website to get ride times etc. */
	function ParseTokyoHTML(body, park_id, cb) {
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
				console.error("Warning: " + ride_url + " doesn't supply a ride ID");
				continue;
			}

			// got the ride ID!
			ride_data.id = ride_id_match[1];

			// get waiting time!
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

			// does this ride have FastPass?
			if (el.find(".fp")
				.length) {
				// fastpass is supported! But we can also grab the current fastpass timeslot!
				ride_data.fastpass = true;

				// extract time from HTML
				var fastpass_time_text = el.find(".fp")
					.text();
				var fastpass_time_match = /\((\d{2}\:\d{2})\-(\d{2}\:\d{2})\)/g.exec(fastpass_time_text);
				if (fastpass_time_match) {
					// convert time
					ride_data.fastpassStart = ParseTokyoTime(fastpass_time_match[1]);
					ride_data.fastpassEnd = ParseTokyoTime(fastpass_time_match[2]);

					ride_data.fastpassStatus = "Fastpass booking: " + fastpass_time_match[1] + " - " + fastpass_time_match[2];
				}
			} else if (el.find(".fp-no")
				.length) {
				// ride supports fastpass! but they've ran out :(
				ride_data.fastpass = true;
				ride_data.fastpassStatus = "All Fastpass Claimed";
			} else {
				ride_data.fastpass = false;
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
						ride_data.openingTime = ParseTokyoTime(time_match[1]);
						ride_data.closingTime = ParseTokyoTime(time_match[2]);

						break;
					}
				}
			}

			// ride is active if we got an opening time!
			// TODO - check we're currently within it's opening/closing range
			ride_data.active = ride_data.openingTime ? true : false;

			// get ride name from the loc data
			if (state.rideData[ride_data.id]) {
				ride_data.name = state.rideData[ride_data.id].name;
			}

			results[ride_data.id] = ride_data;
		}

		// check for any rides we know about (from localisation data)
		//  but doesn't have a wait time. Assume it is closed (or the park is closed and returning no data)
		for (var ride in state.rideData) {
			if (!results[ride]) {
				// make sure this ride is meant to be in this park
				if (state.rideData[ride].park_id.id == park_id) {
					results[ride] = {
						id: ride,
						waitTime: 0,
						fastpass: false,
						active: false,
						name: state.rideData[ride].name,
					};
				}
			}
		}

		return cb(null, results);
	}

	var tokyoTimeFormat = "HH:mm";
	var tokyoTimezone = "Asia/Tokyo";

	function ParseTokyoTime(time) {
		return moment.tz(time, tokyoTimeFormat, tokyoTimezone)
			.format(config.timeFormat);
	}

	/** Get all the ride names */
	function GetRideNames(cb) {
		if (state.rideData) {
			// TODO - invalidate this every 6-24 hours or so
			return cb(null, state.rideData);
		}

		// store ride data here
		var rideData = {};

		async.waterfall([
			// step 1, get loc
			GetLocalisationObject,
			// step 2, loop through each park and gather data!
			function(cb) {
				// parks we want to fetch
				var parks = [{
					id: "tds",
					kind: 2
				}, {
					id: "tdl",
					kind: 1
				}];

				// for each park, get the ride data
				async.eachSeries(parks, function(park_id, cb) {
					Dbg("Fetching ride data for " + park_id.id + "...");

					// make API request to get ride list
					request({
						url: "http://www.tokyodisneyresort.jp/api/v1/wapi_attractions/lists/sort_type:1/locale:1/park_kind:" + park_id.kind + "/",
						headers: {
							"Referer": "http://www.tokyodisneyresort.jp/en/attraction/lists/park:" + park_id.id,
							"User-Agent": GetRandomUserAgent(),
							"X-Requested-With": "XMLHttpRequest",
							"Accept": "text/javascript, application/javascript, */*; q=0.01",
						},
						// auto-parse the result with requestjs
						json: true
					}, function(err, resp, body) {
						if (err) {
							console.log("Error getting ride names: " + err);
							return cb(err);
						}

						if (body && body.entries && body.entries.length) {
							for (var i = 0, ride; ride = body.entries[i++];) {
								// calculate tags
								var tags = [];
								if (ride.tag_ids) {
									for (var tag in ride.tag_ids) tags.push(GetLoc("tags", tag));
								}

								rideData[ride.str_id] = {
									id: ride.str_id,
									name: ride.name,
									name_yomi: ride.name_yomi,
									image: ride.thum_url_pc,
									// localise the tags from the website
									tags: tags,
									park_id: park_id,
									// get park and area names
									park_name: state.loc.place["1"][ride.park_kind],
									area_name: GetLoc("area_name", ride.park_kind, ride.m_areas_id),
								};
							}
						}

						return cb(null);
					});
				}, function(err, res) {
					if (err) return cb(err);
					return cb(null);
				});
			}
		], function(err) {
			if (err) return cb(err);

			// save ride data into the state and return
			state.rideData = rideData;
			return cb(null, state.rideData);
		});
	}

	/** Check we have the GPS cookie, localisation data etc. ready to generally handle requests */
	function CheckInitData(cb) {
		GetLocalisationObject(function(err) {
			if (err) return cb(err);

			GetRideNames(function(err) {
				if (err) return cb(err);

				GetGeoCookie(function(err) {
					return cb(err);
				});
			});

		});
	}

	function GetLocalisationObject(cb) {
		// if we already have localisation data, return
		if (state.loc) return cb(null);

		// step 1, download the application logic holding the localisation
		request({
			url: "http://www.tokyodisneyresort.jp/en/js/sys-js/wapi.js",
			method: "GET",
			headers: {
				'User-Agent': GetRandomUserAgent()
			}
		}, function(err, resp, body) {
			if (err) {
				console.log("Error getting localisation file: " + err);
				return cb("Error getting localisation file");
			}

			// step 2, parse/run JS to extract the localisation data
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
								state.loc = obj;
								// disconnect sandbox
								loc_sandbox.disconnect();

								Dbg("Fetched loc strings");

								return cb(null);
							}
						});
					}
				}
			}
		});
	}

	function GetLoc(type, id, id2) {
		if (!state.loc || !state.loc["1"] || !state.loc["1"][type] || !state.loc["1"][type][id]) return type + ":" + id;

		if (id2) {
			if (!state.loc["1"][type][id][id2]) return type + ":" + id + ":" + id2;
			return state.loc["1"][type][id][id2];
		} else {
			return state.loc["1"][type][id];
		}
	}

	function GetGeoCookie(cb) {
		// skip if we have already fetched our cookie!
		if (state.cookie) {
			return cb(null, state.cookie);
		}

		// create random GPS coordinates!
		var gps = GenerateRandomGeoLoc();

		// create (and store) a user-agent
		state.userAgent = GetRandomUserAgent();

		// make request using our fake GPS position to get our cookie!
		request({
			url: "http://info.tokyodisneyresort.jp/s/gps/tdl_index.html",
			qs: {
				nextUrl: "http://info.tokyodisneyresort.jp/rt/s/realtime/tdl_attraction.html",
				lat: gps[0],
				lng: gps[1],
			},
			method: "GET",
			headers: {
				'User-Agent': state.userAgent,
			},
			// don't follow redirects! Our cookie doesn't follow us in Request
			followRedirect: false,
		}, function(err, resp, body) {
			if (err) {
				console.error("Error fetching GPS cookie: " + err);
				return cb(err);
			}

			// search for our GPS cookie
			if (resp.headers && resp.headers['set-cookie'] && resp.headers['set-cookie'].length) {
				var GPScookie = null;
				for (var i = 0, cookie_string; cookie_string = resp.headers['set-cookie'][i++];) {
					var cookie_data = cookie.parse(cookie_string);

					// search for any tdrloc cookie
					//  keep searching and keep the last set one
					//  their server usually sets it twice, first deleting it, then setting the correct one
					if (cookie_data && cookie_data.tdrloc) {
						GPScookie = cookie_data.tdrloc;
					}
				}

				if (!GPScookie) {
					console.error("Failed to find valid GPS cookie");
					for (var i = 0, cookie_string; cookie_string = resp.headers['set-cookie'][i++];) {
						console.error(" * " + cookie_string);
					}
					return cb("DisneyTokyo returned no valid cookies for GPS authentication");
				}

				Dbg("Fetched GPS cookie: " + GPScookie);

				// save GPS cookie in our state
				state.cookie = GPScookie;

				// we got this far! hurrah! return the cookie value
				return cb(null, GPScookie);
			} else {
				return cb("DisneyTokyo returned no cookies for GPS authentication");
			}
		});
	}

	function GenerateRandomGeoLoc() {
		// generate a random co-ordinate from within Tokyo Disney
		var parks = Object.keys(config.gps);
		var park = config.gps[parks[parks.length * Math.random() << 0]];

		return [
			RandomBetween(park[0][0], park[1][0])
			.toFixed(14),
			RandomBetween(park[0][1], park[1][1])
			.toFixed(14),
		];
	}

	function RandomBetween(a, b) {
		return a + (Math.random() * (b - a));
	}

	/** Create a fake mobile phone user-agent for making requests */
	function GetRandomUserAgent() {
		return random_useragent.getRandom(function(ua) {
			return ua.userAgent.indexOf('Android') > 0;
		});
	}

	function Dbg(msg) {
		if (!config.debug) return;
		console.log("[DisneyTokyo] " + msg);
	}

	this.Test = function(cb) {
		var file = require("fs")
			.readFileSync(__dirname + "/test_disneysea.html");
		CheckInitData(function(err) {
			if (err) return cb(err);
			ParseTokyoHTML(file, "tds", cb);
		});
		//GetRideNames("tdr", cb);
	};
}

if (!module.parent) {
	var cb = function(err, res) {
		if (err) return console.error(err);
		console.log(JSON.stringify(res, null, 2));
	};

	var app = new DisneyTokyo();
	app.GetWaitTimes("tds", cb);
	//app.Test(cb);
}
