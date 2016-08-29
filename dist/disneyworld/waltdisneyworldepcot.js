"use strict";

// import the base Disney park class

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Walt Disney World Epcot
 * @class
 * @extends WaltDisneyWorldPark
 */

var WaltDisneyWorldEpcot = function (_DisneyBase) {
        _inherits(WaltDisneyWorldEpcot, _DisneyBase);

        /**
         * Create a new WaltDisneyWorldEpcot object
         */
        function WaltDisneyWorldEpcot() {
                var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                _classCallCheck(this, WaltDisneyWorldEpcot);

                options.name = options.name || "Epcot - Walt Disney World Florida";
                options.timezone = options.timezone || "America/New_York";

                // set resort's general center point
                options.latitude = options.latitude || 28.3747;
                options.longitude = options.longitude || -81.5494;

                // Disney API configuration for Epcot
                options.resort_id = options.resort_id || "80007798";
                options.park_id = options.park_id || "80007838";
                options.park_region = options.park_region || "us";

                // inherit from base class
                return _possibleConstructorReturn(this, Object.getPrototypeOf(WaltDisneyWorldEpcot).call(this, options));
        }

        return WaltDisneyWorldEpcot;
}(DisneyBase);

module.exports = WaltDisneyWorldEpcot;
//# sourceMappingURL=waltdisneyworldepcot.js.map