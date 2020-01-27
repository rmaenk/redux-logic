import "core-js/modules/es6.array.from";
import "core-js/modules/es6.regexp.to-string";
import "core-js/modules/es7.symbol.async-iterator";
import "core-js/modules/es6.symbol";
import "core-js/modules/web.dom.iterable";
import "core-js/modules/es6.function.name";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

import { merge, asapScheduler } from 'rxjs';
import { debounceTime, filter, mergeMap, share, tap, throttleTime, scan, first } from 'rxjs/operators';
import createLogicAction$ from './createLogicAction$';
import { identityFn } from './utils';
import createDispatch from './createDispatch';
import execProcessFn from './execProcessFn';
import createCancelled$ from './createCancelled$';
import createDepObject from './createDepObject';
import createReadyForProcess from './createReadyForProcessPromise';
var MATCH_ALL_TYPES = '*';
export default function logicWrapper(logic, store, deps, monitor$, asyncValidateHookOptions) {
  var name = logic.name,
      type = logic.type,
      cancelType = logic.cancelType,
      latest = logic.latest,
      debounce = logic.debounce,
      throttle = logic.throttle,
      processFn = logic.process,
      dispatchReturn = logic.processOptions.dispatchReturn;
  var getState = store.getState; // cancel on cancelType or if take latest specified

  var cancelTypes = [].concat(type && latest ? type : []).concat(cancelType || []);
  return function wrappedLogic(actionIn$) {
    // we want to share the same copy amongst all here
    var action$ = actionIn$.pipe(share());
    var cancel$ = cancelTypes.length ? action$.pipe(filter(function (action) {
      return matchesType(cancelTypes, action.type);
    })) : null;
    var hasIntercept = logic.validate || logic.transform; // shortcut optimization if no intercept let action fall through
    // and just exec the processFn

    var mergeMapOrTap = hasIntercept ? mergeMap(function (action) {
      return createLogicAction$({
        action: action,
        logic: logic,
        store: store,
        deps: deps,
        cancel$: cancel$,
        monitor$: monitor$,
        action$: action$,
        asyncValidateHookOptions: asyncValidateHookOptions
      });
    }) : tap(function (action) {
      // create promise before monitor$.next calls!
      var execWhenReady = createReadyForProcess({
        action: action,
        logic: logic,
        monitor$: monitor$,
        asyncValidateHookOptions: asyncValidateHookOptions
      }).execWhenReady; // mimic the events as if went through createLogicAction$
      // also in createLogicAction$

      monitor$.next({
        action: action,
        name: name,
        op: 'begin'
      });
      monitor$.next({
        action: action,
        nextAction: action,
        name: name,
        shouldProcess: true,
        op: 'next'
      });

      var _createCancelled$ = createCancelled$({
        action: action,
        cancel$: cancel$,
        monitor$: monitor$,
        logic: logic
      }),
          cancelled$ = _createCancelled$.cancelled$,
          setInterceptComplete = _createCancelled$.setInterceptComplete;

      var _createDispatch = createDispatch({
        action: action,
        cancel$: cancel$,
        cancelled$: cancelled$,
        logic: logic,
        monitor$: monitor$,
        store: store
      }),
          dispatch = _createDispatch.dispatch,
          dispatch$ = _createDispatch.dispatch$,
          done = _createDispatch.done;

      var ctx = {}; // no intercept, so empty ctx;

      var depObj = createDepObject({
        deps: deps,
        cancelled$: cancelled$,
        ctx: ctx,
        getState: getState,
        action: action,
        action$: action$
      });
      var isAsyncValidateHookEnabled = asyncValidateHookOptions.enable;

      var fn = function fn(skip) {
        setInterceptComplete();

        if (!skip) {
          execProcessFn({
            depObj: depObj,
            dispatch: dispatch,
            dispatch$: dispatch$,
            dispatchReturn: dispatchReturn,
            done: done,
            name: name,
            processFn: processFn
          });

          if (isAsyncValidateHookEnabled && !dispatch$.isStopped) {
            // process fn still uses dispatch asynchronously until done is called or infinite
            monitor$.next({
              action: action,
              op: 'dispFuture',
              name: name
            });
          }
        } else {
          dispatch$.complete();
        }
      };

      if (isAsyncValidateHookEnabled) {
        execWhenReady(fn);
      } else {
        asapScheduler.schedule(function () {
          return execWhenReady(fn);
        });
      }
    });

    function notifyIfExcluded(rxop, notifyCallback) {
      return function (source$) {
        var result$ = rxop(source$);
        merge(source$, result$).pipe(scan(function (acc, a) {
          var next = a;
          var prev = acc.next;

          if (prev && prev === next) {
            return {};
          }

          return {
            prev: prev,
            next: next
          };
        }, {})).subscribe(function (x) {
          if (x.prev && x.prev !== x.next) {
            notifyCallback(x.prev);
          }
        });
        return result$;
      };
    }

    function actionIsDebounced(a) {
      monitor$.next({
        action: a,
        name: name,
        op: 'end',
        reason: 'debounced'
      });
    }

    function actionIsThrottled(a) {
      monitor$.next({
        action: a,
        name: name,
        op: 'end',
        reason: 'throttled'
      });
    }

    var matchingOps = [// operations to perform, falsey filtered out
    filter(function (action) {
      return matchesType(type, action.type);
    }), debounce ? notifyIfExcluded(debounceTime(debounce), actionIsDebounced) : null, throttle ? notifyIfExcluded(throttleTime(throttle), actionIsThrottled) : null, mergeMapOrTap].filter(identityFn);
    var matchingAction$ = action$.pipe.apply(action$, _toConsumableArray(matchingOps)); // shortcut optimization
    // if type is match all '*', then no need to create other side of pipe

    if (type === MATCH_ALL_TYPES) {
      return matchingAction$;
    } // types that don't match will bypass this logic


    var nonMatchingAction$ = action$.pipe(filter(function (action) {
      return !matchesType(type, action.type);
    }));
    return merge(nonMatchingAction$, matchingAction$);
  };
}

function matchesType(tStrArrRe, type) {
  /* istanbul ignore if  */
  if (!tStrArrRe) {
    return false;
  } // nothing matches none


  if (_typeof(tStrArrRe) === 'symbol') {
    return tStrArrRe === type;
  }

  if (typeof tStrArrRe === 'string') {
    return tStrArrRe === type || tStrArrRe === MATCH_ALL_TYPES;
  }

  if (Array.isArray(tStrArrRe)) {
    return tStrArrRe.some(function (x) {
      return matchesType(x, type);
    });
  } // else assume it is a RegExp


  return tStrArrRe.test(type);
}