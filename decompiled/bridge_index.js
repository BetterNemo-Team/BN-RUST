/***/ "./src/webview/bridge/index.ts":
/*!*************************************!*\
  !*** ./src/webview/bridge/index.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "init": function() { return /* binding */ init; },
/* harmony export */   "on_sync_message": function() { return /* binding */ on_sync_message; },
/* harmony export */   "on_async_message": function() { return /* binding */ on_async_message; },
/* harmony export */   "post_message": function() { return /* binding */ post_message; }
/* harmony export */ });
/* harmony import */ var dsbridge__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dsbridge */ "./node_modules/dsbridge/index.js");
/* harmony import */ var dsbridge__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dsbridge__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/webview/utils/index.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config */ "./src/webview/config/index.ts");
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../package.json */ "./package.json");
/* harmony import */ var _common_reporter_model__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../common/reporter/model */ "./src/common/reporter/model.ts");
/* harmony import */ var _messages__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./messages */ "./src/webview/bridge/messages.ts");
/* harmony import */ var _plugin_model__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./plugin/model */ "./src/webview/bridge/plugin/model.ts");
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./const */ "./src/webview/bridge/const.ts");
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








/**
 * 注册dsBridge消息的监听函数。
 * 初始化对应的api环境配置，默认为production。
 * 并且初始化其他相关通信渠道，比如插件的通信渠道。
 */
function init() {
    dsbridge__WEBPACK_IMPORTED_MODULE_0___default().register(_const__WEBPACK_IMPORTED_MODULE_7__.BridgeReceiveNamespace.Sync, on_sync_message);
    dsbridge__WEBPACK_IMPORTED_MODULE_0___default().registerAsyn(_const__WEBPACK_IMPORTED_MODULE_7__.BridgeReceiveNamespace.Async, on_async_message);
    var env = post_message('GET_ENV');
    var config = (0,_config__WEBPACK_IMPORTED_MODULE_2__.cfg)(env);
    (0,_common_reporter_model__WEBPACK_IMPORTED_MODULE_4__.get_reporter)().set_ext_data({ api_env: config.env });
    /**
     * 初始化插件的bridge
     */
    (0,_plugin_model__WEBPACK_IMPORTED_MODULE_6__.get_plugin_bridge)({
        api_env: config.env,
        version: _package_json__WEBPACK_IMPORTED_MODULE_3__.version,
    });
    if (!env || env === 'test' || env === 'development') {
        Promise.all(/*! import() */[__webpack_require__.e("vendors-node_modules_vconsole_dist_vconsole_min_js"), __webpack_require__.e("src_webview_debug_custom_vconsole_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../debug/custom_vconsole */ "./src/webview/debug/custom_vconsole.ts"))
            .then(function (_a) {
            var get_custom_vconsole = _a.get_custom_vconsole;
            get_custom_vconsole();
        })
            .catch(function (err) {
            console.error('Cannot get custom vconsole ', err);
        });
    }
}
/**
 * 接收到IOS/Android的同步消息时的响应函数，并返回结果
 * @param type 消息类型
 * @param payload 消息的参数
 * @param callback IOS/Android提供的回调函数
 */
function on_sync_message(type, payload) {
    var action = _utils__WEBPACK_IMPORTED_MODULE_1__.Utils.get_action(type, payload);
    try {
        var res = (0,_messages__WEBPACK_IMPORTED_MODULE_5__.handle_sync_message)(action);
        return res !== undefined ? res : JSON.stringify({ status: true, message: 'success' });
    }
    catch (e) {
        var ret_value = {
            status: false,
            message: e.message,
        };
        var ret_value_str = JSON.stringify(ret_value);
        _utils__WEBPACK_IMPORTED_MODULE_1__.Utils.log.dError(ret_value_str);
        return ret_value_str;
    }
}
/**
 * 接收到IOS/Android的异步消息时的响应函数，并返回结果
 * @param type 消息类型
 * @param payload 消息的参数
 * @param callback IOS/Android提供的回调函数
 */
function on_async_message(type, payload, callback) {
    if (callback === void 0) { callback = function () { return undefined; }; }
    return __awaiter(this, void 0, Promise, function () {
        var action, res, e_1, ret_value, ret_value_str;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    action = _utils__WEBPACK_IMPORTED_MODULE_1__.Utils.get_action(type, payload);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0,_messages__WEBPACK_IMPORTED_MODULE_5__.handle_async_message)(action, callback)];
                case 2:
                    res = _a.sent();
                    if (res !== _messages__WEBPACK_IMPORTED_MODULE_5__.no_async_return) {
                        callback(res);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    ret_value = {
                        status: false,
                        message: e_1.message,
                   