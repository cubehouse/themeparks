"use strict";

// import the base Disney park class

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Disneyland Paris - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */

var DisneylandParisMagicKingdom = function (_DisneyBase) {
        _inherits(DisneylandParisMagicKingdom, _DisneyBase);

        /**
         * Create a new DisneylandParisMagicKingdom object
         */
        function DisneylandParisMagicKingdom() {
                var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                _classCallCheck(this, DisneylandParisMagicKingdom);

                options.name = options.name || "Magic Kingdom - Disneyland Paris";
                options.timezone = options.timezone || "Europe/Paris";

                // set park's location as it's entrance
                options.latitude = options.latitude || 48.870321;
                options.longitude = options.longitude || 2.779672;

                // Disney API configuration for Disneyland Paris Magic Kingdom
                options.resort_id = options.resort_id || "dlp";
                options.park_id = options.park_id || "P1";
                options.park_region = options.park_region || "fr";

                // inherit from base class
                return _possibleConstructorReturn(this, (DisneylandParisMagicKingdom.__proto__ || Object.getPrototypeOf(DisneylandParisMagicKingdom)).call(this, options));
        }

        return DisneylandParisMagicKingdom;
}(DisneyBase);

module.exports = DisneylandParisMagicKingdom;
//# sourceMappingURL=disneylandparismagickingdom.js.map