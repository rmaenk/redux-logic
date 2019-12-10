import { before, after } from 'mocha';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

function waitAsync(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

describe('createLogicMiddleware-validate-async-3', () => {
  describe('[logicA, logicB, logicC]', () => {
    describe('validateA=absent validateB=|timeout(50) allow(FOO)| validateC=absent processA=dispatch(BAR-A) processB=dispatch(BAR-B) processC=dispatch(BAR-C)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let logicC;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
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
          async validate(deps, allow /* , reject */) {
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

      it('dispatches { type: BAR-A } { type: BAR-B } { type: BAR-B }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
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
          async validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
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
          validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
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
          async validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
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
          async validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow /* , reject */) {
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
          async validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow /* , reject */) {
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
          async validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow /* , reject */) {
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
          async validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
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
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      const actionBarC = { type: 'BAR-C' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          validate(deps, allow /* , reject */) {
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
          async validate(deps, allow /* , reject */) {
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
          validate(deps, allow /* , reject */) {
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
          expect(dispatch.calls.map(c => c.arguments[0])).toEqual([
            actionBarC,
            actionBarB,
            actionBarA
          ]);
        });

      it('mw.monitor$ should track flow',
        () => {
          expect(monArr).toEqual([
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
          ]);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });
    });
  });
});
