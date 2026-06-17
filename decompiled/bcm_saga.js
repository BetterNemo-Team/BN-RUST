/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "saga_load_bcm": function() { return /* binding */ saga_load_bcm; }
/* harmony export */ });
/* harmony import */ var redux_saga_effects__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! redux-saga/effects */ "./node_modules/redux-saga/dist/redux-saga-effects-npm-proxy.esm.js");
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! lodash-es */ "./node_modules/lodash-es/size.js");
/* harmony import */ var common_interfaces__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/interfaces */ "./src/common/interfaces/index.ts");
/* harmony import */ var common_cloud_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! common/cloud/utils */ "./src/common/cloud/utils.ts");
/* harmony import */ var common_api_interfaces__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! common/api/interfaces */ "./src/common/api/interfaces.ts");
/* harmony import */ var common_reporter_model__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! common/reporter/model */ "./src/common/reporter/model.ts");
/* harmony import */ var webview_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! webview/utils */ "./src/webview/utils/index.ts");
/* harmony import */ var webview_api__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! webview/api */ "./src/webview/api/index.ts");
/* harmony import */ var webview_events_native__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! webview/events/native */ "./src/webview/events/native.ts");
/* harmony import */ var webview_heart__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! webview/heart */ "./src/webview/heart/index.ts");
/* harmony import */ var webview_redux_index__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! webview/redux/index */ "./src/webview/redux/index.ts");
/* harmony import */ var webview_redux_common_action_types__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! webview/redux/common/action_types */ "./src/webview/redux/common/action_types.ts");
/* harmony import */ var webview_redux_utils__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! webview/redux/utils */ "./src/webview/redux/utils.ts");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../../../i18n */ "./src/i18n/index.ts");
/* harmony import */ var _variable_actions__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./variable/actions */ "./src/webview/redux/reducers/state/variable/actions.ts");
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















function saga_load_bcm() {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0,redux_saga_effects__WEBPACK_IMPORTED_MODULE_0__.takeLatest)(webview_redux_common_action_types__WEBPACK_IMPORTED_MODULE_10__.LOAD_BCM, load_bcm_from_source)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}
function load_bcm_from_source(action) {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0,redux_saga_effects__WEBPACK_IMPORTED_MODULE_0__.call)(load_bcm, action)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}
function load_bcm(action) {
    var reporter = (0,common_reporter_model__WEBPACK_IMPORTED_MODULE_4__.get_reporter)();
    try {
        var state_1 = webview_redux_index__WEBPACK_IMPORTED_MODULE_9__.NemoStore.get_state();
        var work_id = String(state_1.data.work_id || '');
        var cloud_variables = (0,common_cloud_utils__WEBPACK_IMPORTED_MODULE_2__.get_cloud_variables)(webview_redux_index__WEBPACK_IMPORTED_MODULE_9__.NemoStore.get_bcm_state().variable);
        var is_login = state_1.data.is_login;
        var cloud_variable_size = lodash_es__WEBPACK_IMPORTED_MODULE_14__.default(cloud_variables);
        reporter.add_log({
            log: "[Load bcm saga] work_id: " + work_id + "; is_login: " + is_login + "; cv_size: " + cloud_variable_size,
        });
        if (!work_id || !is_login || !cloud_variable_size) {
            (0,webview_redux_utils__WEBPACK_IMPORTED_MODULE_11__.set_state_inited)(true);
            return;
        }
        (0,webview_api__WEBPACK_IMPORTED_MODULE_6__.fetch_cloud_variables)(Number(work_id))
            .then(function (data) {
            reporter.add_log({
                log: "[Fetch cloud variables] " + data.status,
            });
            if (data.status === common_api_interfaces__WEBPACK_IMPORTED_MODULE_3__.FetchStatus.Success) {
                reporter.add_log({
                    log: "[Fetch cloud variables] length: " + data.result.length,
                    report_immediately: true,
                });
                if (data.result.length <= 0) {
                    return;
                }
                data.result.forEach(function (variable) {
                    var variables = state_1.bcm.variable;
                    var local_var = variables.variable_dict && variables.variable_dict[variable.id];
                    if (local_var) {
                        (0,webview_heart__WEBPACK_IMPORTED_MODULE_8__.get_webview_heart)().get_heart().get_runtime_manager().set_variable(variable.cvid, variable.value === undefined ? NaN : variable.value, '', '');
                        webview_redux_index__WEBPACK_IMPORTED_MODULE_9__.NemoStore.get_store().dispatch((0,_variable_actions__WEBPACK_IMPORTED_MODULE_13__.action_modify_variables)({ id: variable.id, property: 'value', value: variable.value }));
                    }
                });
            }
            else {
                reporter.add_log({
                    log: "[Fetch cloud variables] " + data.result.error_code,
                    report_immediately: true,
                });
                if (data.result.error_code !== 422) {
                    // TODO 这里不能引用 cloud_manager，会出现循环引用，等清理云变量模块的时候再一起处理
                    // default_cloud_config.reset_cloud_values()