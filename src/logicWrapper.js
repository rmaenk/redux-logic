import { Observable, merge, asapScheduler } from 'rxjs';
import { debounceTime, filter, map, mergeMap, share, tap, throttleTime, scan } from 'rxjs/operators';
import createLogicAction$ from './createLogicAction$';
import { identityFn } from './utils';
import createDispatch from './createDispatch';
import execProcessFn from './execProcessFn';
import createCancelled$ from './createCancelled$';
import createDepObject from './createDepObject';
import createReadyForProcessPromise from './createReadyForProcessPromise';

const MATCH_ALL_TYPES = '*';

export default function logicWrapper(logic, store, deps, monitor$) {
  const { name, type, cancelType, latest, debounce, throttle,
    process: processFn, processOptions: { dispatchReturn}} = logic;

  const { getState } = store;

  // cancel on cancelType or if take latest specified
  const cancelTypes = []
    .concat((type && latest) ? type : [])
    .concat(cancelType || []);

  return function wrappedLogic(actionIn$) {
    // we want to share the same copy amongst all here
    const action$ = actionIn$.pipe(share());

    const cancel$ = (cancelTypes.length) ?
      action$.pipe(
        filter(action => matchesType(cancelTypes, action.type))
      ) : null;

    const hasIntercept = logic.validate || logic.transform;

    // shortcut optimization if no intercept let action fall through
    // and just exec the processFn
    const mergeMapOrTap =
      (hasIntercept) ?
        mergeMap(action => {
          var readyForProcessPromise = createReadyForProcessPromise({action, logic, monitor$});
          return createLogicAction$({
            action, logic, store, deps, cancel$, monitor$, action$, readyForProcessPromise
          });
        }) :
        tap(action => {
          // create promise before monitor$.next calls!
          var readyForProcessPromise = createReadyForProcessPromise({action, logic, monitor$});
          // mimic the events as if went through createLogicAction$
          // also in createLogicAction$
          monitor$.next({ action, name, op: 'begin' });
          monitor$.next({ action, nextAction: action, name, shouldProcess: true, op: 'next' });
          const { cancelled$, setInterceptComplete } = createCancelled$({
            action, cancel$, monitor$, logic });
          const { dispatch, dispatch$, done } = createDispatch({
            action, cancel$, cancelled$, logic, monitor$, store });
          const ctx = {}; // no intercept, so empty ctx;
          const depObj = createDepObject({ deps, cancelled$, ctx, getState, action, action$ });
          readyForProcessPromise.then(pendingMonitorId => {
            setInterceptComplete();
            execProcessFn({ depObj, dispatch, dispatch$, dispatchReturn, done, name, processFn });
          });
        });

    function notifyIfExcluded(rxop, notifyCallback) {
      return (source$) => {
        var result$ = rxop(source$);

        merge(source$, result$)
          .pipe(scan((acc, a) => {
            var next = a;
            var prev = acc.next;
            if (prev && prev === next) {
              return {};
            }
            return { prev, next };
          }, {}))
          .subscribe(x => {
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
        name,
        op: 'end',
        reason: 'debounced'
      });
    }
    function actionIsThrottled(a) {
      monitor$.next({
        action: a,
        name,
        op: 'end',
        reason: 'throttled'
      });
    }
    const matchingOps = [ // operations to perform, falsey filtered out
      filter(action => matchesType(type, action.type)),
      (debounce) ? notifyIfExcluded(debounceTime(debounce), actionIsDebounced) : null,
      (throttle) ? notifyIfExcluded(throttleTime(throttle), actionIsThrottled) : null,
      mergeMapOrTap
    ].filter(identityFn);

    const matchingAction$ = action$.pipe(...matchingOps);

    // shortcut optimization
    // if type is match all '*', then no need to create other side of pipe
    if (type === MATCH_ALL_TYPES) {
      return matchingAction$;
    }

    // types that don't match will bypass this logic
    const nonMatchingAction$ = action$.pipe(
      filter(action => !matchesType(type, action.type))
    );

    return merge(
      nonMatchingAction$,
      matchingAction$
    );
  };
}

function matchesType(tStrArrRe, type) {
  /* istanbul ignore if  */
  if (!tStrArrRe) { return false; } // nothing matches none
  if (typeof tStrArrRe === 'symbol') {
    return (tStrArrRe === type);
  }
  if (typeof tStrArrRe === 'string') {
    return (tStrArrRe === type || tStrArrRe === MATCH_ALL_TYPES);
  }
  if (Array.isArray(tStrArrRe)) {
    return tStrArrRe.some(x => matchesType(x, type));
  }
  // else assume it is a RegExp
  return tStrArrRe.test(type);
}
