/***/ "./src/common/redux/index.ts":
/*!***********************************!*\
  !*** ./src/common/redux/index.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NemoStore": function() { return /* reexport safe */ _store__WEBPACK_IMPORTED_MODULE_0__.NemoStore; }
/* harmony export */ });
/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./store */ "./src/common/redux/store.ts");



/***/ }),

/***/ "./src/common/redux/store.ts":
/*!***********************************!*\
  !*** ./src/common/redux/store.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NemoStore": function() { return /* binding */ NemoStore; }
/* harmony export */ });
/* harmony import */ var redux__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! redux */ "./node_modules/redux/es/index.js");
/* harmony import */ var redux_saga__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! redux-saga */ "./node_modules/redux-saga/dist/redux-saga-core-npm-proxy.esm.js");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/log */ "./src/common/utils/log.ts");
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



var default_root_saga = function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, true];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
};
var NemoStore = /** @class */ (function () {
    function NemoStore() {
    }
    NemoStore.create_store = function (root_reducer, root_saga) {
        if (root_saga === void 0) { root_saga = default_root_saga; }
        var middleware = [];
        var saga_middleware = (0,redux_saga__WEBPACK_IMPORTED_MODULE_1__.default)();
        middleware.push(saga_middleware);
        var compose_enhancers = typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
            window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
            // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
            }) : redux__WEBPACK_IMPORTED_MODULE_0__.compose;
        var enhancer = compose_enhancers(redux__WEBPACK_IMPORTED_MODULE_0__.applyMiddleware.apply(void 0, __spread(middleware)));
        var store = (0,redux__WEBPACK_IMPORTED_MODULE_0__.createStore)(root_reducer, enhancer);
        saga_middleware.run(root_saga);
        NemoStore.instance = store;
        if (false) {}
        return store;
    };
    NemoStore.init = function (root_reducer, root_saga) {
        return NemoStore.create_store(root_reducer, root_saga);
    };
    NemoStore.get_store = function () {
        if (!NemoStore.instance) {
            throw new Error('Store has not been initialized!');
        }
        return NemoStore.instance;
    };
    NemoStore.get_state = function () {
        if (!NemoStore.instance) {
            throw new Error('Store has not been initialized!');
        }
        return NemoStore.instance.getState();
    };
    NemoStore.get_bcm_state = function () {
        return NemoStore.get_state().bcm;
    };
    NemoStore.dispatch = function (action, env) {
        if (env === void 0) { env = 'ALL'; }
        var condition = false;
        if (env === 'ALL') {
            condition = true;
        }
        else {
            condition = env === 'PLAYER' ? false : !false;
        }
        condition && NemoStore.get_store().dispatch(action);
    };
    return NemoStore;
}());

(0,_utils_log__WEBPACK_IMPORTED_MODULE_2__.register)('store', NemoStore);


/***/ }),

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
/* harmony export */   "REPORT_DATA_REPLACER": function() { return /*