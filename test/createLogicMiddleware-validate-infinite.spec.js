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
const TERMINATE_TIMEOUT = 50; // in ms
describe('createLogicMiddleware-validate-infinite', () => {
  describe('[logicA*]', () => {
    describe('validateA=|no allow/reject| processA=dispatch(BAR, A)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
          validate(deps, allow /* , reject */) {
            // do not call allow/reject here
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });
    describe('validateA=|async no allow/reject| processA=dispatch(BAR, A)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
          async validate(deps, allow /* , reject */) {
            // do not call allow/reject here
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });
  });
  describe('[logicA]', () => {
    describe('validateA=|no allow/reject| processA=dispatch(BAR, A)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
          validate(deps, allow /* , reject */) {
            // do not call allow/reject here
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });
    describe('validateA=|async no allow/reject| processA=dispatch(BAR, A)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
          async validate(deps, allow /* , reject */) {
            // do not call allow/reject here
          },
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        mw = createLogicMiddleware([logicA]);
        mw.monitor$.subscribe(x => { monArr.push(x); });
        mw({ dispatch })(next)(actionFoo);
        mw.whenComplete(bDone);
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });
  });
  describe('[logicA*, logicB*]', () => {
    describe('validateA=absent validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: '*',
          warnTimeout: 0,
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=absent validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });

    });

    describe('validateA=allow(FOO) validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });

    });

  });

  describe('[logicA*, logicB]', () => {
    describe('validateA=absent validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=absent validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: '*',
          warnTimeout: 0,
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=allow(FOO) validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

  });

  describe('[logicA, logicB*]', () => {
    describe('validateA=absent validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: '*',
          warnTimeout: 0,
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=absent validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=allow(FOO) validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });


    describe('validateA=allow(FOO) validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

  });

  describe('[logicA, logicB]', () => {
    describe('validateA=absent validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
        logicA = createLogic({
          name: 'logicA',
          type: 'FOO',
          warnTimeout: 0,
          process(deps, dispatch, done) {
            dispatch(actionBarA);
            done();
          }
        });
        logicB = createLogic({
          name: 'logicB',
          type: 'FOO',
          warnTimeout: 0,
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=absent validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=allow(FOO) validateB=|no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
          validate: (deps, allow /* , reject */) => {
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('does not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });

    describe('validateA=allow(FOO) validateB=|async no allow/reject| processA=dispatch(BAR, A) processB=dispatch(BAR, B)', () => {
      let monArr = [];
      let mw;
      let logicA;
      let logicB;
      let next;
      let dispatch;
      let whenComplete;
      const actionFoo = { type: 'FOO' };
      const actionBarA = { type: 'BAR', payload: 'A' };
      const actionBarB = { type: 'BAR', payload: 'B' };

      before(bDone => {
        monArr = [];
        next = expect.createSpy();
        dispatch = expect.createSpy();
        whenComplete = expect.createSpy();
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
            // do not call allow/reject here
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
        // stop infinite awaiting after TERMINATE_TIMEOUT ms and check
        setTimeout(bDone, TERMINATE_TIMEOUT);
      });

      it('dows not pass actionFoo through next',
        () => {
          expect(next.calls.length).toBe(0);
        });

      it('does not dispatch',
        () => {
          expect(dispatch.calls.length).toBe(0);
        });

      it('mw.monitor$ should track flow',
        () => {
          const testArr = [...monArr];
          expect(testArr).toEqual([
            { action: { type: 'FOO' }, op: 'top' },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicA' },
            { action: { type: 'FOO' }, op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
            { action: { type: 'FOO' }, op: 'begin', name: 'logicB' }
          ]);
        });
      it('mw.whenComplete(fn) should not be called',
        () => {
          mw.whenComplete(whenComplete);
          expect(whenComplete.calls.length).toBe(0);
        });
    });
  });
});
