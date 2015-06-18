var request = require("request");
var AdmZip = require('adm-zip');
var fs = require("fs");

var dataCacheDir = __dirname + "/data/";
var dataFile = dataCacheDir + "/appState.json";

var headers = null;
var appData = null;

// write app data so we know the state of our app content and can upgrade incrementally
function SaveAppContent(cb)
{
	fs.writeFile(dataFile, JSON.stringify({
		headers: headers,
		appData: appData
	}, null, 2), cb);
}

// restore app content we've already fetched
function RestoreAppContent(cb)
{
	if (headers != null && appData != null)
	{
		return cb();
	}

	fs.exists(dataFile, function(e) {
		if (e)
		{
			fs.readFile(dataFile, function(err, data) {
				var json;
				try
				{
					json = JSON.parse(data);
				}
				catch(e)
				{
					// delete data file if it's not parsing (update from scratch!)
					fs.unlinkSync(dataFile);
					headers = {};
				}

				if (json && json.headers && json.appData)
				{
					headers = json.headers;
					appData = json.appData;
				}
				else
				{
					headers = {};
					appData = {};
				}

				return cb();
			});
		}
		else
		{
			headers = {};
			appData = {};
			return cb();
		}
	});
}


// attraction content IDs
var attractionIDs = [
	1, // attractions
	2, // shops
	3, // hotels
	4, // characters
	5, // shows
	6, // parades
	7, // restaurants
	8, // other (ATM machines etc.)
	9, // bars
];

function FetchContentList(ids, loc_id, cb)
{
	var step = function()
	{
		var c = ids.shift();
		if (!c)
		{
			return cb(null, true);
		}

		UpdateContent(c, loc_id, function(err, data) {
			process.nextTick(step);
		});
	};
	process.nextTick(step);
}

function UpdateContent(content_id, loc_id, cb)
{
	// make sure we've restored our app content first
	RestoreAppContent(function() {
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
		if (appData[ content_id ] && appData[ content_id ].updated > ( Date.now() - 1000 * 60 * 60 * 2 ))
		{
			console.log("Using cached content pack " + content_id + ".");
			return cb(null, appData[ content_id ].data);
		}

		GetUpdateList(header, function(err, data) {
			if (err) return console.log(err);

			// if there is anything (usually just a 0) in the array, we have an update to download!
			if (data.a.length == 1)
			{
				console.log("New content diffs for content pack " + content_id + " are available! Fetching...");
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
											console.log("Overwriting item " + data.l[i][0] + " in content pack " + content_id);

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
									console.log("Adding new item " + data.l[i][0] + " to content pack " + content_id);

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

					// save app state
					SaveAppContent(function() {
						cb(null, data);
					});
				});
			}
			else
			{
				console.log("Server has no updates for content pack " + content_id + ".");

				// mark cache as updated
				if (appData[ content_id ]) appData[ content_id ].updated = Date.now();

				// save app state with updated cache timer
				SaveAppContent(function() {

					// no updated data to fetch, so return cached data
					return cb(null, appData[ content_id ].data);

				});
			}
		});
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

function GetParisURL(url, json, cb)
{
	var form = {key: "Ajjjsh;Uj"};

	if (json)
	{
		form.json = JSON.stringify(json);
	}

	request({
		url: url,
		method: "POST",
		headers: {
			'User-Agent': 'Disneyland 1.0 (iPhone; iPhone OS 4.1; en_GB)',
	        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
		},
		form: form,
		strictSSL: false,
		encoding: null
	}, function(err, resp, body) {
		if (err) return cb(err);

		return cb(null, body);
	});
}

function GetUpdate(headers, cb)
{
	// make sure we've restored our app content first
	RestoreAppContent(function() {
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
				console.error("ERROR READING ZIP FOR " + JSON.stringify(headers));
				return;
			}

			var files = zip.getEntries();

			for(var i=0; i<files.length; i++)
			{
				return cb(null, JSON.parse(zip.readAsText(files[i].entryName)));
			}

			return cb("No data found");
		});
	});
}

// store ride names
var rideNames = null;
function CacheRideNames(cb)
{
	if (rideNames) return cb(null, true);

	UpdateContent(1, 2, function(err, data) {
		if (err) return cb(err);

		if (data && data.l)
		{
			rideNames = {};

			for(var i=0; i<data.l.length; i++)
			{
				rideNames[ data.l[i][12] ] = {
					name: data.l[i][1],
					desc: data.l[i][11]
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

function GetRideTimes(cb)
{
	// make sure we've restored our app content first
	RestoreAppContent(function() {
		console.log("Fetching live ride times...");
		
		GetParisURL("http://disney.cms.pureagency.com/cms/ProxyTempsAttente", null, function(err, body) {
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
				console.error("ERROR READING ZIP FOR RIDE TIMES");
				return;
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
							rides.push({
								id: data.l[i],
								name: rideNames[ data.l[i] ] ? rideNames[ data.l[i] ].name : "UNKNOWN",
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
	});
}

if (!module.parent)
{
	GetRideTimes(function(err, res) {
		if (err) return console.error(err);

		for(var i=0; i<res.length; i++)
		{
			// console log Tower of Terror (love this ride) for debugging
			if (res[i].id == "P2ZA02")
			{
				console.log(JSON.stringify(res[i], null, 2));
			}
		}
	});
}

// === Below is some example content for fetching various content packs from the EuroDisney app */
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

// to fetch all app content files
FetchContentList(contentIDs, 0, function() {
	FetchContentList(localisedContentIDs, 2, cb);
});
*/