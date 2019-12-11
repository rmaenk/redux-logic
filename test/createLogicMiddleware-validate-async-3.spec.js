import { before, after } from 'mocha';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

function waitAsync(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

describe('createLogicMiddleware-validate-async-3', () => {
  describe('[logicA, logicB, logicC] allow', () => {
    const actionFoo = { type: 'FOO' };
    const actionBarA = { type: 'BAR-A' };
    const actionBarB = { type: 'BAR-B' };
    const actionBarC = { type: 'BAR-C' };

    const expectedDispatchCalls = [actionBarC, actionBarB, actionBarA];

    const expectedMonitorFlow = [
      { action: { type: 'FOO' }, op: 'top' },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicC' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicC', nextAction: { type: 'FOO' }, shouldProcess: true },
      { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-C' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicC' },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
    ];

    describe('validateA=absent validateB=|timeout(50) allow(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await allow(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) allow(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|timeout(50) allow(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await allow(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) allow(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await allow(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) allow(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await allow(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) allow(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });
  });

  describe('[logicA, logicB, logicC] allow(undefined)', () => {
    const actionFoo = { type: 'FOO' };
    const actionBarA = { type: 'BAR-A' };
    const actionBarB = { type: 'BAR-B' };
    const actionBarC = { type: 'BAR-C' };

    const expectedDispatchCalls = [actionBarB, actionBarA];

    const expectedMonitorFlow = [
      { action: { type: 'FOO' }, op: 'top' },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'filtered', name: 'logicB', shouldProcess: true },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
    ];

    describe('validateA=absent validateB=|timeout(50) allow(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await allow(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) allow(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|timeout(50) allow(undefined)| validateC=allow(undefined) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await allow(undefined)| validateC=allow(undefined) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) allow(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await allow(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) allow(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              allow(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await allow(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) allow(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            allow(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });
  });

  describe('[logicA, logicB, logicC] reject', () => {
    const actionFoo = { type: 'FOO' };
    const actionBarA = { type: 'BAR-A' };
    const actionBarB = { type: 'BAR-B' };
    const actionBarC = { type: 'BAR-C' };

    const expectedDispatchCalls = [actionBarC, actionBarA];
    const expectedMonitorFlow = [
      { action: { type: 'FOO' }, op: 'top' },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: false },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicC' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicC', nextAction: { type: 'FOO' }, shouldProcess: true },
      { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-C' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicC' },
      { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
    ];

    describe('validateA=absent validateB=|timeout(50) reject(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await reject(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) reject(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|timeout(50) reject(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await reject(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) reject(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) reject(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await reject(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) reject(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) reject(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(actionFoo);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await reject(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) reject(FOO)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-C } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });
  });

  describe('[logicA, logicB, logicC] reject(undefined)', () => {
    const actionFoo = { type: 'FOO' };
    const actionBarA = { type: 'BAR-A' };
    const actionBarB = { type: 'BAR-B' };
    const actionBarC = { type: 'BAR-C' };

    const expectedDispatchCalls = [actionBarA];
    const expectedMonitorFlow = [
      { action: { type: 'FOO' }, op: 'top' },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
      { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
      { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'filtered', name: 'logicB', shouldProcess: false },
      { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
      { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A' } },
      { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
    ];

    describe('validateA=absent validateB=|timeout(50) reject(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await reject(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) reject(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|timeout(50) reject(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async no await reject(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=absent validateB=|async await(50) reject(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) reject(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await reject(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) reject(undefined)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|timeout(50) reject(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow, reject) {
            setTimeout(() => {
              reject(undefined);
            }, 50);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no await reject(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });

    describe('validateA=allow(FOO) validateB=|async await(50) reject(undefined)| validateC=allow(FOO) processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow, reject) {
            await waitAsync(50);
            reject(undefined);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        logicC = createLogic({
          name: 'logicC',
          type: 'FOO',
          validate(deps, allow, reject) {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarC);
            done();
          }
        });

        mw = createLogicMiddleware([logicA, logicB, logicC]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('dispatches { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(1);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual(expectedMonitorFlow);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });
  });

});
