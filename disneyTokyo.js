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

module.exports = DisneyTokyo;

var regexFindGPSCookie = /tdrloc\=([a-zA-Z0-9]{28})/g;

function DisneyTokyo(options) {

	// default options
	var config = {
		debug: false,
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

	/** Get wait times for given park_id
	 * eg. DisneySea: tds
	 */
	this.GetWaitTimes = function(park_id) {
		var cb = arguments[arguments.length - 1];

		// TODO - validate the park ID

		// TODO - make sure we have up-to-date cookie
		GetGeoCookie(function(err, cookie) {
			if (err) {
				return cb(err);
			}

			// make request to disney server with our cookie
			request({
				url: "http://info.tokyodisneyresort.jp/rt/s/realtime/" + park_id + "_attraction.html",
				method: "GET",
				headers: {
					// TODO - make this stable! Only generate when making new cookie
					'User-Agent': GetRandomUserAgent(),
					'Cookie': 'tdrloc=' + cookie
				},
			}, function(err, resp, body) {
				if (err) {
					console.error("Error loading DisneyTokyo ride list for " + park_id + ": " + err);
					return cb(err);
				}

				// make a parsed HTML object of our result
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
						//ride_data.waitTime = ;
					}



					console.log(ride_data);
				}
			});
		});
	}

	function GetGeoCookie(cb) {
		// create random GPS coordinates!
		var gps = GenerateRandomGeoLoc();

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
				'User-Agent': GetRandomUserAgent()
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
				var gpsCookie = null;
				for (var i = 0, cookie; cookie = resp.headers['set-cookie'][i++];) {
					// try to match each cookie against our gps cookie regex
					var match = regexFindGPSCookie.exec(cookie);
					if (match) {
						// gotta match!
						gpsCookie = match[1];
						break;
					}
				}

				if (!gpsCookie) {
					return cb("DisneyTokyo returned no valid cookies for GPS authentication");
				}

				// we got this far! hurrah! return the cookie value
				return cb(null, gpsCookie);
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
}

if (!module.parent) {
	var app = new DisneyTokyo();
	app.GetWaitTimes("tds", function(err, res) {
		if (err) return console.error(err);
		console.log(JSON.stringify(res, null, 2));
	});
}
