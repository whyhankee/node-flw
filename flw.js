'use strict';
var debug = require('debug')('flw');


// Globals
var fnMap = {};
var _callfn = (typeof setImmediate === 'function') ? _callImmediate : _callSetTimeout;


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

  debug("series done function: "+done.name || '<anonymous>');
  return callFunction();

  function callFunction() {
    debug("series call", fns[fnIterator].name);
    _callfn(fns[fnIterator], context, onSeriesCallDone);
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

  debug("parallel done function", done.name || '<anonymous>');
  fns.forEach(function (fn) {
    debug("parallel call", fn.name);
    _callfn(fn, context, onParallelCallDone);
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
 * Call functions with setImmediate
 * @private
 */
function _callImmediate(fn, context, cb) {
  setImmediate(fn, context, cb);
}


/**
 * Call functions with setTimeout (slow! - for browser support)
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
 * Exports
 */
Object.keys(fnMap).forEach(function(key) {
  module.exports[key] = fnMap[key];
});
module.exports.make = make();
