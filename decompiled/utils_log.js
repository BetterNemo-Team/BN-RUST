/***/ "./src/common/utils/log.ts":
/*!*********************************!*\
  !*** ./src/common/utils/log.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "log": function() { return /* binding */ log; },
/* harmony export */   "warn": function() { return /* binding */ warn; },
/* harmony export */   "error": function() { return /* binding */ error; },
/* harmony export */   "dLog": function() { return /* binding */ dLog; },
/* harmony export */   "dWarn": function() { return /* binding */ dWarn; },
/* harmony export */   "dError": function() { return /* binding */ dError; },
/* harmony export */   "register": function() { return /* binding */ register; }
/* harmony export */ });
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (undefined && undefined.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
function log() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
    console.log.apply(console, __spread(msg));
}
function warn() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
    console.warn.apply(console, __spread(msg));
}
function error() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
    console.error.apply(console, __spread(msg));
}
function dLog() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
     false && 0;
}
function dWarn() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
     false && 0;
}
function dError() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
     false && 0;
}
function register(key, obj) {
    if (false) {}
}


/***/ }),

/***/ "./src/common/utils/name.ts":
/*!**********************************!*\
  !*** ./src/common/utils/name.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "get_unique_numbered_name": function() { return /* binding */ get_unique_numbered_name; }
/* harmony export */ });
/**
 * Get unique numbered name
 *
 * @param seed
 * @param pool
 */
function get_unique_numbered_name(seed, pool) {
    var index = pool.indexOf(seed);
    while (index >= 0) {
        var match = seed.match(/^(.*?)(\d+)$/);
        if (!match) {
            seed += '1';
        }
        else {
            seed = match[1] + get_increased_number(match[2]);
        }
        index = pool.indexOf(seed);
    }
    return seed;
}
/**
 * Get increased number
 *
 * @param name_number
 */
function get_increased_number(name_number) {
    return parseInt(name_number, 10) + 1;
}


/***/ }),

/***/ "./src/common/utils/sentry.ts":
/*!************************************!*\
  !*** ./src/common/utils/sentry.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "init": function() { return /* binding */ init; }
/* harmony export */ });
/* harmony import */ var _sentry_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @sentry/browser */ "./node_modules/@sentry/browser/esm/sdk.js");
/* harmony import */ var nemo_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nemo/config */ "./config/index.ts");


var config = (0,nemo_config__WEBPACK_IMPORTED_MODULE_0__.static_cfg)();
function init(release_name) {
    _sentry_browser__WEBPACK_IMPORTED_MODULE_1__.init({
        dsn: config.sentry_dsn,
        release: release_name + "@" + config.version + "production",
        environment: 'production',
    });
}


/***/ }),

/***/ "./src/helps/components/common/base_wrap/index.tsx":
/*!*********************************************************!*\
  !*** ./src/helps/components/common/base_wrap/index.tsx ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HelpWrap": function() { return /* binding */ HelpWrap; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../utils */ "./src/helps/utils.ts");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./style.scss */ "./src/helps/components/common/base_wrap/style.scss");



var HelpWrap = function (props) {
    var children = props.children, className = props.className;
    var classes = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.get_adapt_class_name)('help_wrap');
    classes += className ? " " + className : '';
    return (react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", { className: classes, style: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.is_ipad)() ? {} : { height: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.get_body_height)() } }, children));
};


/***/ }),

/***/ "./src/helps/components/common/paragraph/index.tsx":
/*!*********************************************************!*\
  !*** ./src/helps/components/common/paragraph/index.tsx ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HelpParagraph": function() { return /* binding */ HelpParagraph; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../utils */ "./src/helps/utils.ts");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./style.scss */ "./src/helps/components/common/paragraph/style.scss");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var HelpParagraph = /** @class */ (function (_super) {
    __extends(HelpParagraph, _super);
    function HelpParagraph(