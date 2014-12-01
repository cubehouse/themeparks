// need pluralize to turn types into plural versions for API pages
var pluralize = require('pluralize');

// our default user-agent
var useragent = "Mozilla/5.0 (Linux; U; Android 4.3; en-GB; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30";

// park IDs
var ID_Epcot = "80007838";
var ID_MagicKingdom = "80007944";
var ID_HollywoodStudios = "80007998";
var ID_AnimalKingdom = "80007998";

function DisneyAPI(options)
{
    // keep session data about
    var session = {
        access_token: false,
        expire_time: 0
    };

    var request_vars = {
        jar: true
    };

    // optionally accept a proxy for request
    if (options && options.proxy)
    {
        request_vars.proxy = options.proxy;
    }

    var requestAgent = false;
    if (options && options.agent)
    {
        requestAgent = options.agent;
        request_vars.agent = options.agent;
    }

    // load request library
    var request = require('request').defaults(request_vars);

    // get fresh access token from Disney API
    function GetAccessToken(cb)
    {
        request(
        {
            url: "https://authorization.go.com/token",
            method: "POST",
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
    };

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
                'X-Conversation-Id': '~WDPRO-MOBILE.CLIENT-PROD'
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

    function TidyObject(obj)
    {
        TidyID(obj);
        TidyGPS(obj);
    }

    function TidyID(obj)
    {
        if (!obj) return;
        if (!obj.id || !obj.type) return;
        var capture = /^([0-9]+)/.exec(obj.id);
        if (capture && capture.length > 1)
        {
            obj.id = parseInt(capture[1]);
        }
    }

    function TidyGPS(object)
    {
        if (!object) return;

        if (!object.coordinates) return;

        for(var place in object.coordinates)
        {
            var obj = object.coordinates[place];

            if (obj.xyMaps && obj.xyMaps.x && obj.xyMaps.y)
            {
                obj.xyMaps.x = parseInt(obj.xyMaps.x);
                obj.xyMaps.y = parseInt(obj.xyMaps.y);
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
            var mapObject = {
                options: {
// can't get zoom to work at all
//                    viewportOptions: {zoom: 16},
                    pins: [
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

    /** Generic "get whatever API URL you want" call */
    this.GetAPIURL = function(url, cb)
    {
        MakeGet(url, {}, cb);
    };

    this.GetID = function(id, type, subpage, cb)
    {
        if (typeof subpage == "function")
        {
            cb = subpage;
            subpage = "";
        }
        else
        {
            // make sure subpage starts with a slash
            if (subpage != "" && subpage[0] != "/") subpage = "/" + subpage;
        }

        // tidy up inputs
        id = parseInt(id);
        type = type.toLowerCase().replace(/[^a-z0-9-]/g, "");
        // pluralize type
        type = pluralize(type);

        MakeGet("https://api.wdpro.disney.go.com/facility-service/" + type + "/" + id + subpage, {}, cb);
    };

    /** Get wait times for a given ID, with type Type */
    this.GetTimes = function(id, type, cb)
    {
        // request wait-times sub-page for this object
        this.GetID(id, type, "wait-times", cb);
    };

    // helper functions for various main parks
    this.GetEpcotTimes = function(cb)
    {
        this.GetTimes(ID_Epcot, "theme-park", cb);
    };

    this.GetMagicKingdomTimes = function(cb)
    {
        this.GetTimes(ID_MagicKingdom, "theme-park", cb);
    };

    this.GetHollywoodStudiosTimes = function(cb)
    {
        this.GetTimes(ID_HollywoodStudios, "theme-park", cb);
    };

    this.GetAnimalKingdomTimes = function(cb)
    {
        this.GetTimes(ID_AnimalKingdom, "theme-park", cb);
    };

    /** Get schedule (opening hours) for given ID */
    this.GetSchedule = function(id, cb)
    {
        this.GetID(id, "schedule", cb);
    };

    this.GetEpcotSchedule = function(cb)
    {
        this.GetSchedule(ID_Epcot, cb);
    };

    this.GetMagicKingdomSchedule = function(cb)
    {
        this.GetSchedule(ID_MagicKingdom, cb);
    };

    this.GetHollywoodStudiosSchedule = function(cb)
    {
        this.GetSchedule(ID_HollywoodStudios, cb);
    };

    this.GetAnimalKingdomSchedule = function(cb)
    {
        this.GetSchedule(ID_AnimalKingdom, cb);
    };
};

// export module object
module.exports = DisneyAPI;

