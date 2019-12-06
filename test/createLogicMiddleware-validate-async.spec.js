import { beforeEach, afterEach } from 'mocha';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import expect from 'expect-legacy';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-validate-async', () => {
  describe('[logicA] validate=allow(FOO) with timeout, process dispatch(BAR, 42)', () => {
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
      mw.whenComplete(() => {
        bDone();
      });
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
        {
          action: { type: 'FOO' },
          name: 'logicA',
          nextAction: { type: 'FOO' },
          shouldProcess: true,
          op: 'next'
        },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        {
          action: { type: 'FOO' },
          dispAction: { type: 'BAR', payload: 42 },
          op: 'dispatch'
        },
        { action: { type: 'FOO' }, name: 'logicA', op: 'end' }
      ]);
    });

    it('mw.whenComplete(fn) should be called when complete', (bDone) => {
      mw.whenComplete(bDone);
    });

  });

  describe('[logicA, logicB] validateA=allow(FOO) validateB=allow(FOO) with timeout, processA dispatch(BAR, 1), processB dispatch(BAR, 2)',
    () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 1 };
      const actionBarB = { type: 'BAR', payload: 2 };
      before(bDone => {
        try {
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
          mw.monitor$.subscribe(x => {
            monArr.push(x);
          });
          mw({ dispatch })(next)(actionFoo);
          mw.whenComplete(() => {
            mw.monitor$.unsubscribe();
            bDone();
          });
        } catch (err) {
          console.error(err); // eslint-disable-line no-console
        }
      });

      it('passes actionFoo through next',
        () => {
          expect(next.calls.length).toBe(1);
          expect(next.calls[0].arguments[0]).toEqual(actionFoo);
        });

      it('dispatches { type: BAR, payload: 1 } { type: BAR, payload: 2 }',
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
            { op: 'bottom', nextAction: { type: 'FOO' } },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 2 } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicB' },
            { action: { type: 'FOO' }, op: 'dispatch', dispAction: { type: 'BAR', payload: 1 } },
            { action: { type: 'FOO' }, op: 'end', name: 'logicA' }
          ]);
        });

      it('mw.whenComplete(fn) should be called when complete',
        (bDone) => {
          mw.whenComplete(bDone);
        });

    });
});
