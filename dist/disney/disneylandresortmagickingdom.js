"use strict";

// import the base Disney park class

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Disneyland Resort - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */

var DisneylandResortMagicKingdom = function (_DisneyBase) {
    _inherits(DisneylandResortMagicKingdom, _DisneyBase);

    /**
     * Create a new DisneylandResortMagicKingdom object
     */
    function DisneylandResortMagicKingdom() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, DisneylandResortMagicKingdom);

        options.name = options.name || "Magic Kingdom - Disneyland Resort";
        options.timezone = options.timezone || "America/Los_Angeles";

        // set park's location as it's entrance
        options.latitude = options.latitude || 33.810109;
        options.longitude = options.longitude || -117.918971;

        // Disney API configuration for Disneyland Resort Magic Kingdom
        options.resort_id = options.resort_id || "80008297";
        options.park_id = options.park_id || "330339";
        options.park_region = options.park_region || "us";

        // inherit from base class
        return _possibleConstructorReturn(this, (DisneylandResortMagicKingdom.__proto__ || Object.getPrototypeOf(DisneylandResortMagicKingdom)).call(this, options));
    }

    _createClass(DisneylandResortMagicKingdom, [{
        key: "FetchWaitTimesURL",
        get: function get() {
            // override the wait times URL for Disneyland Resort parks!
            return this.APIBase + "theme-parks/" + this.WDWParkID + "/wait-times";
        }
    }]);

    return DisneylandResortMagicKingdom;
}(DisneyBase);

module.exports = DisneylandResortMagicKingdom;
//# sourceMappingURL=disneylandresortmagickingdom.js.map