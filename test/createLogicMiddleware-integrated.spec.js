import expect from 'expect-legacy';
import { createStore, applyMiddleware } from 'redux';
import { createLogic, createLogicMiddleware } from '../src/index';
import { viewAsyncValidateHookOptions } from '../src/createLogicMiddleware';


describe('createLogicMiddleware-integration', () => {

  describe('throw error in reducer from dispatch', () => {
    const consoleErrors = [];

    // eslint-disable-next-line no-console
    const origConsoleError = console.error;
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.error = x => consoleErrors.push(x);
      consoleErrors.length = 0;
    });

    after(() => {
      // eslint-disable-next-line no-console
      console.error = origConsoleError;
    });

    let monArr = [];
    beforeEach((bDone) => {
      monArr = [];
      const initialState = {};

      function reducer(state, action) {
        switch (action.type) {
          case 'BAD':
            throw new Error('something bad happened');
          default:
            return state;
        }
      }

      const processLogic = createLogic({
        type: 'FOO',
        process({ getState, action }, dispatch, done) {
          dispatch({ type: 'BAD' }); // throws error
          done();
        }
      });

      const logicMiddleware = createLogicMiddleware([processLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.dispatch({ type: 'FOO' });
      // we could just call done() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(bDone);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAD' },
          op: 'dispatch' },
        { action: { type: 'BAD' }, op: 'top' },
        { action: { type: 'BAD' },
          err: 'something bad happened',
          op: 'nextError' },
        { nextAction: { type: 'BAD' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('console.error should have logged the error', () => {
      expect(consoleErrors.length).toBe(1);
      expect(consoleErrors[0]).toContain('reducer');
    });
  });

  describe('throw error in reducer from mw next call', () => {
    // eslint-disable-next-line no-console
    const origConsoleError = console.error;
    const consoleErrors = [];
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.error = x => consoleErrors.push(x);
      consoleErrors.length = 0;
    });

    after(() => {
      // eslint-disable-next-line no-console
      console.error = origConsoleError;
    });

    let monArr = [];
    beforeEach((bDone) => {
      monArr = [];
      const initialState = {};

      function reducer(state, action) {
        switch (action.type) {
        case 'BAD':
          throw new Error('another bad thing');
        default:
          return state;
        }
      }

      const processLogic = createLogic({
        type: 'BAD',
        process() { }
      });

      const logicMiddleware = createLogicMiddleware([processLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
        applyMiddleware(logicMiddleware));
      store.dispatch({ type: 'BAD' });
      // we could just call bDone() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(bDone);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'BAD' }, op: 'top' },
        { action: { type: 'BAD' }, name: 'L(BAD)-0', op: 'begin' },
        { action: { type: 'BAD' },
          nextAction: { type: 'BAD' },
          name: 'L(BAD)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'BAD' },
          err: 'another bad thing',
          op: 'nextError' },
        { nextAction: { type: 'BAD' }, op: 'bottom' },
        { action: { type: 'BAD' }, name: 'L(BAD)-0', op: 'end' }
      ]);
    });

    it('console.error should have logged the error', () => {
      expect(consoleErrors.length).toBe(1);
      expect(consoleErrors[0]).toContain('reducer');
    });
  });


  // throw string
  describe('throw string in reducer', () => {
    // eslint-disable-next-line no-console
    const origConsoleError = console.error;
    const consoleErrors = [];
    beforeEach(() => {
      // eslint-disable-next-line no-console
      console.error = x => consoleErrors.push(x);
      consoleErrors.length = 0;
    });

    after(() => {
      // eslint-disable-next-line no-console
      console.error = origConsoleError;
    });

    let monArr = [];
    beforeEach((bDone) => {
      monArr = [];
      const initialState = {};

      function reducer(state, action) {
        switch (action.type) {
          case 'BAD':
            // eslint-disable-next-line no-throw-literal
            throw 'you should throw an error instead';
          default:
            return state;
        }
      }

      const processLogic = createLogic({
        type: 'FOO',
        process({ getState, action }, dispatch, done) {
          dispatch({ type: 'BAD' }); // throws error
          done();
        }
      });

      const logicMiddleware = createLogicMiddleware([processLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.dispatch({ type: 'FOO' });
      // we could just call bDone() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(bDone);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, op: 'top' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'begin' },
        { action: { type: 'FOO' },
          nextAction: { type: 'FOO' },
          name: 'L(FOO)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'FOO' }, op: 'bottom' },
        { action: { type: 'FOO' },
          dispAction: { type: 'BAD' },
          op: 'dispatch' },
        { action: { type: 'BAD' }, op: 'top' },
        { action: { type: 'BAD' },
          err: 'you should throw an error instead',
          op: 'nextError' },
        { nextAction: { type: 'BAD' }, op: 'bottom' },
        { action: { type: 'FOO' }, name: 'L(FOO)-0', op: 'end' }
      ]);
    });

    it('console.error should have logged the error', () => {
      expect(consoleErrors.length).toBe(1);
      expect(consoleErrors[0]).toContain('reducer');
    });
  });

  describe('rapid call with single logic', () => {
    let storeUpdates;
    let monArr = [];
    beforeEach((bDone) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { count: 1 };

      function reducer(state, action) {
        switch (action.type) {
        case 'DEC':
          return {
            ...state,
            count: state.count - 1
          };
        default:
          return state;
        }
      }

      const validateDecLogic = createLogic({
        type: 'DEC',
        validate({ getState, action }, allow, reject) {
          if (getState().count > 0) {
            allow(action);
          } else {
            reject({ type: 'NOOP' });
          }
        }
      });

      const logicMiddleware = createLogicMiddleware([validateDecLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 2) {
          // bDone();
          // using whenComplete to trigger bDone
        }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      // we could just call bDone() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(bDone);
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(DEC)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'DEC' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' }
      ]);
    });
  });

  describe('rapid call with single logic (with procces hook)', () => {
    const asyncValidateHookOptions = viewAsyncValidateHookOptions();
    let storeUpdates;
    let monArr = [];
    beforeEach((bDone) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { count: 1 };

      function reducer(state, action) {
        switch (action.type) {
          case 'DEC-1':
          case 'DEC-2':
            return {
              ...state,
              count: state.count - 1
            };
          default:
            return state;
        }
      }

      const validateDecLogic = createLogic({
        type: ['DEC-1', 'DEC-2'],
        name: 'logic',
        validate({ getState, action }, allow, reject) {
          if (getState().count > 0) {
            allow(action);
          } else {
            allow({ type: 'NOOP' });
          }
        },
        process({ action }, dispatch, done) {
          dispatch({ type: `BAR-${action.type}` })
          done();
        }
      });

      const logicMiddleware = createLogicMiddleware([validateDecLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
        applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 2) {
          // bDone();
          // using whenComplete to trigger bDone
        }
      });

      store.dispatch({ type: 'DEC-1' });
      store.dispatch({ type: 'DEC-2' });
      // we could just call bDone() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(bDone);
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
    });

    const test = it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([

        { action: { type: 'DEC-1' }, op: 'top' },
        { action: { type: 'DEC-1' }, name: 'logic', op: 'begin' },
        // validate for DEC-1
        {
          action: { type: 'DEC-1' },
          nextAction: { type: 'DEC-1' },
          name: 'logic',
          shouldProcess: true,
          op: 'next'
        },
        { nextAction: { type: 'DEC-1' }, op: 'bottom' },
        // --------------------------------------------------
        // process for DEC-1
        {
          action: { type: 'DEC-1' },
          dispAction: { type: 'BAR-DEC-1' },
          op: 'dispatch'
        },
        { action: { type: 'BAR-DEC-1' }, op: 'top' },
        { nextAction: { type: 'BAR-DEC-1' }, op: 'bottom' },
        // --------------------------------------------------
        // end logic for DEC-1
        { action: { type: 'DEC-1' }, name: 'logic', op: 'end' },
        // --------------------------------------------------
        { action: { type: 'DEC-2' }, op: 'top' },
        { action: { type: 'DEC-2' }, name: 'logic', op: 'begin' },
        // validate for DEC-2
        {
          action: { type: 'DEC-2' },
          dispAction: { type: 'NOOP' },
          name: 'logic',
          shouldProcess: true,
          op: 'nextDisp'
        },
        {
          action: { type: 'DEC-2' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch'
        },
        { action: { type: 'NOOP' }, op: 'top' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        // --------------------------------------------------
        // process for DEC-2
        {
          action: { type: 'DEC-2' },
          dispAction: { type: 'BAR-NOOP' },
          op: 'dispatch'
        },
        { action: { type: 'BAR-NOOP' }, op: 'top' },
        { nextAction: { type: 'BAR-NOOP' }, op: 'bottom' },
        // --------------------------------------------------
        // end logic for DEC-2
        { action: { type: 'DEC-2' }, name: 'logic', op: 'end' }

      ]);
    });
  });

  describe('sequential dispatches of actions from logic process then handled by other logics', ()=> {
    const asyncValidateHookOptions =  viewAsyncValidateHookOptions();
    let storeUpdates;
    let monArr = [];
    const actionStart = { type: 'START'};
    const actionOne = { type: 'ONE'};
    const actionTwo = { type: 'TWO'};
    const actionBarOne = { type: 'BAR1'};
    const actionBarTwo = { type: 'BAR2'};
    before((bDone) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { foo: 0, one: 0, two: 0, barOne: 0, barTwo: 0 };

      function reducer(state, action) {
        switch (action.type) {
          case 'FOO':
            return { ...state, foo: state.foo + 1 };
          case 'ONE':
            return { ...state, one: state.one + 1 };
          case 'TWO':
            return { ...state, two: state.two + 1 };
          case 'BAR1':
            return { ...state, barOne: state.barOne + 1 };
          case 'BAR2':
            return { ...state, barTwo: state.barTwo + 1 };
          default:
            return state;
        }
      }

      const logicA = createLogic({
        type: 'FOO',
        name: 'logicA',
        validate({ action }, allow) {
          allow(action);
        },
        process(deps, dispatch, done) {
          dispatch(actionOne);
          dispatch(actionTwo);
          done();
        }
      });
      const logic1 = createLogic({
        type: 'ONE',
        name: 'logic1',
        validate({ action }, allow) {
          //setTimeout(() => allow(action), 50);
          allow(action);
        },
        process(deps, dispatch, done) {
          dispatch(actionBarOne);
          done();
        }
      });
      const logic2 = createLogic({
        type: 'TWO',
        name: 'logic2',
        validate({ action }, allow) {
          //setTimeout(() => allow(action), 50);
          allow(action);
        },
        process(deps, dispatch, done) {
          dispatch(actionBarTwo);
          done();
        }
      });

      const logicMiddleware = createLogicMiddleware([logicA, logic1, logic2]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));
      const store = createStore(reducer, initialState, applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 2) {
          // bDone();
          // using whenComplete to trigger bDone
        }
      });

      store.dispatch({ type: 'FOO' });
      // we could just call bDone() here since everything is sync
      // but whenComplete is always the safe thing to do
      logicMiddleware.whenComplete(bDone);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'FOO' }, /* */op: 'top' },
        { action: { type: 'FOO' }, /* */op: 'begin', name: 'logicA' },
        { action: { type: 'FOO' }, /* */op: 'next', name: 'logicA', nextAction: { type: 'FOO' }, shouldProcess: true },
        { /*                          */op: 'bottom', nextAction: { type: 'FOO' } },
        { action: { type: 'FOO' }, /* */op: 'dispatch', dispAction: { type: 'ONE' } },
        //------------------------------------------------------------
        { action: { type: 'ONE' }, /* */op: 'top' },
        { action: { type: 'ONE' }, /* */op: 'begin', name: 'logic1' },
        { action: { type: 'ONE' }, /* */op: 'next', name: 'logic1', nextAction: { type: 'ONE' }, shouldProcess: true },
        { /*                          */op: 'bottom', nextAction: { type: 'ONE' } },

        { action: { type: 'ONE' }, /* */op: 'dispatch', dispAction: { type: 'BAR1' } },

        { action: { type: 'BAR1' }, /**/op: 'top' },
        { /*                          */op: 'bottom', nextAction: { type: 'BAR1' } },
        { action: { type: 'ONE' }, /* */op: 'end', name: 'logic1' },
        //------------------------------------------------------------
        { action: { type: 'FOO' }, /* */op: 'dispatch', dispAction: { type: 'TWO' } },
        //------------------------------------------------------------
        { action: { type: 'TWO' }, /* */op: 'top' },
        { action: { type: 'TWO' }, /* */op: 'begin', name: 'logic2' },
        { action: { type: 'TWO' }, /* */op: 'next', name: 'logic2', nextAction: { type: 'TWO' }, shouldProcess: true },
        { /*                          */op: 'bottom', nextAction: { type: 'TWO' } },

        { action: { type: 'TWO' }, /* */op: 'dispatch', dispAction: { type: 'BAR2' } },

        { action: { type: 'BAR2' }, /**/op: 'top' },
        { /*                          */op: 'bottom', nextAction: { type: 'BAR2' } },
        { action: { type: 'TWO' }, /* */op: 'end', name: 'logic2' },
        //------------------------------------------------------------
        { action: { type: 'FOO' }, /* */op: 'end', name: 'logicA' }
      ]);
    });
  });

  describe('rapid call with 2 logic', () => {
    let storeUpdates;
    let monArr = [];
    beforeEach((bDone) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { count: 1 };

      function reducer(state, action) {
        switch (action.type) {
        case 'DEC':
          return {
            ...state,
            count: state.count - 1
          };
        default:
          return state;
        }
      }

      const validateDecLogic = createLogic({
        type: 'DEC',
        validate({ getState, action }, allow, reject) {
          if (getState().count > 0) {
            allow(action);
          } else {
            reject({ type: 'NOOP' });
          }
        }
      });

      const anotherLogic = createLogic({
        type: '*',
        transform({ action }, next) {
          next(action);
        }
      });


      const arrLogic = [
        validateDecLogic,
        anotherLogic
      ];
      const logicMiddleware = createLogicMiddleware(arrLogic);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 4) {
          // bDone();
          // using whenComplete to trigger bDone
        }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      logicMiddleware.whenComplete(bDone);
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
      expect(storeUpdates[2].count).toBe(0);
      expect(storeUpdates[3].count).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(DEC)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'DEC' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'DEC' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' }
      ]);
    });

  });
  
});
