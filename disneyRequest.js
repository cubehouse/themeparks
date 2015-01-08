// need pluralize to turn types into plural versions for API pages
var pluralize = require('pluralize');

function DisneyRequest(options)
{ 
    /* ===== Exports ===== */
    


    /** Get a URL from the Disney API */
    this.GetURL = function(url, cb)
    {
        MakeGet(url, {}, cb);
    };


    /** Get an API page 
    * id: Page ID (eg. 80007944 - ID for the Magic Kingdom)
    * type: Page type (eg. "wait-times" - for park wait times)
    * subpage (optional): Sub-page of an API page (TODO - find example)
    * callback: function return with arguments (error, data)
    */
    this.GetPage = function(id, type, subpage, cb)
    {
        if (typeof subpage == "function")
        {
            cb = subpage;
            subpage = "";
        }
        else
        {
            // make sure subpage starts with a slash
            if (subpage !== "" && subpage[0] != "/") subpage = "/" + subpage;
        }

        // tidy up inputs
        id = parseInt(id, 10);
        type = type.toLowerCase().replace(/[^a-z0-9-]/g, "");
        // pluralize type
        type = pluralize(type);

        MakeGet("https://api.wdpro.disney.go.com/facility-service/" + type + "/" + id + subpage, {}, cb);
    };
    
    
    
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
    
    // support passing extra options for Request (eg. proxy/Tor settings)
    if (options && options.request)
    {
        for(var k in options.request)
        {
            request_vars[k] = options.request[k];
        }
    }

    // load request library
    var request = require('request').defaults(request_vars);

    
    
    /* ===== Internal Functions ===== */
    
    
    
    // get fresh access token from Disney API
    function GetAccessToken(cb)
    {
        request(
        {
            url: "https://authorization.go.com/token",
            method: "POST",
            headers: {
                "User-Agent": useragent
            },
            body: "assertion_type=public&client_id=WDPRO-MOBILE.CLIENT-PROD&grant_type=assertion"
        },
        function(err, resp, body)
        {
            if (err)
            {
                if (cb) cb(err);
                return;
            }

            if (resp.statusCode == 200)
            {
                var data = JSON.parse(body);
                if (data && data.access_token && data.expires_in)
                {
                    session.access_token = data.access_token;
                    session.expire_time = (new Date().getTime()) + ((data.expires_in - 30) * 1000);

                    if (cb) cb();
                }
                else
                {
                    if (cb) cb("GetAccessToken: Invalid data body returned");
                }
            }
            else
            {
                if (cb) cb("GetAccessToken: Unexpected status code: " + resp.statusCode);
                return;
            }
        }
        );
    }

    function CheckAccessToken(cb)
    {
        // check if we have an access token or our access token has expired
        if (!session.access_token || session.expire_time <= new Date().getTime())
        {
            GetAccessToken(function(error) {
                if (error)
                {
                    if (cb) cb(error);
                    return;
                }
                if (cb) cb();
            });
        }
        else
        {
            if (cb) cb();
        }
    }

    /** Make a GET request to the Disney API */
    function MakeGet(url, data, cb)
    {
        CheckAccessToken(function(error) {
            if (error)
            {
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
            if (session.correlation)
            {
                headers["X-Correlation-Id"] = session.correlation;
            }

            request({
                url: url,
                method: "GET",
                headers: headers,
                qs: data
            }, function(error, resp, body) {
                // if we get an instance ID from the load balancer, store it
                if (resp && resp.headers && resp.headers["x-correlation-id"])
                {
                    session.correlation = resp.headers["x-correlation-id"];
                }

                if (error)
                {
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

                if (JSONData)
                {
                    TidyObject(JSONData);
                    if (JSONData.entries)
                    {
                        for(var i=0; i<JSONData.entries.length; i++)
                        {
                            TidyObject(JSONData.entries[i]);
                        }
                    }
                    if (cb) cb(false, JSONData, resp);
                }
            });
        });
    }

    /** Helper function to call all tidy functions in-use */
    function TidyObject(obj)
    {
        TidyID(obj);
        TidyGPS(obj);
    }

    /** Tidy up any IDs in the object to only include digits and parse to a JavaScript Int */
    function TidyID(obj)
    {
        if (!obj) return;
        if (!obj.id || !obj.type) return;
        var capture = /^([0-9]+)/.exec(obj.id);
        if (capture && capture.length > 1)
        {
            obj.id = parseInt(capture[1], 10);
        }
    }

    /** Look for any GPS data in the object and replace it with more human-friendly information */
    function TidyGPS(object)
    {
        if (!object) return;

        if (!object.coordinates) return;

        for(var place in object.coordinates)
        {
            var obj = object.coordinates[place];

            if (obj.xyMaps && obj.xyMaps.x && obj.xyMaps.y)
            {
                obj.xyMaps.x = parseInt(obj.xyMaps.x, 10);
                obj.xyMaps.y = parseInt(obj.xyMaps.y, 10);
            }

            if (obj.gps && obj.gps.longitude && obj.gps.latitude)
            {
                obj.gps.longitude = parseFloat(obj.gps.longitude);
                obj.gps.latitude = parseFloat(obj.gps.latitude);
                obj.gmap = "https://www.google.com/maps/place/" + obj.gps.latitude + "," + obj.gps.longitude + "/@" + obj.gps.latitude + "," + obj.gps.longitude + ",20z";
            }
        }

        // Disney themed Google Map links
        if (object.type && object.id)
        {
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
