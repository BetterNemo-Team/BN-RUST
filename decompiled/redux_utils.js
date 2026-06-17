/***/ "./src/common/redux/utils.ts":
/*!***********************************!*\
  !*** ./src/common/redux/utils.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "get_variable_by_id": function() { return /* binding */ get_variable_by_id; }
/* harmony export */ });
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/log */ "./src/common/utils/log.ts");

/**
 * Get variable by its id
 *
 * @param variable_state
 * @param variable_id
 */
function get_variable_by_id(variable_state, variable_id) {
    var variable = variable_state.variable_dict[variable_id];
    if (!variable) {
        (0,_utils_log__WEBPACK_IMPORTED_MODULE_0__.dLog)("Variable " + variable_id + " doesn't not exist");
    }
    return variable;
}


/***/ }),

/***/ "./src/common/reporter/const.ts":
/*!**************************************!*\
  !*** ./src/common/reporter/const.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LogLevel": function() { return /* binding */ LogLevel; },
/* harmony export */   "REPORT_DATA_REPLACER": function() { return /* binding */ REPORT_DATA_REPLACER; },
/* harmony export */   "PRODUCT_CODE": function() { return /* binding */ PRODUCT_CODE; },
/* harmony export */   "REPORT_EVENT_ID": function() { return /* binding */ REPORT_EVENT_ID; },
/* harmony export */   "REPORT_API": function() { return /* binding */ REPORT_API; }
/* harmony export */ });
/**
 * 日志等级
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["Info"] = "INFO";
    LogLevel["Warning"] = "WARNING";
    LogLevel["Error"] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * 简化上报数据的标准格式。
 * 简写的字段可以被Kafka日志库识别。
 */
var REPORT_DATA_REPLACER = {
    meta: 'm',
    id: 'i',
    device_type: 'd',
    product_code: 'p',
    ext: 'e',
    'finger-print': 'fp',
    body: 'b',
    timestamp: 't',
    event_id: 'e',
    biz_data: 'd',
    is_dev: 'tst',
};
var PRODUCT_CODE = 'sysinfo';
var REPORT_EVENT_ID = 'nemo_runtime_log';
var REPORT_API = 'https://collection.codemao.cn/report/sysinfo';


/***/ }),

/***/ "./src/common/reporter/model.ts":
/*!**************************************!*\
  !*** ./src/common/reporter/model.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Reporter": function() { return /* binding */ Reporter; },
/* harmony export */   "get_reporter": function() { return /* binding */ get_reporter; }
/* harmony export */ });
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! lodash-es */ "./node_modules/lodash-es/merge.js");
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! lodash-es */ "./node_modules/lodash-es/defaultTo.js");
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! lodash-es */ "./node_modules/lodash-es/property.js");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/index.js");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(uuid__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! axios */ "./node_modules/axios/index.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../package.json */ "./package.json");
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./const */ "./src/common/reporter/const.ts");
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};





var Reporter = /** @class */ (function () {
    function Reporter() {
        this.ext = {};
        this.logs = [];
        this.timeout = -1;
        this.set_ext_data(__assign(__assign({}, this.get_device_metrics()), { cur_tag: (0,uuid__WEBPACK_IMPORTED_MODULE_0__.v4)(), version: _package_json__WEBPACK_IMPORTED_MODULE_2__.version }));
        this.set_next_timer();
    }
    Reporter.prototype.set_ext_data = function (ext_data) {
        this.ext = (0,lodash_es__WEBPACK_IMPORTED_MODULE_4__.default)(this.ext, ext_data);
        return;
    };
    Reporter.prototype.add_log = function (opt) {
        return __awaiter(this, void 0, Promise, function () {
            var log, _a, level, _b, report_immediately;
            return __generator(this, function (_c) {
                switch (_c.l