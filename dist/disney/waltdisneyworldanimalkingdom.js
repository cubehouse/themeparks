"use strict";

// import the base Disney park class

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Walt Disney World Animal Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */

var WaltDisneyWorldAnimalKingdom = function (_DisneyBase) {
        _inherits(WaltDisneyWorldAnimalKingdom, _DisneyBase);

        /**
         * Create a new WaltDisneyWorldAnimalKingdom object
         */
        function WaltDisneyWorldAnimalKingdom() {
                var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                _classCallCheck(this, WaltDisneyWorldAnimalKingdom);

                options.name = options.name || "Animal Kingdom - Walt Disney World Florida";
                options.timezone = options.timezone || "America/New_York";

                // set resort's general center point
                options.latitude = options.latitude || 28.3553;
                options.longitude = options.longitude || -81.5901;

                // Disney API configuration for Animal Kingdom
                options.resort_id = options.resort_id || "80007798";
                options.park_id = options.park_id || "80007823";
                options.park_region = options.park_region || "us";

                // inherit from base class
                return _possibleConstructorReturn(this, (WaltDisneyWorldAnimalKingdom.__proto__ || Object.getPrototypeOf(WaltDisneyWorldAnimalKingdom)).call(this, options));
        }

        return WaltDisneyWorldAnimalKingdom;
}(DisneyBase);

module.exports = WaltDisneyWorldAnimalKingdom;
//# sourceMappingURL=waltdisneyworldanimalkingdom.js.map