/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add_event_listener_for_tanyue": function() { return /* binding */ add_event_listener_for_tanyue; }
/* harmony export */ });
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ "./node_modules/axios/index.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! lodash-es */ "./node_modules/lodash-es/includes.js");
/* harmony import */ var _common_utils_is__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../common/utils/is */ "./src/common/utils/is.ts");
/* harmony import */ var _common_redux__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common/redux */ "./src/common/redux/index.ts");
/* harmony import */ var _common_interfaces__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../common/interfaces */ "./src/common/interfaces/index.ts");
/* harmony import */ var _common_reporter_model__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../common/reporter/model */ "./src/common/reporter/model.ts");
/* harmony import */ var _common_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../common/utils */ "./src/common/utils/index.ts");
/* harmony import */ var _action_types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./action_types */ "./src/webview/action_types/index.ts");
/* harmony import */ var _bridge__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./bridge */ "./src/webview/bridge/index.ts");
/* harmony import */ var _blockly__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./blockly */ "./src/webview/blockly/index.ts");
/* harmony import */ var _redux_utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./redux/utils */ "./src/webview/redux/utils.ts");
/* harmony import */ var _redux_reducers_data_actions__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./redux/reducers/data/actions */ "./src/webview/redux/reducers/data/actions.ts");
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
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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












/**
 * 探月作业批改页需求。通过Iframe通信，用来生成积木图片，应该在创作页初始化后在监听事件
 */
function add_event_listener_for_tanyue() {
    return __awaiter(this, void 0, Promise, function () {
        var reporter, env, data, err_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    printLog('Add Iframe eventListener, is_iframe: ', _common_utils_is__WEBPACK_IMPORTED_MODULE_1__.is_iframe);
                    reporter = (0,_common_reporter_model__WEBPACK_IMPORTED_MODULE_4__.get_reporter)();
                    reporter.add_log({
                        log: "Add Iframe eventListener, is_iframe: " + _common_utils_is__WEBPACK_IMPORTED_MODULE_1__.is_iframe,
                    });
                    if (!_common_utils_is__WEBPACK_IMPORTED_MODULE_1__.is_iframe) {
                        return [2 /*return*/];
                    }
                    env = _common_interfaces__WEBPACK_IMPORTED_MODULE_3__.EnvType.PRODUCTION;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios__WEBPACK_IMPORTED_MODULE_0___default().get('/config', { timeout: 3000 })];
                case 2:
                    data = (_a.sent()).data;
                    env = typeof data === 'string' ? data : data.env;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    printLog('Failed to get config, default to "production".');
                    reporter.add_log({
                        log: 'Failed 