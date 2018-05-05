// include core Park class
const Park = require("../park");

const GeoLocation = require("../geoLocation");

const cheerio = require("cheerio");
const Moment = require("moment-timezone");

const s_parkURL = Symbol();

const USJ_RIDES = {
  "セサミのビッグ・ドライブ": {
    "name" : "Sesame's Big Drive",
    "id": "AT000701"
  },
  "ビッグバードのビッグトップ・サーカス": {
    "name": "Big Bird's Big Top Circus",
    "id": "AT000812"
  },
  "ハローキティのリボン・コレクション": {
    "name": "Hello Kitty's Ribbon Collection",
    "id": "AT000684"
  },
  "ハローキティのカップケーキ・ドリーム": {
    "name": "Hello Kitty's Cupcake Dream",
    "id": "AT000683"
  },
  "エルモのゴーゴー・スケートボード": {
    "name": "Elmo's Go-Go Skateboard",
    "id": "AT000780"
  },
  "美少女戦士セーラームーン・ザ・ミラクル 4-D": {
    "name": "Sailor Moon The Dream 4-D",
    "id": "AT000902"
  },
  "エルモのリトル・ドライブ": {
    "name": "Elmo's Little Drive",
    "id": "AT000813"
  },
  "バックドラフト™": {
    "name": "Backdraft",
    "id": "AT000007"
  },
  "モッピーのバルーン・トリップ": {
    "name": "Moppy's Balloon Trip",
    "id": "AT000781"
  },
  "ハリウッド・ドリーム・ザ・ライド": {
    "name": "Hollywood Dream - The Ride",
    "id": "AT000548"
  },
  "スヌーピーのグレートレース™": {
    "name": "Snoopy's Great Race",
    "id": "AT000040"
  },
  "ターミネーター 2:3-D®": {
    "name": "Terminator 2 3-D",
    "id": "AT000005"
  },
  "ジュラシック・パーク・ザ・ライド™": {
    "name": "Jurassic Park - The Ride",
    "id": "AT000002"
  },
  "フライト・オブ・ザ・ヒッポグリフ™": {
    "name": "Flight of the Hippogriff",
    "id": "AT000747"
  },
  "アメージング・アドベンチャー・オブ・スパイダーマン・ザ・ライド 4K3D": {
    "name": "Amazing Adventure of Spider-Man The Ride 4K3D",
    "id": "AT000159"
  },
  "ジョーズ™": {
    "name": "Jaws",
    "id": "AT000001"
  },
  "ハリウッド・ドリーム・ザ・ライド～バックドロップ～": {
    "name": "Hollywood Dream - The Ride ~ Backdrop ~",
    "id": "AT000702"
  },
  "ザ・フライング・ダイナソー": {
    "name": "The Flying Dinosaur",
    "id": "AT000797"
  },
  "フライング・スヌーピー": {
    "name": "Flying Snoopy",
    "id": "AT000682"
  },
  "ハリー・ポッター・アンド・ザ・フォービドゥン・ジャーニー™": {
    "name": "Harry Potter and the Forbidden Journey",
    "id": "AT000746"
  },
  "モンスターハンター・ザ・リアル": {
    "name": "Monster Hunter",
    "id": "AT000901"
  },
  "ミニオン・ハチャメチャ・ライド": {
    "name": "Despicable Me - Minion Mayhem",
    "id": "AT000853"
  },
  "エルモのバブル・バブル": {
    "name": "Elmo's Bubble Bubble",
    "id": "AT000814"
  },
  "ファイナルファンタジー XRライド": {
    "name": "Final Fantasy XR Ride",
    "id": "AT000899"
  },
}
/**
 * Implements the Universal Japan API.
 * @class
 * @extends Park
 */
class UniversalStudiosJapan extends Park {
    /**
     * Create new UniversalStudiosJapan Object.
     * @param {Object} options
     * @param {String} [options.api_base] API URL base for accessing API
     * @param {String} [options.api_langauge] Language ID for API results (default: 1)
     */
    constructor(options = {}) {
        options.name = options.name || "Universal Studios Japan";

        // set park's location as it's entrance
        options.latitude = options.latitude || 34.665482;
        options.longitude = options.longitude || 135.432360;

        options.timezone = "Asia/Tokyo";

        // inherit from base class
        super(options);

        this[s_parkURL] = options.park_url || "http://ar02.biglobe.ne.jp/app/waittime/waittime.json"
    }

    /**
     * Fetch Universal Japan's waiting times
     * @returns {Promise}
     */
    FetchWaitTimes() {
        return new Promise((resolve, reject) => {
            this.Log("Running Universal Studios Japan");
            this.HTTP({
                url: this[s_parkURL],
            }).then((body) => {
                // check the response is as we expect
                if (!body) {
                    this.Log(`Error parsing Universal Studios Japan response: ${body}`);
                    return reject("Unable to parse Universal Studios Japan wait times response");
                }
                if (body.status != 0) {
                    for(var key in USJ_RIDES) {
                      var ride = USJ_RIDES[key];
                      var rideObject = this.GetRideObject({
                          id: ride.id,
                          name: ride.name
                      });
                      rideObject.WaitTime = -1;
                    }
                }
                else {
                  // loop through each zone
                  body.list.forEach((info) => {
                      var rides = info.rows
                      var wait = parseInt(info.wait.replace('分', '').replace(/^\s+|\s+$/g, ''))

                      // loop through each ride
                      for (var rideIDX = 0, ride; ride = rides[rideIDX++];) {
                          var name = ride.text;
                          if(ride.text in USJ_RIDES) {
                            name = USJ_RIDES[ride.text].name;
                          }
                          var rideObject = this.GetRideObject({
                              id: ride.aid,
                              name: name
                          });
                          rideObject.WaitTime = wait;
                      }
                  });
                }

                return resolve();
            }, reject);
        });
    }

    BuildEmptyPark() {
    }
}

// export the class
module.exports = UniversalStudiosJapan;
