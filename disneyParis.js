// handy URL request module
var request = require("request");
// need to unzip API responses
var AdmZip = require('adm-zip');

// export our Paris object
module.exports = DisneyParis;

function DisneyParis(options, data_cache)
{
	var config = {
		debug: false,
		// key app uses to communicate with the API server
		app_key: "Ajjjsh;Uj",
		// minutes before checking for updated ride names
		//  (4 hours default)
		cache_minutes: 240,
		// optional save function that will be called when data have updated
		//  will be called as: config.save(data, callback)
		// in reverse, to restore data, create our DisneyParis object with data_cache populated
		save: null,
		// attraction content IDs (for ride/attraction names)
		//  we only really need ones that will have opening/close/wait times
		//  others are here in the comments for reference
		// can enable these when we expand to support the shows and other opening times etc.
		attractionIDs: [
			1, // attractions
			//2, // shops
			//3, // hotels
			//4, // characters
			//5, // shows
			//6, // parades
			//7, // restaurants
			//8, // other (ATM machines etc.)
			//9, // bars
		],
	};

	// overwrite config with supplied options if they exist
	if (options)
	{
		for(var key in options)
		{
			config[key] = options[key];
		}
	}

	// internal data storage for ride names etc.
	var headers = {};
	var appData = {};

	// restore data if it's been passed to the object
	if (data_cache)
	{
		if (data_cache.headers) headers = data_cache.headers;
		if (data_cache.appData) appData = data_cache.appData;
	}

	/** ===== Exports ===== */

	/** Get park waiting times for rides */
	this.GetWaitTimes = function(park_id)
	{
		var cb = arguments[ arguments.length - 1 ];

		// make sure we've restored our app content first
		log("Fetching live ride times...");

		GetParisURL("http://disney.cms.pureagency.com/cms/ProxyTempsAttente", null, function(err, body) {
			if (err)
			{
				log("ERROR: " + err);
				return cb(err);
			}
			
			try
			{
				var zip = new AdmZip(body);
			}
			catch(e)
			{
				log("ERROR READING ZIP FOR RIDE TIMES");
				return cb(e);
			}

			var files = zip.getEntries();

			for(var i=0; i<files.length; i++)
			{
				var data = JSON.parse(zip.readAsText(files[i].entryName));

				if (data && data.l)
				{
					// make sure we have all our ride names before building our result object
					CacheRideNames(function(err, res) {
						if (err) return console.error(err);

						var rides = [];

						for(var i=0; i<data.l.length; i+=5)
						{
							// some entries have no name, but wait time data
							//  seems to be left-over waste data for rides that have been 
							//  removed from the park that no longer appear on the app
							//  eg. River Rogue Keelboats and Captain EO
							if (!rideNames[ data.l[i] ]) continue;

							// skip if we're fetching for a specific Disneyland Paris park
							if (park_id && rideNames[ data.l[i] ].park != park_id) continue;

							rides.push({
								id: data.l[i],
								name: rideNames[ data.l[i] ].name,
								openingTime: data.l[i + 1],
								closingTime: data.l[i + 2],
								active: data.l[i + 3] ? true : false,
								waitTime: data.l[i + 4]
							});
						}
						return cb(null, rides);
					});

					return;
				}
			}

			return cb("No data found");
		});
	};

	// helper log function
	function log(msg)
	{
		if (!config.debug) return;

		console.log("[DisneyParis] " + msg);
	}

	/** Try to save module internal state (optional) */
	function Save(cb)
	{
		if (!config.save) return cb();

		// send save object to config.save function
		config.save({
			headers: headers,
			appData: appData
		}, cb);
	}

	// store ride names
	var rideNames = null;
	function CacheRideNames(cb)
	{
		if (rideNames) return cb(null, true);

		FetchContentList(config.attractionIDs, 2, function(err, data) {
			if (err) return cb(err);

			if (data && data.l)
			{
				rideNames = {};

				for(var i=0; i<data.l.length; i++)
				{
					rideNames[ data.l[i][12] ] = {
						name: data.l[i][1],
						desc: data.l[i][11],
						// park ID (1: Disneyland Park, 2: Walt Disney Studios, Park 3: Disney Village, 4: Hotels)
						park: data.l[i][7]
					};
				}

				return cb(null, true);
			}
			else
			{
				cb("No ride name data found");
			}
		});
	}


	/** Internal function to fetch data from the Disneyland Paris API server */
	function GetParisURL(url, json, cb)
	{
		// build basic POST data, including just the app_key
		var form = {key: config.app_key};

		// if we've been passed a json object, stringify it and pass it as key "json" in the form
		if (json)
		{
			form.json = JSON.stringify(json);
		}

		// make request
		request({
			url: url,
			method: "POST",
			headers: {
				'User-Agent': 'Disneyland 1.0 (iPhone; iPhone OS 4.1; en_GB)',
		        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
			},
			// POST data
			form: form,
			// ignore invalid SSL certificates (the app uses a self-signed server)
			strictSSL: false,
			// perform no encoding on the response, we need the clean buffer to unzip the result
			encoding: null
		}, function(err, resp, body) {
			if (err) return cb(err);

			return cb(null, body);
		});
	}

	/** Fetch a collection of content and return the "l" array combined */
	function FetchContentList(ids, loc_id, cb)
	{
		// gather the content lists into one list
		var result = null;

		var step = function()
		{
			var c = ids.shift();
			if (!c)
			{
				return cb(null, result);
			}

			UpdateContent(c, loc_id, function(err, data) {

				if (!result)
				{
					// first result becomes the returned object
					result = data;
				}
				else if (data.l)
				{
					// merge array into result array
					for(var i=0; i<data.l.length; i++)
					{
						result.l.push(data.l[i]);
					}
				}

				process.nextTick(step);
			});
		};

		process.nextTick(step);
	}

	function UpdateContent(content_id, loc_id, cb)
	{
		// default loc_id to 0
		if (typeof(loc_id) == "function")
		{
			cb = loc_id;
			loc_id = 0;
		}

		// create a fresh header to pull the full app data
		var header = {tp: content_id, lg: loc_id, s: 0, h1: 0, h2: 0};
		// ... unless there is a saved header from our last fetch! Then use that instad
		if (headers[ content_id ]) header = headers[ content_id ];

		// goto cache if fetched in last two hours
		if (appData[ content_id ] && appData[ content_id ].updated > ( Date.now() - 60000 * config.cache_minutes ))
		{
			log("Using cached content pack " + content_id + ".");
			return cb(null, appData[ content_id ].data);
		}

		GetUpdateList(header, function(err, data) {
			if (err) return console.log(err);

			// if there is anything (usually just a 0) in the array, we have an update to download!
			if (data && data.a && data.a.length == 1)
			{
				log("New content diffs for content pack " + content_id + " are available! Fetching...");

				GetUpdate(header, function(err, data) {
					if (err) return console.error(err);

					// save content_id header
					headers[ content_id ] = data.h;

					// store our content
					if (appData[ content_id ])
					{
						// merge into existing content!
						if (data.l)
						{
							for(var i=0; i<data.l.length; i++)
							{
								// first check if the item already exists in our data set
								var replaced = false;
								for(var j=0; j<appData[ content_id ].data.j.length; j++)
								{
									if (appData[ content_id ].data.l[i])
									{
										if (appData[ content_id ].data.l[i][0] == data.l[i][0])
										{
											log("Overwriting item " + data.l[i][0] + " in content pack " + content_id);

											// item already exists! replace it
											appData[ content_id ].data.l[i] = data.l[i];
											replaced = true;
											break;
										}
									}
								}

								// otherwise, push onto the end!
								if (!replaced)
								{
									log("Adding new item " + data.l[i][0] + " to content pack " + content_id);

									appData[ content_id ].data.l.push(data.l[i]);
								}
							}

							// mark object as updated
							appData[ content_id ].updated = Date.now();
						}
					}
					else
					{
						appData[ content_id ] = {
							data: data,
							updated: Date.now()
						};
					}

					// save app state with updated data
					Save(function() {
						cb(null, data);
					});
				});
			}
			else
			{
				log("Server has no updates for content pack " + content_id + ".");

				// mark cache as updated
				if (appData[ content_id ]) appData[ content_id ].updated = Date.now();

				// save app state with updated cache timer (check again later)
				Save(appData, function() {

					// return cached data
					return cb(null, appData[ content_id ].data);

				});
				
			}
		});
	}

	function GetUpdateList(headers, cb)
	{
		headers = [].concat(headers);

		GetParisURL("http://disney.cms.pureagency.com/cms/ProxyContentList", {
			l: headers
		}, function(err, body) {
			return cb(null, JSON.parse(body.toString()));
		});
	}

	function GetUpdate(headers, cb)
	{
		// make sure we've restored our app content first
		GetParisURL("http://disney.cms.pureagency.com/cms/ProxyContent", headers, function(err, body) {
			if (err)
			{
				console.log("ERROR: " + err);
				return cb(err);
			}

			try
			{
				var zip = new AdmZip(body);
			}
			catch(e)
			{
				log("ERROR READING ZIP FOR " + JSON.stringify(headers));
				return cb(e);
			}

			var files = zip.getEntries();

			for(var i=0; i<files.length; i++)
			{
				return cb(null, JSON.parse(zip.readAsText(files[i].entryName)));
			}

			return cb("No data found");
		});
	}

}

// debug function, call node disneyParis.js to call this
if (!module.parent)
{
	var a = new DisneyParis({debug: true});

	a.GetWaitTimes(function(err, res) {
		if (err) return console.error(err);

		for(var i=0; i<res.length; i++)
		{
			console.log(res[i].name + " :: " + res[i].waitTime + ((res[i].active) ? "" : " (closed)"));
		}
	});
}

// === Below is some example content for fetching various content packs from the EuroDisney app */
// this is just for refernce, and not used by this script
/*
var localisedContentIDs = [
	989, // "Recommended Routes"
	992, // advert video and image
	993, // park list (Park, Studios, Village and Hotels)
	994, // "Tips & Tricks"
	995, // "Specific Needs"
	996, // visuals
	998, // "Practical Information"
];

// these content packs don't want a localisation ID, and will return errors if we try
var contentIDs = [
	988, // app contact numbers (for about page)
	990, // Landmarks
	991, // today's show times (match up IDs with content ID 5)
	997, // regions (US) to full country names (United States)
	999, // map configs
];
*/