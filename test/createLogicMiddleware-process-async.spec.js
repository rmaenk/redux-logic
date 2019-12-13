import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-process-async', () => {
  describe('two logics of the same type', () => {
    const actionFoo = { type: 'FOO' };
    const actionBat = { type: 'BAT' };
    const actionCat = { type: 'CAT' };
    const actionDog = { type: 'DOG' };
    const actionElk = { type: 'ELK' };

    const tests = [
      {
        title: 'both with process hooks only',
        validateA: undefined,
        validateB: undefined,
        interrupt: 50
      },
      {
        title: 'first with validate=allow, second with process hook only',
        validateA: ({ action }, allow) => { allow(action); },
        validateB: undefined,
        interrupt: 50
      },
      {
        title: 'first with validate=|timeout(30) allow|, second with process hook only',
        validateA: ({ action }, allow) => { setTimeout(() => allow(action), 30); },
        validateB: undefined,
        interrupt: 80
      },
      {
        title: 'first with process hook only, second with validate=allow',
        validateA: undefined,
        validateB: ({ action }, allow) => { allow(action); },
        interrupt: 50
      },
      {
        title: 'first with process hook only, second with validate=|timeout(30) allow|',
        validateA: undefined,
        validateB: ({ action }, allow) => { setTimeout(() => allow(action), 30); },
        interrupt: 80
      },
      {
        title: 'both with validate=allow',
        validateA: ({ action }, allow) => { allow(action); },
        validateB: ({ action }, allow) => { allow(action); },
        interrupt: 50
      },
      {
        title: 'both with validate=|timeout(30) allow|',
        validateA: ({ action }, allow) => { setTimeout(() => allow(action), 30); },
        validateB: ({ action }, allow) => { setTimeout(() => allow(action), 30); },
        interrupt: 100
      }
    ];

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
        const actionFoo = { type: 'FOO' };
        const actionDog = { type: 'DOG' };
        const actionBat = { type: 'BAT' };
        const actionCat = { type: 'CAT' };
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
              dispatch(actionBat);
              dispatch(actionCat);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionDog);
              dispatch(actionElk);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          setTimeout(bDone, test.interrupt);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
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
              dispatch(actionBat);
              dispatch(actionCat);
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
              dispatch(actionDog);
              dispatch(actionElk);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          setTimeout(bDone, test.interrupt);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            // no end for logicB
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
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
              dispatch(actionBat);
              dispatch(actionCat);
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
              dispatch(actionDog);
              dispatch(actionElk);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          setTimeout(bDone, test.interrupt);
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            // no end for logicB
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
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
              dispatch(actionBat);
              dispatch(actionCat);
              done();
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionDog);
              dispatch(actionElk);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          const timer = setTimeout(bDone, test.interrupt);
          mw.whenComplete(() => { clearTimeout(timer); bDone(); });
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
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
              dispatch(actionBat);
              dispatch(actionCat);
              setTimeout(done, test.interrupt / 4);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionDog);
              dispatch(actionElk);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          const timer = setTimeout(bDone, test.interrupt);
          mw.whenComplete(() => { clearTimeout(timer); bDone(); });
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
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
              dispatch(actionBat);
              dispatch(actionCat);
              done();
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionDog);
              dispatch(actionElk);
              setTimeout(done, test.interrupt / 4);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          const timer = setTimeout(bDone, test.interrupt);
          mw.whenComplete(() => { clearTimeout(timer); bDone(); });
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
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
              dispatch(actionBat);
              dispatch(actionCat);
              setTimeout(done, test.interrupt / 4);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              disposes.push(done);
              dispatch(actionDog);
              dispatch(actionElk);
              setTimeout(done, test.interrupt / 4);
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          const timer = setTimeout(bDone, test.interrupt);
          mw.whenComplete(() => { clearTimeout(timer); bDone(); });
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
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
              dispatch(actionBat);
              setTimeout(() => {
                dispatch(actionCat);
                done();
              }, test.interrupt / 4);
            }
          });
          logicB = createLogic({
            type: 'FOO',
            name: 'logicB',
            validate: test.validateB,
            process(deps, dispatch, done) {
              dispatch(actionDog);
              dispatch(actionElk);
              done();
            }
          });
          mw = createLogicMiddleware([logicA, logicB]);
          mw.monitor$.subscribe(x => monArr.push(x));
          mw({ dispatch })(next)(actionFoo);
          // interrupt infinite test
          const timer = setTimeout(bDone, test.interrupt);
          mw.whenComplete(() => { clearTimeout(timer); bDone(); });
        });

        after(() => {
          disposes.forEach(dispose => dispose());
        });

        it('passes actionFoo through next', () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

        it('dispatches actionDog, actionElk, actionBat and actionCat', () => {
          expect(dispatch.calls.length).toBe(4);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionDog,
            actionElk,
            actionBat,
            actionCat
          ]);
        });

        it('mw.monitor$ should track flow', () => {
          expect(monArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'DOG' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'ELK' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAT' } },
            mw.advancedAsyncLogicSupport &&
            { action: { type: 'FOO' }, op: 'dispFuture', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'CAT' } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
          ].filter(o => o));
        });

        it('mw.whenComplete(fn) should not be called', () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
      });

      describe(`second logic with delayed action and done, ${test.title}`, () => {
      });

      describe(`both logics with delayed action and done, ${test.title}`, () => {
      });
    });
  });
});
