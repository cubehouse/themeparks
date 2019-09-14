const cheerio = require('cheerio');
const Moment = require('moment');

// include core Park class
const Park = require('../park');

const USJ_RIDES = {
  'セサミのビッグ・ドライブ': {
    name: "Sesame's Big Drive",
    id: 'AT000701',
  },
  'ビッグバードのビッグトップ・サーカス': {
    name: "Big Bird's Big Top Circus",
    id: 'AT000812',
  },
  'ハローキティのリボン・コレクション': {
    name: "Hello Kitty's Ribbon Collection",
    id: 'AT000684',
  },
  'ハローキティのカップケーキ・ドリーム': {
    name: "Hello Kitty's Cupcake Dream",
    id: 'AT000683',
  },
  'エルモのゴーゴー・スケートボード': {
    name: "Elmo's Go-Go Skateboard",
    id: 'AT000780',
  },
  '美少女戦士セーラームーン・ザ・ミラクル 4-D': {
    name: 'Sailor Moon The Dream 4-D',
    id: 'AT000902',
  },
  'エルモのリトル・ドライブ': {
    name: "Elmo's Little Drive",
    id: 'AT000813',
  },
  'バックドラフト™': {
    name: 'Backdraft',
    id: 'AT000007',
  },
  'モッピーのバルーン・トリップ': {
    name: "Moppy's Balloon Trip",
    id: 'AT000781',
  },
  'ハリウッド・ドリーム・ザ・ライド': {
    name: 'Hollywood Dream - The Ride',
    id: 'AT000548',
  },
  'スヌーピーのグレートレース™': {
    name: "Snoopy's Great Race",
    id: 'AT000040',
  },
  'ターミネーター 2:3-D®': {
    name: 'Terminator 2 3-D',
    id: 'AT000005',
  },
  'ジュラシック・パーク・ザ・ライド™': {
    name: 'Jurassic Park - The Ride',
    id: 'AT000002',
  },
  'フライト・オブ・ザ・ヒッポグリフ™': {
    name: 'Flight of the Hippogriff',
    id: 'AT000747',
  },
  'アメージング・アドベンチャー・オブ・スパイダーマン・ザ・ライド 4K3D': {
    name: 'Amazing Adventure of Spider-Man The Ride 4K3D',
    id: 'AT000159',
  },
  'ジョーズ™': {
    name: 'Jaws',
    id: 'AT000001',
  },
  'ハリウッド・ドリーム・ザ・ライド～バックドロップ～': {
    name: 'Hollywood Dream - The Ride ~ Backdrop ~',
    id: 'AT000702',
  },
  'ザ・フライング・ダイナソー': {
    name: 'The Flying Dinosaur',
    id: 'AT000797',
  },
  'フライング・スヌーピー': {
    name: 'Flying Snoopy',
    id: 'AT000682',
  },
  'ハリー・ポッター・アンド・ザ・フォービドゥン・ジャーニー™': {
    name: 'Harry Potter and the Forbidden Journey',
    id: 'AT000746',
  },
  'モンスターハンター・ザ・リアル': {
    name: 'Monster Hunter',
    id: 'AT000901',
  },
  'ミニオン・ハチャメチャ・ライド': {
    name: 'Despicable Me - Minion Mayhem',
    id: 'AT000853',
  },
  'エルモのバブル・バブル': {
    name: "Elmo's Bubble Bubble",
    id: 'AT000814',
  },
  'ファイナルファンタジー XRライド': {
    name: 'Final Fantasy XR Ride',
    id: 'AT000899',
  },
};

