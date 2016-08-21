"use strict";

// import the base Disney park class

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DisneyBase = require("./index.js");

/**
 * Shanghai Disney Resort - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */

var ShanghaiDisneyResortMagicKingdom = function (_DisneyBase) {
        _inherits(ShanghaiDisneyResortMagicKingdom, _DisneyBase);

        /**
         * Create a new ShanghaiDisneyResortMagicKingdom object
         */
        function ShanghaiDisneyResortMagicKingdom() {
                var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                _classCallCheck(this, ShanghaiDisneyResortMagicKingdom);

                options.name = options.name || "Magic Kingdom - Shanghai Disney Resort";
                options.timezone = options.timezone || "Asia/Shanghai";

                // set park's location as it's entrance
                options.latitude = options.latitude || 31.1433;
                options.longitude = options.longitude || 121.6580;

                // Disney API configuration for Shanghai Magic Kingdom
                options.resort_id = options.resort_id || "shdr";
                options.park_id = options.park_id || "desShanghaiDisneyland";
                options.park_region = options.park_region || "cn";

                // inherit from base class
                return _possibleConstructorReturn(this, Object.getPrototypeOf(ShanghaiDisneyResortMagicKingdom).call(this, options));
        }

        return ShanghaiDisneyResortMagicKingdom;
}(DisneyBase);

module.exports = [ShanghaiDisneyResortMagicKingdom];
//# sourceMappingURL=shanghaidisneyresort.js.map