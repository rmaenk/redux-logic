import { filter, scan, tap, first } from 'rxjs/operators';
import { identityFn } from './utils';

function createPendingMonitor({
  act, logicName, monitor$, instanceId, reverseOrderOfProcessHooks }) {
  const actions = [act];
  return monitor$.pipe(
    filter(x => actions.some(a => a === x.action || (a === x.nextAction && x.op === 'bottom'))),
    scan(
      (acc, x) => {
        // append a pending logic count
        var pending = acc.pending;
        var stop = acc.stop;
        // eslint-disable-next-line default-case
        switch (x.op) {
          case 'top': // action at top of logic stack
            // skip, already counted as initial value
            break;
          case 'begin': // starting into a logic
            pending += 1;
            if (reverseOrderOfProcessHooks && x.name !== logicName) {
              pending += 1;
            }
            break;
          case 'nextDisp': // action changed type and dispatched
            pending -= 2; // no next, then compensate absent 'bottom' op
            // TBD: not tested
            // if (reverseSortOrderOfProcessHooks && x.name !== logicName) {
            //   pending -= 1;
            // }

            // TBD: not tested, probably not needed
            // change context actions for this instance of pending monitor
            // actions.push(x.dispAction);
            break;
          case 'next': // action moved in stack to next logic/middleware
            pending -= 1;
            // change context actions for this instance of pending monitor
            actions.push(x.nextAction);
            break;
          case 'filtered': // action filtered
            pending -= 2; // no next, then compensate absent 'bottom' op
            break;
          case 'bottom': // action cleared bottom of logic stack
            pending -= 1;
            // TBD: not tested, probably not needed
            // change context actions for this instance of pending monitor
            // actions.push(x.nextAction);
            break;
          case 'end': // completed from a logic
            pending -= 1;
            break;
          case 'dispatchError': // error when dispatching
          case 'cancelled':
            // action cancelled before intercept complete
            // dispCancelled is not included here since
            // already accounted for in the 'end' op
            pending -= 2; // no next, then compensate absent 'bottom' op
            break;
        }

        // action[`pm${instanceId}`] = instanceId; // NOTE: this is for diagnostics only
        return {
          ...x,
          pending,
          stop
          // pendingMonitor: instanceId // NOTE: this is for diagnostics only
        };
      },
      { pending: 1 /* action already at top of logic stack */, stop: false }
    ),
    // tap(function (x) { console.log("pendingMonitor$:", x);})
  );
}

export default function createReadyForProcessPromise({
  action, logic, monitor$, asyncValidateHookOptions }) {
  if (!asyncValidateHookOptions.enable) return null;

  const instance = Date.now();

  const reverseOrderOfProcessHooks = !asyncValidateHookOptions.enable
    || !asyncValidateHookOptions.directOrderOfProcessHooks;
  const pendingMonitor$ =
    createPendingMonitor({
      act: action, logicName: logic.name, monitor$, instance, reverseOrderOfProcessHooks
    });

  const showTrace = false;
  if (showTrace) {
    // eslint-disable-next-line no-console
    console.log('-->',
      'pending monitor created,', 'instance:', instance, logic.name,
      '\n\ttime:', new Date(instance).toISOString(),
      '\n\taction:', JSON.stringify(action),
      '\n\tlogic:', JSON.stringify(logic),
      '<--');

    // eslint-disable-next-line no-console
    console.log('-->',
      'pending:', 1, 'instance=', instance, logic.name,
      '\n\ttime:', new Date(instance).toISOString(),
      '\n\top: top',
      '\n\taction is already on stack top (pending=1).',
      '<--');
  }
  const readyForProcess$ = pendingMonitor$.pipe(
    ...[
      // eslint-disable-next-line no-console
      showTrace ? tap(x => console.log('-->',
        'pending:', x.pending, 'instance=', instance, logic.name,
        '\n\top:', x.op,
        '\n\ttime:', new Date(instance).toISOString(),
        '\n\tentry:', JSON.stringify(x),
        '<--')) : null,

      first(x => x.pending <= 0 || x.stop)
    ].filter(identityFn)
  );

  let resolved = false;
  let rejected = false;
  let result = false;
  const readyForProcessPromise = new Promise((resolve, reject) => {
    const sub = readyForProcess$.subscribe({
      next(x) {
        result = x.stop;
      },
      error(err) {
        if (showTrace) {
          // eslint-disable-next-line no-console
          console.log('readyForProcess$ error', 'instance:', instance, err);
        }
        reject(err);
        rejected = true;
        result = err;
        sub.unsubscribe();
      },
      complete() {
        if (showTrace) {
          // eslint-disable-next-line no-console
          console.log('readyForProcess$ complete', 'instance:', instance);
        }
        resolve(result);
        resolved = true;
        sub.unsubscribe();
      }
    });
  });
  readyForProcessPromise.isResolved = () => resolved;
  readyForProcessPromise.isRejected = () => rejected;
  readyForProcessPromise.isFulfilled = () => resolved || rejected;
  readyForProcessPromise.getResult = () => result;
  return readyForProcessPromise;
}