const sParkURL = Symbol('Universal Studios Japan API URL Base');
const sParkCalendarURLBase = Symbol('Universal Studios Japan Calendar Base URL');

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
    options.name = options.name || 'Universal Studios Japan';

    // set park's location as it's entrance
    options.latitude = options.latitude || 34.665482;
    options.longitude = options.longitude || 135.432360;

    options.timezone = 'Asia/Tokyo';

    // inherit from base class
    super(options);

    this[sParkURL] = options.parkUrl || 'https://spap.usj.co.jp/app/waittime/waittime.json';
    this[sParkCalendarURLBase] = options.parkCalendarURL || 'https://www.usj.co.jp/e/parkguide/';
  }

  /**
   * Fetch Universal Japan's waiting times
   * @returns {Promise}
   */
  FetchWaitTimes() {
    return this.HTTP({
      url: this[sParkURL],
      mock: 'universalstudiosjapan_waittimes',
    }).then((body) => {
      // check the response is as we expect
      if (!body) {
        this.Log(`Error parsing Universal Studios Japan response: ${body}`);
        return Promise.reject(new Error('Unable to parse Universal Studios Japan wait times response'));
      }

      if (body.status !== 0) {
        // park is closed, inject in all our cached rides so we return something
        Object.keys(USJ_RIDES).forEach((key) => {
          const ride = USJ_RIDES[key];
          this.UpdateRide(ride.id, {
            name: ride.name,
            waitTime: -1,
          });
        });
      } else {
        // loop through each zone
        body.list.forEach((info) => {
          const rides = info.rows;

          // wait times are grouped together
          const wait = (info.wait === '休止中') ? -2 : (parseInt(info.wait.replace('分', '').replace(/^\s+|\s+$/g, ''), 10));

          // loop through each ride
          rides.forEach((ride) => {
            let name = ride.text;

            if (ride.text in USJ_RIDES) {
              // eslint-disable-next-line prefer-destructuring
              name = USJ_RIDES[ride.text].name;
            }

            this.UpdateRide(ride.aid, {
              name,
              waitTime: wait,
            });
          });
        });
      }

      return Promise.resolve();
    });
  }

  FetchOpeningTimes() {
    const now = this.Now();
    const endDate = now.clone().add(3, 'months');

    const monthFetches = [];
    for (const m = now.clone(); m.isSameOrBefore(endDate); m.add(1, 'month')) {
      monthFetches.push(this.GetCalendarMonth(m.year(), m.month()));
    }

    return Promise.all(monthFetches).then((months) => {
      months.forEach((month) => {
        month.forEach((day) => {
          this.Schedule.SetDate({
            openingTime: Moment.tz({
              date: day.date,
              month: day.month,
              year: day.year,
              hour: day.openHour,
              minutes: day.openMinutes,
            }, this.Timezone),
            closingTime: Moment.tz({
              date: day.date,
              month: day.month,
              year: day.year,
              hour: day.closeHour,
              minutes: day.closeMinutes,
            }, this.Timezone),
          });
        });
      });

      return Promise.resolve();
    });
  }

  GetCalendarMonth(year, month) {
    const monthString = month.toString().padStart(2, '0');
    return this.Cache.Wrap(`month_${year}_${monthString}`, () => {
      return this.HTTP({
        url: `${this[sParkCalendarURLBase]}${year}${monthString}.html`,
      }).then((resp) => {
        return Promise.resolve(this.ParseCalendarMonthHTML(resp, month, year));
      });
    }, 60 * 60 * 12);
  }

  ParseCalendarMonthHTML(html, month, year) {
    const $ = cheerio.load(html);

    const dates = [];

    $('#calemdar_table').find('tr').each((idx, el) => {
      const row = $(el);
      const columns = row.find('td');
      if (columns.length === 2) {
        const date = /^(\d+)/.exec($(columns[0]).html().trim());
        const times = /(\d+):(\d+)\s*&#x301C;\s*(\d+):(\d+)/.exec($(columns[1]).html().trim());

        if (date && times) {
          dates.push({
            year,
            month,
            date: Number(date[1]),
            openHour: Number(times[1]),
            openMinutes: Number(times[2]),
            closeHour: Number(times[3]),
            closeMinutes: Number(times[4]),
          });
        }
      }
    });

    return dates;
  }
}

// export the class
module.exports = UniversalStudiosJapan;
