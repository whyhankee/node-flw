'use strict';

(function () {
  const root = this;

  // Globals
  let callFn = _callSetTimeout;
  const fnMap = {};

  const ourContextKeys = [
    // methods
    '_store',
    '_stop',
    '_stopped',
    '_clean',

    // deprecated
    '_flw_store'
  ];

  // in NodeJS ?
  if (typeof require === 'function') {
    callFn = setImmediate;
  }

  /**
   * Call functions in order of the array
   * @param {function[]} fns Array of function to execute
   * @param {Object} [context] The initial context object (optional)
   * @param {String} [key] context key to return to done()
   * @param {function} done callback
   */
  fnMap.series = function series(fns, context, returnKey, done) {
    if (typeof done !== 'function') {
      if (typeof context === 'function') {
        done = context; returnKey = undefined; context = {};
      } else if (typeof returnKey === 'function') {
        done = returnKey;
        if (typeof context === 'object') {
          returnKey = undefined;
        } else {
          returnKey = context; context = {};
        }
      }
    }
    let fnIterator = 0;
    const numTodo = fns.length;

    _checkContext(context);

    if (numTodo <= 0) return seriesDone(null);
    return callFunction();

    function callFunction() {
      if (context._stopped) return seriesDone(null, null);

      callFn(fns[fnIterator], context, seriesDone);
    }

    function seriesDone(err) {
      if (err) return done(err, context);

      if (++fnIterator >= numTodo) {
        return done(null, returnKey ? context[returnKey] : context);
      }
      return callFunction();
    }
  };


  /**
   * Call functions in parallel
   * @param {function[]} fns Array of function to exectute
   * @param {Object} [context] The initial context object (optional)
   * @param {String} [key] context key to return to done()
   * @param {function} done callback
   */
  fnMap.parallel = function parallel(fns, context, returnKey, done) {
    if (typeof done !== 'function') {
      if (typeof context === 'function') {
        done = context; returnKey = undefined; context = {};
      } else if (typeof returnKey === 'function') {
        done = returnKey;
        if (typeof context === 'object') {
          returnKey = undefined;
        } else {
          returnKey = context; context = {};
        }
      }
    }
    let numDone = 0;
    const numTodo = fns.length;
    let doneCalled = false;

    _checkContext(context);
    if (numTodo <= 0) return parallelDone(null);

    fns.forEach(function (fn) {
      return callFn(fn, context, onCallDone);
    });

    function onCallDone(err) {
      if (err) return parallelDone(err);
      if (++numDone >= numTodo) return parallelDone(err);
    }

    function parallelDone(err) {
      // We cannot call done twice, a possible error would be lost here
      if (doneCalled) return;

      doneCalled = true;
      return done(err || null, returnKey ? context[returnKey] : context);
    }
  };

  /**
   * Returns wrapped regular function that stores the result on the context key
   * @param {function} fn function to wrap
   * @param {any[]} [args] Array of arguments to pass (optional)
   * @param {String} [key] name of context key to store the result in (optional)
   */
  function wrap(fn, args, key) {
    const self = this;

    if (key === undefined && typeof(args) === 'string') {
      key = args;
      args = [];
    }
    if (!args) args = [];

    return function wrapper(context, cb) {
      const copyArgs = args.slice(args);
      copyArgs.unshift(self);
      copyArgs.push(onWrappedDone);
      return fn.bind.apply(fn, copyArgs)();

      function onWrappedDone(err, result) {
        if (err) return cb(err);

        if (key) context[key] = result;
        return cb(null);
      }
    };
  }

  /**
   * Calls fn with every item in the array
   * @param {any[]} items Array items to process
   * @param {Number} [numParallel] Limit parallelisation (default: 3)
   * @param {function} fn function call for each item
   * @param {function} done callback
   */
  function each(items, numParralel, fn, done) {
    if (done === undefined) {
      done = fn; fn = numParralel;
      numParralel = 3;
    }

    if (numParralel <= 0) numParralel = 1;

    let doing = 0;
    let numProcessing = 0;
    let numDone = 0;
    const numTotal = items.length;
    const results = [];
    return nextItem();

    function nextItem() {
      // We done-check first in case of emtpty array
      if (numDone >= numTotal) return done(null, results);

      // Batch (or call next item)
      while (doing < numTotal && numProcessing < numParralel) {
        callFn(fn, items[doing++], onDone);
        numProcessing++;
      }
      return;

      // All done
      function onDone(err, result) {
        if (err) return done(err);

        results.push(result);
        numProcessing--;
        numDone++;
        return nextItem();
      }
    }
  }

  /**
   * Calls fn with every item in the array
   * The items will be processed one at a time, preserving the result order
   * @param {any[]} items Array items to process
   * @param {function} fn function call for each item
   * @param {function} done callback
   */
  function eachSeries(items, fn, done) {
    return each(items, 1, fn, done);
  }

  /**
   * Calls fn x times (with index)
   * @param {Number} num number of times to call fn
   * @param {function} fn function call for each item
   * @param {function} done callback
   */
  function n(num, fn, done) {
    const results = [];
    return nextItem();

    function nextItem() {
      if (results.length >= num) return done(null, results);

      callFn(fn, results.length, function (err, result) {
        if (err) return done(err);

        results.push(result);
        return nextItem();
      });
    }
  }

  /**
   * Calls fn x times (deprecated: Use .n)
   * @deprecated use .n()
   * @param {Number} [num] number of times to call fn
   * @param {function} fn function call for each item
   * @param {function} done callback
   */
  function times(num, fn, done) {
    const results = [];
    return nextItem();

    function nextItem() {
      if (results.length >= num) return done(null, results);

      callFn(fn, function (err, result) {
        if (err) return done(err);

        results.push(result);
        return nextItem();
      });
    }
  }

  /**
   * build the list of exposed methods into the .make syntax
   */
  function make() {
    // create a map of all flow functions wrapped by _make
    const makeFnMap = {};
    Object.keys(fnMap).forEach(function (key) {
      makeFnMap[key] = _make(fnMap[key]);
    });
    return makeFnMap;

    // takes a function and wraps it so that execution is 'postponed'
    function _make(fn) {
      // the user calls this function, e.g. flw.make.series(...)
      return function madeFunction(fns, context, returnKey) {
        if (typeof context === 'string') {
          returnKey = context; context = {};
        }
        // this function is consumed by flw
        return function flowFunction(context, cb) {
          // when passed from a flw flow it's called with a premade context
          // if called directly, create a new context
          if (cb === undefined && typeof context === 'function') {
            cb = context;
            context = {};
            _checkContext(context);
          }

          if (typeof cb !== 'function') {
            throw new Error('flw: .make - cb !== function');
          }
          return fn(fns, context, returnKey, cb);
        };
      };
    }
  }


  /**
   * Call functions with setTimeout (for browser support)
   * @private
   */
  function _callSetTimeout(fn, context, cb) {
    return setTimeout(fn, 0, context, cb);
  }


  /**
   * Ensures a enrichched flw context when a flow is starting
   * @private
   */
  function _checkContext(c) {
    if (c.hasOwnProperty('_stopped')) return; // Already done?

    c._stopped = null;

    // Indicate that we gracefully stop
    //  if set, stops the flow until we are back to the main callback
    function _flw_stop(reason, cb) {
      if (!cb && typeof reason === 'function') {
        cb = reason;
        reason = 'stopped';
      }
      c._stopped = reason;
      return cb();
    }
    Object.defineProperty(c, '_stop', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: _flw_stop,
    });

    // Stores the data returned from the callback in the context with key 'key'
    //  then calls the callback
    function _flw_store(key, cb) {
      const self = this;

      const fn = function (err, data) {
        if (err) return cb(err);

        self[key] = data;
        return cb();
      };
      return fn;
    }
    Object.defineProperty(c, '_store', {
      enumerable: false,
      configurable: false,
      value: _flw_store,
    });

    // Cleans all flw related properties from the context object
    function _flw_clean() {
      const self = this;
      const contextCopy = {};
      Object.keys(this).forEach(function (k) {
        if (ourContextKeys.indexOf(k) !== -1) return;
        contextCopy[k] = self[k];
      });
      return contextCopy;
    }
    Object.defineProperty(c, '_clean', {
      enumerable: false,
      configurable: false,
      value: _flw_clean,
    });

    // compatibilty for a while
    Object.defineProperty(c, '_flw_store', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: _flw_store,
    });

    return c;
  }

  /**
   * Export
   */
  const flw = {};
  Object.keys(fnMap).forEach(function (key) {
    flw[key] = fnMap[key];
  });
  flw.make = make();
  flw.wrap = wrap;
  flw.eachSeries = eachSeries;
  flw.each = each;
  flw.n = n;
  flw.times = times;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = flw;
    }
    exports.flw = flw;
  }
  else {
    root.flw = flw;
  }
}).call(this);
