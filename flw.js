'use strict';

(function() {
  var root = this;                      // jshint ignore:line

  // Globals
  var fnMap = {};
  var debug = _debugBrowser;
  var callFn = _callSetTimeout;

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
      context = _makeContext();
    }
    var fnIterator = 0;
    var num = fns.length;

    debug("parallel done function", done.name || '<anonymous>');
    return callFunction();

    function callFunction() {
      debug("series call", fns[fnIterator].name);
      callFn(fns[fnIterator], context, onSeriesCallDone);
    }
    function onSeriesCallDone(err) {
      if (err) return done(err);

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
      context = _makeContext();
    }
    var num = fns.length;
    var numDone = 0;
    var doneCalled = false;

    debug("parallel done function: "+ done.name || '<anonymous>');
    fns.forEach(function (fn) {
      debug("parallel call", fn.name);
      callFn(fn, context, onParallelCallDone);
    });

    function onParallelCallDone(err) {
      if (err) return callDone(err);
      if (++numDone === num) return callDone(err);
    }
    function callDone(err) {
      if (doneCalled) throw new Error('done already called');

      doneCalled = true;
      if (err) return done(err);
      return done(null, context);
    }
  };


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
            context = _makeContext();
          }
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
  function _makeContext() {
    var c = {};

    c._flw_store = function _flw_store(key, cb) {
      var self = this;

      var fn = function (err, data) {
        if (err) return cb(err);

        debug('_flw_store', key, data);
        self[key] = data;
        return cb();
      };
      return fn;
    };

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
  flw.make = make();

  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports ) {
      exports = module.exports = flw;
    }
    exports.flw = flw;
  }
  else {
    root.flw = flw;
  }

  // if( typeof exports !== 'undefined' ) {
  //   if( typeof module !== 'undefined' && module.exports ) {
  //     exports = module.exports = mymodule;
  //   }
  //   exports.mymodule = mymodule;
  // }
  // else {
  //   root.flw = mymodule;
  // }
}).call(this);  // jshint ignore:line
