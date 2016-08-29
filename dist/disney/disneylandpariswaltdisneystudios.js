"use strict";

// import the base Disney park class

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Disneyland Paris - Walt Disney Studios
 * @class
 * @extends WaltDisneyWorldPark
 */

var DisneylandParisWaltDisneyStudios = function (_DisneyBase) {
        _inherits(DisneylandParisWaltDisneyStudios, _DisneyBase);

        /**
         * Create a new DisneylandParisWaltDisneyStudios object
         */
        function DisneylandParisWaltDisneyStudios() {
                var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                _classCallCheck(this, DisneylandParisWaltDisneyStudios);

                options.name = options.name || "Walt Disney Studios - Disneyland Paris";
                options.timezone = options.timezone || "Europe/Paris";

                // set park's location as it's entrance
                options.latitude = options.latitude || 48.868271;
                options.longitude = options.longitude || 2.780719;

                // Disney API configuration for Disneyland Paris Walt Disney Studios
                options.resort_id = options.resort_id || "dlp";
                options.park_id = options.park_id || "P2";
                options.park_region = options.park_region || "fr";

                // inherit from base class
                return _possibleConstructorReturn(this, (DisneylandParisWaltDisneyStudios.__proto__ || Object.getPrototypeOf(DisneylandParisWaltDisneyStudios)).call(this, options));
        }

        return DisneylandParisWaltDisneyStudios;
}(DisneyBase);

module.exports = DisneylandParisWaltDisneyStudios;
//# sourceMappingURL=disneylandpariswaltdisneystudios.js.map