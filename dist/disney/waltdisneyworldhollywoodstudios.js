"use strict";

// import the base Disney park class

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Walt Disney World Hollywood Studios
 * @class
 * @extends WaltDisneyWorldPark
 */

var WaltDisneyWorldHollywoodStudios = function (_DisneyBase) {
        _inherits(WaltDisneyWorldHollywoodStudios, _DisneyBase);

        /**
         * Create a new WaltDisneyWorldHollywoodStudios object
         */
        function WaltDisneyWorldHollywoodStudios() {
                var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                _classCallCheck(this, WaltDisneyWorldHollywoodStudios);

                options.name = options.name || "Hollywood Studios - Walt Disney World Florida";
                options.timezone = options.timezone || "America/New_York";

                // set resort's general center point
                options.latitude = options.latitude || 28.3575;
                options.longitude = options.longitude || -81.5582;

                // Disney API configuration for Hollywood Studios
                options.resort_id = options.resort_id || "80007798";
                options.park_id = options.park_id || "80007998";
                options.park_region = options.park_region || "us";

                // inherit from base class
                return _possibleConstructorReturn(this, (WaltDisneyWorldHollywoodStudios.__proto__ || Object.getPrototypeOf(WaltDisneyWorldHollywoodStudios)).call(this, options));
        }

        return WaltDisneyWorldHollywoodStudios;
}(DisneyBase);

module.exports = WaltDisneyWorldHollywoodStudios;
//# sourceMappingURL=waltdisneyworldhollywoodstudios.js.map