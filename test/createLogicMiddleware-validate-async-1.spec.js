import { before, after } from 'mocha';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

function waitAsync(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

describe('createLogicMiddleware-validate-async-1', () => {
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
});
