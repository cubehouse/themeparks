"use strict";

// import the base Disney park class

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Disneyland Resort - California Adventure
 * @class
 * @extends WaltDisneyWorldPark
 */

var DisneylandResortCaliforniaAdventure = function (_DisneyBase) {
    _inherits(DisneylandResortCaliforniaAdventure, _DisneyBase);

    /**
     * Create a new DisneylandResortCaliforniaAdventure object
     */
    function DisneylandResortCaliforniaAdventure() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, DisneylandResortCaliforniaAdventure);

        options.name = options.name || "California Adventure - Disneyland Resort";
        options.timezone = options.timezone || "America/Los_Angeles";

        // set park's location as it's entrance
        options.latitude = options.latitude || 33.808720;
        options.longitude = options.longitude || -117.918990;

        // Disney API configuration for Disneyland Resort California Adventure
        options.resort_id = options.resort_id || "80008297";
        options.park_id = options.park_id || "336894";
        options.park_region = options.park_region || "us";

        // inherit from base class
        return _possibleConstructorReturn(this, (DisneylandResortCaliforniaAdventure.__proto__ || Object.getPrototypeOf(DisneylandResortCaliforniaAdventure)).call(this, options));
    }

    _createClass(DisneylandResortCaliforniaAdventure, [{
        key: "FetchWaitTimesURL",
        get: function get() {
            // override the wait times URL for Disneyland Resort parks!
            return this.APIBase + "theme-parks/" + this.WDWParkID + "/wait-times";
        }
    }]);

    return DisneylandResortCaliforniaAdventure;
}(DisneyBase);

module.exports = DisneylandResortCaliforniaAdventure;
//# sourceMappingURL=disneylandresortcaliforniaadventure.js.map