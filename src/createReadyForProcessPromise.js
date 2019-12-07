import { filter, scan, tap, takeWhile } from 'rxjs/operators';

function createPendingMonitor(monitor$, instanceId, act) {
  let action = act;
  return monitor$.pipe(
    filter(x => x.action === action || (x.nextAction === action && x.op === 'bottom')),
    scan(
      (acc, x) => {
        // append a pending logic count
        var pending = acc.pending || 0;
        // eslint-disable-next-line default-case
        switch (x.op) {
          case 'top': // action at top of logic stack
            // skip, already counted as initial value
            break;
          case 'begin': // starting into a logic
            pending += 1;
            break;
          case 'nextDisp': // action changed type and dispatched
            pending -= 1; // 'nextDisp' op
            pending -= 1; // emulate 'bottom' op
   // TODO: action = x.dispAction; // change context action for this instance of pending monitor
            break;
          case 'next': // action moved in stack to next logic/middleware
            pending -= 1;
            action = x.nextAction; // change context action for this instance of pending monitor
            break;
          case 'filtered': // action filtered
            pending -= 1; // 'filtered' op
            pending -= 1; // emulate 'bottom' op
            break;
          case 'bottom': // action cleared bottom of logic stack
            pending -= 1;
            // action = x.nextAction; // change context action for this instance of pending monitor
            break;
          case 'end': // completed from a logic
            pending -= 1;
            break;
          case 'dispatchError': // error when dispatching
          case 'cancelled':
            // action cancelled before intercept complete
            // dispCancelled is not included here since
            // already accounted for in the 'end' op
            pending -= 1;
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

export default function createReadyForProcessPromise({action, logic, monitor$}) {
  const useOld = false;
  if (useOld) return Promise.resolve(0);

  const instance = Date.now();

  // eslint-disable-next-line no-console
  // console.log('pending monitor instance created:', instance,
  //  'time:', new Date(instance), action, logic);
  const pendingMonitor$ = createPendingMonitor(monitor$, instance, action);

  // eslint-disable-next-line no-console
  // console.log('pending:', 1, 'instance=', instance,
  //   'action is already on stack top (pending=1).');
  const readyForProcess$ = pendingMonitor$.pipe(
    // eslint-disable-next-line no-console
    // tap(x => console.log('pending:', x.pending, 'instance=', instance, x)),
    takeWhile(x => x.pending)
  );
  return readyForProcess$.toPromise().then(() => instance);
}
