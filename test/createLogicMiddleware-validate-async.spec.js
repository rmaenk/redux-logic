import { beforeEach, afterEach } from 'mocha';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

function waitAsync(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

describe('createLogicMiddleware-validate-async', () => {
  describe('[logicA*]', () => {
    describe('validateA=|timeout(50) allow(FOO)| processA=dispatch(BAR, 42)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBar = { type: 'BAR', payload: 42 };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
          validate(deps, allow /* , reject */) {
            setTimeout(() => {
              allow(actionFoo);
            }, 50);
          },
          processOptions: {
            successType: 'BAR'
          },
          process(deps, dispatch) {
            dispatch(42);
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionFoo);
      });

      it('dispatches { type: BAR, payload: 42 }', () => {
        expect(dispatch.calls.length).toBe(1);
        expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
          { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
          { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 42 } },
          { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
        ]);
      });

      it('mw.whenComplete(fn) should be called when complete', (bDone) => {
        mw.whenComplete(bDone);
      });

    });

    describe('validateA=|async no await allow(FOO)| processA=dispatch(BAR, 42)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBar = { type: 'BAR', payload: 42 };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
          async validate(deps, allow /* , reject */) {
            allow(actionFoo);
          },
          processOptions: {
            successType: 'BAR'
          },
          process(deps, dispatch) {
            dispatch(42);
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionFoo);
      });

      it('dispatches { type: BAR, payload: 42 }', () => {
        expect(dispatch.calls.length).toBe(1);
        expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
          { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
          { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 42 } },
          { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
        ]);
      });

      it('mw.whenComplete(fn) should be called when complete', (bDone) => {
        mw.whenComplete(bDone);
      });

    });

    describe('validateA=|async await(50) allow(FOO)| processA=dispatch(BAR, 42)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBar = { type: 'BAR', payload: 42 };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
          async validate(deps, allow /* , reject */) {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBar);
            done();
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionFoo);
      });

      it('dispatches { type: BAR, payload: 42 }', () => {
        expect(dispatch.calls.length).toBe(1);
        expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
          { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
          { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 42 } },
          { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
        ]);
      });

      it('mw.whenComplete(fn) should be called when complete', (bDone) => {
        mw.whenComplete(bDone);
      });

    });
  });
  describe('[logicA]', () => {
    describe('validateA=|timeout(50) allow(FOO)| processA=dispatch(BAR, 42)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBar = { type: 'BAR', payload: 42 };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow /* , reject */) {
            setTimeout(() => {
              allow(actionFoo);
            }, 50);
          },
          processOptions: {
            successType: 'BAR'
          },
          process(deps, dispatch) {
            dispatch(42);
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionFoo);
      });

      it('dispatches { type: BAR, payload: 42 }', () => {
        expect(dispatch.calls.length).toBe(1);
        expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
          { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
          { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 42 } },
          { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
        ]);
      });

      it('mw.whenComplete(fn) should be called when complete', (bDone) => {
        mw.whenComplete(bDone);
      });

    });

    describe('validateA=|async no await allow(FOO)| processA=dispatch(BAR, 42)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBar = { type: 'BAR', payload: 42 };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow /* , reject */) {
            allow(actionFoo);
          },
          processOptions: {
            successType: 'BAR'
          },
          process(deps, dispatch) {
            dispatch(42);
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionFoo);
      });

      it('dispatches { type: BAR, payload: 42 }', () => {
        expect(dispatch.calls.length).toBe(1);
        expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
          { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
          { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 42 } },
          { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
        ]);
      });

      it('mw.whenComplete(fn) should be called when complete', (bDone) => {
        mw.whenComplete(bDone);
      });

    });

    describe('validateA=|async await(50) allow(FOO)| processA=dispatch(BAR, 42)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBar = { type: 'BAR', payload: 42 };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow /* , reject */) {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBar);
            done();
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => monArr.push(x));
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next', () => {
        expect(next.calls.length).toBe(1);
        expect(next.calls[0].arguments[0]).toEqual(actionFoo);
      });

      it('dispatches { type: BAR, payload: 42 }', () => {
        expect(dispatch.calls.length).toBe(1);
        expect(dispatch.calls[0].arguments[0]).toEqual(actionBar);
      });

      it('mw.monitor$ should track flow', () => {
        expect(monArr).toEqual([
          { action: { type: 'FOO' }, op: 'top' },
          { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
          { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
          { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 42 } },
          { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
        ]);
      });

      it('mw.whenComplete(fn) should be called when complete', (bDone) => {
        mw.whenComplete(bDone);
      });

    });
  });
  describe('[logicA*, logicB*]', () => {
    describe('validateA=absent validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: '*',
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: '*',
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: '*',
          warnTimeout: 0,
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
          type: '*',
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
          type: '*',
          warnTimeout: 0,
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
          type: '*',
          warnTimeout: 0,
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

  describe('[logicA*, logicB]', () => {
    describe('validateA=absent validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

  describe('[logicA, logicB*]', () => {
    describe('validateA=absent validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
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
          type: '*',
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

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
          type: '*',
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

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
          type: '*',
          warnTimeout: 0,
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
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
          type: '*',
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
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
          type: '*',
          warnTimeout: 0,
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
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
          type: '*',
          warnTimeout: 0,
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

  describe('[logicA, logicB]', () => {
    describe('validateA=absent validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-A } { type: BAR-B }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

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
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=absent validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

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
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|timeout(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };
      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
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
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-A } { type: BAR-B }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async no await allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
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
          validate: async (deps, allow /* , reject */) => {
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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

    describe('validateA=allow(FOO) validateB=|async await(50) allow(FOO)| processA=dispatch(BAR-A) processB=dispatch(BAR-B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR-A' };
      const actionBarB = { type: 'BAR-B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
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
          validate: async (deps, allow /* , reject */) => {
            await waitAsync(50);
            allow(actionFoo);
          },
          process(deps, dispatch, done) {
            dispatch(actionBarB);
            done();
          }
        });
        mw = createLogicMiddleware([logicA, logicB]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(2);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicB', nextAction: { type: 'FOO' }, shouldProcess: true },
            { /*                    */ op: 'bottom', nextAction: { type: 'FOO' } },
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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

      it('dispatches { type: BAR-C } { type: BAR-B } { type: BAR-A }',
        () => {
          expect(dispatch.calls.length).toBe(3);
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
          expect(dispatch.calls[0].arguments[0]).toEqual(actionBarC);
          expect(dispatch.calls[1].arguments[0]).toEqual(actionBarB);
          expect(dispatch.calls[2].arguments[0]).toEqual(actionBarA);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
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
