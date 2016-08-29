"use strict";

// import the base Disney park class

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Walt Disney World Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */

var WaltDisneyWorldMagicKingdom = function (_DisneyBase) {
        _inherits(WaltDisneyWorldMagicKingdom, _DisneyBase);

        /**
         * Create a new WaltDisneyWorldMagicKingdom object
         */
        function WaltDisneyWorldMagicKingdom() {
                var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                _classCallCheck(this, WaltDisneyWorldMagicKingdom);

                options.name = options.name || "Magic Kingdom - Walt Disney World Florida";
                options.timezone = options.timezone || "America/New_York";

                // set resort's general center point
                options.latitude = options.latitude || 28.3852;
                options.longitude = options.longitude || -81.5639;

                // Disney API configuration for Magic Kingdom
                options.resort_id = options.resort_id || "80007798";
                options.park_id = options.park_id || "80007944";
                options.park_region = options.park_region || "us";

                // inherit from base class
                return _possibleConstructorReturn(this, (WaltDisneyWorldMagicKingdom.__proto__ || Object.getPrototypeOf(WaltDisneyWorldMagicKingdom)).call(this, options));
        }

        return WaltDisneyWorldMagicKingdom;
}(DisneyBase);

module.exports = WaltDisneyWorldMagicKingdom;
//# sourceMappingURL=waltdisneyworldmagickingdom.js.map