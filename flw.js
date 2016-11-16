'use strict';

(function() {
  var root = this;

  // Globals
  var fnMap = {};
  var debug = _debugBrowser;
  var callFn = _callSetTimeout;

  var ourContextKeys = [
    '_stopped',
    '_stop',
    '_store',
    '_clean',
    '_flw_store'
  ];

  // in NodeJS ?
  if (typeof require === 'function') {
    debug = require('debug')('flw');
    callFn = setImmediate;
  }

  /**
   * Call functions in series (order of array)
   */
  fnMap.series = function series(fns, context, done) {
    if (done === undefined && typeof context === 'function') {
      done = context;
      context = {};
    }
    _checkContext(context);

    var fnIterator = 0;
    var num = fns.length;

    debug('parallel done function', done.name || '<anonymous>');
    return callFunction();

    function callFunction() {
      if (context._stopped) {
        debug('_stopped series call', fns[fnIterator].name);
        return onSeriesCallDone(null, null);
      }
      debug('series call', fns[fnIterator].name);
      callFn(fns[fnIterator], context, onSeriesCallDone);
    }
    function onSeriesCallDone(err) {
      if (err) return done(err, context);

      if (++fnIterator >= num) return done(null, context);
      return callFunction();
    }
  };


  /**
   * Call functions in parallel
   */
  fnMap.parallel = function parallel(fns, context, done) {
    if (done === undefined && typeof context === 'function') {
      done = context;
      context = {};
    }
    _checkContext(context);

    var num = fns.length;
    var numDone = 0;
    var doneCalled = false;

    debug('parallel done function: '+ done.name || '<anonymous>');
    fns.forEach(function (fn) {
      debug('parallel call', fn.name);
      callFn(fn, context, onParallelCallDone);
    });

    function onParallelCallDone(err) {
      if (err) return callDone(err);
      if (++numDone === num) return callDone(err);
    }
    function callDone(err) {
      if (doneCalled) throw new Error('done already called');

      doneCalled = true;
      return done(err || null, context);
    }
  };

  function wrap(wrapFn, args, key) {
    var self = this;

    if (key === undefined && typeof(args) === 'string') {
      key = args;
      args = [];
    }
    if (!args) args = [];

    return function wrapper(context, cb) {
      var copyArgs = args.slice(args);
      copyArgs.unshift(self);
      copyArgs.push(onWrappedDone);
      return wrapFn.bind.apply(wrapFn, copyArgs)();

      function onWrappedDone(err, result) {
        if (err) return cb(err);

        if (key) context[key] = result;
        return cb(err);
      }
    };
  }

  function each(items, numParralel, fn, done) {
    if (done === undefined) {
      done = fn; fn = numParralel;
      numParralel = 3;
    }

    if (numParralel <= 0) numParralel = 1;

    var doing = 0;
    var numProcessing = 0;
    var numDone = 0;
    var numTotal = items.length;
    var results = [];

    debug('each() start', {
      numParralel: numParralel,
      numTotal: numTotal
    });
    return nextItem();

    function nextItem() {
      // We done-check first in case of emtpty array
      if (numDone >= numTotal) {
        debug('each() done');
        return done(null, results);
      }

      // Batch (or call next item)
      var someThingCalled = false;
      while (doing < numTotal && numProcessing < numParralel) {
        debug('each() call ' +doing+ ' '+ fn.name || '<anonymous>', items[doing]);
        callFn(fn, items[doing++], onDone);
        numProcessing++;
        someThingCalled = true;
      }
      if (someThingCalled) debug('each() batch done');
      return;

      // All done
      function onDone(err, result) {
        if (err) {
          debug('each() exit with err', err);
          return done(err);
        }

        results.push(result);
        numProcessing--;
        numDone++;
        return nextItem();
      }
    }
  }


  /**
   * build the list of exposed methods into the .make syntax
   */
  function make() {
    // create a map of all flow functions wrapped by _make
    var makeFnMap = {};
    Object.keys(fnMap).forEach(function(key) {
      makeFnMap[key] = _make(fnMap[key]);
    });
    return makeFnMap;

    // takes a function and wraps it so that execution is 'postponed'
    function _make(fn) {
      // the user calls this function, e.g. flw.make.series(...)
      return function madeFunction(fns) {
        // this function is consumed by flw
        return function flowFunction(context, done) {
          if (done === undefined && typeof context === 'function') {
            done = context;
            context = {};
          }
          _checkContext(context);

          if (typeof done !== 'function') {
            throw new Error('_make - done !== function');
          }
          debug('making function', fn.name);
          return fn(fns, context, done);
        };
      };
    }
  }


  /**
   * Call functions with setTimeout (for browser support)
   * @private
   */
  function _callSetTimeout(fn, context, cb) {
    setTimeout(fn, 0, context, cb);
  }


  /**
   * Create a new Flw context when a flow is starting
   * @private
   */
  function _checkContext (c) {
    // Already defined?
    if (c._store) return;

    c._stopped = null;

    // Indicate that we gracefully stop
    //  if set, stops the flow until we are back to the main callback
    c._stop = function _flw_stop(reason, cb) {
      if (!cb && typeof reason === 'function') {
        cb = reason;
        reason = 'stopped';
      }
      c._stopped = reason;
      return cb();
    };

    // Stores the data returned from the callback in the context with key 'key'
    //    then calls the callback
    c._store = function _flw_store(key, cb) {
      var self = this;

      var fn = function (err, data) {
        if (err) return cb(err);

        debug('_store', key, data);
        self[key] = data;
        return cb();
      };
      return fn;
    };

    c._clean = function _flw_clean() {
      var self = this;
      var contextCopy = {};
      Object.keys(this).forEach(function (k) {
        if (ourContextKeys.indexOf(k) !== -1) return;
        contextCopy[k] = self[k];
      });
      return contextCopy;
    };

    // compatibilty for a while
    c._flw_store = c._store;

    return c;
  }


  /**
   * Browser compatibilty debug function
   * @private
   */
  function _debugBrowser() {
    // console.log(arguments);
  }


  /**
   * Export
   */
  var flw = {};
  Object.keys(fnMap).forEach(function(key) {
    flw[key] = fnMap[key];
  });
  flw.wrap = wrap;
  flw.make = make();
  flw.each = each;

  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = flw;
    }
    exports.flw = flw;
  }
  else {
    root.flw = flw;
  }
}).call(this);
