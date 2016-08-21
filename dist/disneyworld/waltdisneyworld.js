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
                return _possibleConstructorReturn(this, Object.getPrototypeOf(WaltDisneyWorldMagicKingdom).call(this, options));
        }

        return WaltDisneyWorldMagicKingdom;
}(DisneyBase);

/**
 * Walt Disney World Epcot
 * @class
 * @extends WaltDisneyWorldPark
 */


var WaltDisneyWorldEpcot = function (_DisneyBase2) {
        _inherits(WaltDisneyWorldEpcot, _DisneyBase2);

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

/**
 * Walt Disney World Hollywood Studios
 * @class
 * @extends WaltDisneyWorldPark
 */


var WaltDisneyWorldHollywoodStudios = function (_DisneyBase3) {
        _inherits(WaltDisneyWorldHollywoodStudios, _DisneyBase3);

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
                return _possibleConstructorReturn(this, Object.getPrototypeOf(WaltDisneyWorldHollywoodStudios).call(this, options));
        }

        return WaltDisneyWorldHollywoodStudios;
}(DisneyBase);

/**
 * Walt Disney World Animal Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */


var WaltDisneyWorldAnimalKingdom = function (_DisneyBase4) {
        _inherits(WaltDisneyWorldAnimalKingdom, _DisneyBase4);

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
                return _possibleConstructorReturn(this, Object.getPrototypeOf(WaltDisneyWorldAnimalKingdom).call(this, options));
        }

        return WaltDisneyWorldAnimalKingdom;
}(DisneyBase);

// export all the Florida parks


module.exports = [WaltDisneyWorldMagicKingdom, WaltDisneyWorldEpcot, WaltDisneyWorldHollywoodStudios, WaltDisneyWorldAnimalKingdom];
//# sourceMappingURL=waltdisneyworld.js.map