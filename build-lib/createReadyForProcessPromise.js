"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createReadyForProcessPromise;

require("core-js/modules/es6.array.from");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.keys");

require("core-js/modules/es6.promise");

require("core-js/modules/es6.function.name");

var _operators = require("rxjs/operators");

var _utils = require("./utils");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createPendingMonitor(_ref) {
  var act = _ref.act,
      logicName = _ref.logicName,
      monitor$ = _ref.monitor$,
      instanceId = _ref.instanceId,
      reverseOrderOfProcessHooks = _ref.reverseOrderOfProcessHooks;
  var actions = [act];
  return monitor$.pipe((0, _operators.filter)(function (x) {
    return actions.some(function (a) {
      return a === x.action || a === x.nextAction && x.op === 'bottom';
    });
  }), (0, _operators.scan)(function (acc, x) {
    // append a pending logic count
    var pending = acc.pending;
    var stop = acc.stop; // eslint-disable-next-line default-case

    switch (x.op) {
      case 'top':
        // action at top of logic stack
        // skip, already counted as initial value
        break;

      case 'begin':
        // starting into a logic
        pending += 1;

        if (reverseOrderOfProcessHooks && x.name !== logicName) {
          pending += 1;
        }

        break;

      case 'nextDisp':
        // action changed type and dispatched
        pending -= 2; // no next, then compensate absent 'bottom' op
        // TBD: not tested
        // if (reverseSortOrderOfProcessHooks && x.name !== logicName) {
        //   pending -= 1;
        // }
        // TBD: not tested, probably not needed
        // change context actions for this instance of pending monitor
        // actions.push(x.dispAction);

        break;

      case 'next':
        // action moved in stack to next logic/middleware
        pending -= 1; // change context actions for this instance of pending monitor

        actions.push(x.nextAction);
        break;

      case 'filtered':
        // action filtered
        pending -= 2; // no next, then compensate absent 'bottom' op

        break;

      case 'bottom':
        // action cleared bottom of logic stack
        pending -= 1; // TBD: not tested, probably not needed
        // change context actions for this instance of pending monitor
        // actions.push(x.nextAction);

        break;

      case 'dispFuture':
        // exit from process hook, but still uses dispatch asynchronously
        pending -= 1; // no immediate logic end, then compensate this

        break;

      case 'end':
        // completed from a logic
        pending -= 1;
        break;

      case 'dispatchError': // error when dispatching

      case 'cancelled':
        // action cancelled before intercept complete
        // dispCancelled is not included here since
        // already accounted for in the 'end' op
        pending -= 2; // no next, then compensate absent 'bottom' op

        break;
    } // action[`pm${instanceId}`] = instanceId; // NOTE: this is for diagnostics only


    return _objectSpread({}, x, {
      pending: pending,
      stop: stop // pendingMonitor: instanceId // NOTE: this is for diagnostics only

    });
  }, {
    pending: 1
    /* action already at top of logic stack */
    ,
    stop: false
  }) // tap(function (x) { console.log("pendingMonitor$:", x);})
  );
}

function createReadyForProcessPromise(_ref2) {
  var action = _ref2.action,
      logic = _ref2.logic,
      monitor$ = _ref2.monitor$,
      asyncValidateHookOptions = _ref2.asyncValidateHookOptions;
  if (!asyncValidateHookOptions.enable) return null;
  var instance = Date.now();
  var reverseOrderOfProcessHooks = !asyncValidateHookOptions.enable || !asyncValidateHookOptions.directOrderOfProcessHooks;
  var pendingMonitor$ = createPendingMonitor({
    act: action,
    logicName: logic.name,
    monitor$: monitor$,
    instance: instance,
    reverseOrderOfProcessHooks: reverseOrderOfProcessHooks
  });
  var showTrace = false;

  if (showTrace) {
    // eslint-disable-next-line no-console
    console.log('-->', 'pending monitor created,', 'instance:', instance, logic.name, '\n\ttime:', new Date(instance).toISOString(), '\n\taction:', JSON.stringify(action), '\n\tlogic:', JSON.stringify(logic), '<--'); // eslint-disable-next-line no-console

    console.log('-->', 'pending:', 1, 'instance=', instance, logic.name, '\n\ttime:', new Date(instance).toISOString(), '\n\top: top', '\n\taction is already on stack top (pending=1).', '<--');
  }

  var readyForProcess$ = pendingMonitor$.pipe.apply(pendingMonitor$, _toConsumableArray([// eslint-disable-next-line no-console
  showTrace ? (0, _operators.tap)(function (x) {
    return console.log('-->', 'pending:', x.pending, 'instance=', instance, logic.name, '\n\top:', x.op, '\n\ttime:', new Date(instance).toISOString(), '\n\tentry:', JSON.stringify(x), '<--');
  }) : null, (0, _operators.first)(function (x) {
    return x.pending <= 0 || x.stop;
  })].filter(_utils.identityFn)));
  var resolved = false;
  var rejected = false;
  var result = false;
  var readyForProcessPromise = new Promise(function (resolve, reject) {
    var sub = readyForProcess$.subscribe({
      next: function next(x) {
        result = x.stop;
      },
      error: function error(err) {
        if (showTrace) {
          // eslint-disable-next-line no-console
          console.log('readyForProcess$ error', 'instance:', instance, err);
        }

        reject(err);
        rejected = true;
        result = err;
        sub.unsubscribe();
      },
      complete: function complete() {
        if (showTrace) {
          // eslint-disable-next-line no-console
          console.log('readyForProcess$ complete', 'instance:', instance, 'skip process:', result);
        }

        resolve(result);
        resolved = true;
        sub.unsubscribe();
      }
    });
  });

  readyForProcessPromise.isResolved = function () {
    return resolved;
  };

  readyForProcessPromise.isRejected = function () {
    return rejected;
  };

  readyForProcessPromise.isFulfilled = function () {
    return resolved || rejected;
  };

  readyForProcessPromise.getResult = function () {
    return result;
  };

  return readyForProcessPromise;
}