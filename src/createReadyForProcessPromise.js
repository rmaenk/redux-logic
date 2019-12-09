import { filter, scan, tap, takeWhile } from 'rxjs/operators';
import { identityFn } from './utils';

function createPendingMonitor({ act, logicName, monitor$, instanceId }) {
  const actions = [act];
  return monitor$.pipe(
    filter(x => actions.some(a => a === x.action || (a === x.nextAction && x.op === 'bottom'))),
    scan(
      (acc, x) => {
        const reverseOrderOfProcessHooks = true;
        // append a pending logic count
        var pending = acc.pending || 0;
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
          // pendingMonitor: instanceId // NOTE: this is for diagnostics only
        };
      },
      { pending: 1 /* action already at top of logic stack */ }
    ),
    // tap(function (x) { console.log("pendingMonitor$:", x);})
  );
}

export default function createReadyForProcessPromise({ action, logic, monitor$ }) {
  const useOld = false;
  if (useOld) return Promise.resolve(0);

  const instance = Date.now();

  const pendingMonitor$ =
    createPendingMonitor({ act: action, logicName: logic.name, monitor$, instance });

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
      takeWhile(x => x.pending)
    ].filter(identityFn)
  );
  return readyForProcess$.toPromise().then(() => instance);
}
