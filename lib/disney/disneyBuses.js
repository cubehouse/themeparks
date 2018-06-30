"use strict";

const EventEmitter = require("events");

const couchbaseChannelDisney = require("./couchbaseChannelDisney");
const Facilities = require("./disneyFacilityChannel");
const DebugLog = require("../debugPrint.js");
const Cache = require("../cache");
const moment = require("moment");

const s_ParkID = Symbol();
const s_Channel = Symbol();
const s_Facilities = Symbol();
const s_BusVersion = Symbol();
const s_PollInterval = Symbol();

class DisneyLiveBusTimes extends EventEmitter {
    constructor(options = {}) {
        super();

        this[s_ParkID] = options.park_id === undefined ? "wdw" : options.park_id;
        this[s_BusVersion] = options.version === undefined ? "1_0" : options.version;

        // how often to poll for bus time updates (in seconds)
        this[s_PollInterval] = options.pollinterval === undefined ? 10 : options.pollinterval;

        // setup our facilities channel, we need this to sync before we get our bus times
        this[s_Facilities] = new Facilities({
            resort_Id: this[s_ParkID]
        });

        // NOTE - whilst there is a live channel for "Outpost Depot at Disney's Fort Wilderness Resort & Campground"
        //  our list of resorts doesn't return the ID 144943 needed to subscribe
        //  However, channel 80010408 has exactly the same data, so we're getting it via the "The Cabins at Disney's Fort Wilderness Resort" resort instead
    }

    /**
     * Callback for "updated" event from our couchbase channel class
     * @param {Object} doc 
     */
    OnDocUpdated(doc) {
        //console.log(JSON.stringify(doc, null, 2));
        const id = TidyDisneyID(doc.id);

        this[s_Facilities].GetFacilityName(id).then((name) => {
            if (doc.destinations === undefined) {
                return;
            }

            // add human-readable times and names to each destination
            const destinationPromises = [];
            for (let i = 0; i < doc.destinations.length; i++) {
                destinationPromises.push(this.ParseDestination(doc.destinations[i]));
            }
            Promise.all(destinationPromises).then((destinations) => {
                // emit events for each updated bus stop
                //console.log(JSON.stringify(destinations, null, 2));

                for (let i = 0, dest; dest = destinations[i++];) {
                    if (dest.arrivals !== undefined) {
                        for (let j = 0, arrival; arrival = dest.arrivals[j++];) {
                            this.emit("busupdate", {
                                from: name,
                                from_id: id,
                                to: dest.name,
                                to_id: TidyDisneyID(dest.id),
                                atStop: arrival.atStop,
                                atStopHuman: arrival.atStop_human,
                                atDestination: arrival.atDestination,
                                atDestinationHuman: arrival.atDestination_human,
                                frequency: dest.frequency,
                                frequencyHuman: dest.frequency_human
                            });
                        }
                    } else {
                        // emit event with boring "every 20 minutes" update
                        this.emit("busupdate", {
                            from: name,
                            from_id: id,
                            to: dest.name,
                            to_id: TidyDisneyID(dest.id),
                            frequency: dest.frequency,
                            frequencyHuman: dest.frequency_human
                        });
                    }
                }

            });
        });

    }

    ParseDestination(destination) {
        return this[s_Facilities].GetFacilityName(destination.id).then((name) => {
            destination.name = name;

            // use moment to make some human-readable times
            const now = moment();

            if (destination.frequency !== undefined) {
                const busFrequency = now.clone().add(destination.frequency, "seconds");
                destination.frequency_human = "every " + busFrequency.from(now, true);
            }

            // add human-readable strings to each arrival
            if (destination.arrivals !== undefined) {
                for (let i = 0; i < destination.arrivals.length; i++) {
                    destination.arrivals[i].atStop_human = moment(destination.arrivals[i].atStop).from(now);
                    destination.arrivals[i].atDestination_human = moment(destination.arrivals[i].atDestination).from(now);
                }
            }

            return Promise.resolve(destination);
        });
    }

    /**
     * Start fetching live bus time updates
     */
    Start() {
        if (!this[s_Facilities].Synced) {
            // start facilities syncing, 
            return this[s_Facilities].Start().then(() => {
                if (this[s_Channel] === undefined) {
                    // set this to something in case multiple callbacks arrive before we set it up
                    this[s_Channel] = 1;

                    // find all our resorts and build channel names
                    return this.GetChannelNames().then((channels) => {
                        // create our channel for fetching bus times
                        this[s_Channel] = new couchbaseChannelDisney({
                            dbName: this[s_ParkID] + "_buses",
                            channel: channels.join(","),
                            longpollDelay: 10, // delay each longpoll by 10 seconds (to avoid constant flooding of updates)
                        });

                        // setup puller hooks for document updates
                        this[s_Channel].on("updated", this.OnDocUpdated.bind(this));
                        this[s_Channel].on("error", this.Log.bind(this));

                        // start the channel fetching documents
                        this[s_Channel].Start();
                    });
                }
            });
        } else {
            return Promise.resolve();
        }
    }

    GetChannelNames() {
        return Cache.DB().then((db) => {
            return new Promise((resolve, reject) => {
                db.all("SELECT id, name FROM disneyFacilities WHERE entityType = ? AND park = ?", ["resort", this[s_ParkID]], (err, rows) => {
                    if (err) {
                        return reject(err);
                    }

                    const channels = [];
                    for (let i = 0; i < rows.length; i++) {
                        channels.push(`${this[s_ParkID]}.arrivals.${rows[i].id};entityType=resort.${this[s_BusVersion]}`);
                    }

                    return resolve(channels);
                });
            });
        });
    }

    /**
     * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
     * @param {...*} ToPrint Objects/strings to print
     * */
    Log() {
        return DebugLog(`${this.constructor.name}:`, ...arguments);
    }
}

const regexTidyID = /^([^;]+)/;

function TidyDisneyID(id) {
    const capture = regexTidyID.exec(id);
    if (capture && capture.length > 1) {
        return capture[1];
    }
    return id;
}

module.exports = DisneyLiveBusTimes;

if (!module.parent) {
    const BusTimes = new DisneyLiveBusTimes();

    BusTimes.on("busupdate", (bus) => {
        // only print if we have a live update
        if (bus.atStopHuman !== undefined) {
            console.log(`Bus Update from "${bus.from}"(${bus.from_id}) => "${bus.to}"(${bus.to_id})\n  Arriving ${bus.atStopHuman} (reach destination at ${bus.atDestinationHuman})`);
        }
    });

    BusTimes.Start();
}