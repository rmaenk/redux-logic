import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';


describe('createLogicMiddleware-process-async', () => {
  /**
   * Interrupts async test hooks
   * @param hDone done callback of mocha test hook
   * @param timeout time is ms for waiting before interrupt a mocha test hook
   * @param mw redux-logic middleware,
   *  when specified then it expected that test hook will complete
   *  using mw.whenComplete before interrupting by timeout.
   */
  function interrupt(hDone, timeout, mw) {
    // used to avoid double call of hDone callback
    let interrupted = false;
    const timer = setTimeout(() => {
      interrupted = true;
      hDone();
    }, timeout);

    mw && mw.whenComplete(() => {
      // avoids double call of hDone callback
      clearTimeout(timer);
      if (!interrupted)
        hDone();
    });
  }

  describe('two logics of the same type', () => {
    const actionFoo = { type: 'FOO' };
    const actionBarA1 = { type: 'BAR-A1' };
    const actionBarA2 = { type: 'BAR-A2' };
    const actionBarB1 = { type: 'BAR-B1' };
    const actionBarB2 = { type: 'BAR-B2' };

    // use to change interrupt timeout for all tests, in ms
    // increasing the value extends tests execution duration,
    // but may help to avoid false-positive tests statuses on some environments
    const interruptDelta = -10;// not recommended to set less that -10
    const tests = [
      {
        title: 'both with process hooks only',
        validateA: undefined,
        validateB: undefined,
        interrupt: 30 + interruptDelta
      },
      {
        title: 'first with validate=allow, second with process hook only',
        validateA: ({ action }, allow) => { allow(action); },
        validateB: undefined,
        interrupt: 30 + interruptDelta
      },
      {
        title: 'first with validate=|timeout(15) allow|, second with process hook only',
        validateA: ({ action }, allow) => { setTimeout(() => allow(action), 15); },
        validateB: undefined,
        interrupt: 50 + interruptDelta
      },
      {
        title: 'first with process hook only, second with validate=allow',
        validateA: undefined,
        validateB: ({ action }, allow) => { allow(action); },
        interrupt: 30 + interruptDelta
      },
      {
        title: 'first with process hook only, second with validate=|timeout(15) allow|',
        validateA: undefined,
        validateB: ({ action }, allow) => { setTimeout(() => allow(action), 15); },
        interrupt: 50 + interruptDelta
      },
      {
        title: 'both with validate=allow',
        validateA: ({ action }, allow) => { allow(action); },
        validateB: ({ action }, allow) => { allow(action); },
        interrupt: 30 + interruptDelta
      },
      {
        title: 'both with validate=|timeout(15) allow|',
        validateA: ({ action }, allow) => { setTimeout(() => allow(action), 15); },
        validateB: ({ action }, allow) => { setTimeout(() => allow(action), 15); },
        interrupt: 80 + interruptDelta
      }
    ];


    function itDispatches(getDispatchSpy, expectedDispatchCalls) {
      return [
        `dispatches ${expectedDispatchCalls.map(a => a.type).join(', ')}`, () => {
          const dispatchCalls = getDispatchSpy().calls;
          expect(dispatchCalls.length).toBe(expectedDispatchCalls.length);
          expect(dispatchCalls.map(c => c.arguments[0])).toEqual(expectedDispatchCalls);
        }
      ];
    }

    function itPassesThroughNext(getNextSpy, expectedNextCalls) {
      return [
        `passes ${expectedNextCalls.map(a => a.type).join(', ')} through next`, () => {
          const nextCalls = getNextSpy().calls;
          expect(nextCalls.length).toBe(expectedNextCalls.length);
          expect(nextCalls.map(c => c.arguments[0])).toEqual(expectedNextCalls);
        }
      ];
    }

    tests.forEach(test => {
      describe(`first logic with infinite dispatch, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              dispatch(actionBarA2);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionBarB1);
              dispatch(actionBarB2);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            // no end for logicA
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' }
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`second logic with infinite dispatch, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            validate: test.validateA,
            process(deps, dispatch, done) {
              dispatch(actionBarA1);
              dispatch(actionBarA2);
              done();
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              dispatch(actionBarB2);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            // no end for logicB
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`both logics with infinite dispatch, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              dispatch(actionBarA2);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              dispatch(actionBarB2);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            // no end for logicB
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            // no end for logicA
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`both logics with sync done, ${test.title}`, () => {
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              dispatch(actionBarA1);
              dispatch(actionBarA2);
              done();
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionBarB1);
              dispatch(actionBarB2);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`first logic with delayed done, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              dispatch(actionBarA2);
              setTimeout(done, test.interrupt / 4);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionBarB1);
              dispatch(actionBarB2);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`second logic with delayed done, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              dispatch(actionBarA1);
              dispatch(actionBarA2);
              done();
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              dispatch(actionBarB2);
              setTimeout(done, test.interrupt / 4);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' },
            // delayed call of done for logicB
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`both logics with delayed done, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              dispatch(actionBarA2);
              setTimeout(done, test.interrupt / 4);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              dispatch(actionBarB2);
              setTimeout(done, test.interrupt / 4);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
            // delayed call of done for logicB then for logicA
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`first logic with delayed action and done, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              setTimeout(() => {
                dispatch(actionBarA2);
                done();
              }, test.interrupt / 4);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionBarB1);
              dispatch(actionBarB2);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarB2,
          actionBarA1,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`second logic with delayed action and done, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              dispatch(actionBarA1);
              dispatch(actionBarA2);
              done();
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              setTimeout(() => {
                dispatch(actionBarB2);
                done();
              }, test.interrupt / 4);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarA1,
          actionBarA2,
          actionBarB2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' },
            // ---------------------------------------------------------------------
            // delayed execution for logicB
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`both logics with delayed action and done for the same timeout, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              setTimeout(() => {
                dispatch(actionBarA2);
                done();
              }, test.interrupt / 4);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              setTimeout(() => {
                dispatch(actionBarB2);
                done();
              }, test.interrupt / 4);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarA1,
          actionBarB2,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
            // ---------------------------------------------------------------------
            // delayed execution for logicB
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            // delayed execution for logicA
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`both logics with delayed action and done, first early then second, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              setTimeout(() => {
                dispatch(actionBarA2);
                done();
              }, test.interrupt / 4 - 10);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              setTimeout(() => {
                dispatch(actionBarB2);
                done();
              }, test.interrupt / 4 + 10);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));

        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarA1,
          actionBarA2,
          actionBarB2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
            // ---------------------------------------------------------------------
            // delayed execution for logicA
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' },
            // delayed execution for logicB
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });
      describe(`both logics with delayed action and done, second early then first, ${test.title}`, () => {
        let disposes = [];
        let monArr = [];
        let mw;
        let logicA;
        let logicB;
        let next;
        let dispatch;
        let whenComplete;
        before(bDone => {
          monArr = [];
          next = expect.createSpy();
          dispatch = expect.createSpy();
          whenComplete = expect.createSpy();
          logicA = createLogic({
            type: 'FOO',
            name: 'logicA',
            processOptions: {
              dispatchMultiple: true
            },
            validate: test.validateA,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarA1);
              setTimeout(() => {
                dispatch(actionBarA2);
                done();
              }, test.interrupt / 4 + 5);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionBarB1);
              setTimeout(() => {
                dispatch(actionBarB2);
                done();
              }, test.interrupt / 4 - 5);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          interrupt(bDone, test.interrupt, mw);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it(...itPassesThroughNext(() => next, [actionFoo]));
        
        it(...itDispatches(() => dispatch, [
          actionBarB1,
          actionBarA1,
          actionBarB2,
          actionBarA2
        ]));

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            // ---------------------------------------------------------------------
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A1' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
            // ---------------------------------------------------------------------
            // delayed execution for logicB
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-B2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            // delayed execution for logicA
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR-A2' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' },
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });
    });
  });
});
