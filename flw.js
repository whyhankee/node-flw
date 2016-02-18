'use strict';
var debug = require('debug')('flw');

var fnMap = {};

fnMap.series = function series(fns, context, done) {
  if (done === undefined && typeof context === 'function') {
    done = context;
    context = {};
  }
  var fnIterator = 0;
  var num = fns.length;

  debug("series done function: "+ done.name || '<anonymous>');
  return callFunction();

  function callFunction() {
    debug("series call", fns[fnIterator].name);
    setImmediate(fns[fnIterator], context, onSeriesCallDone);
  }
  function onSeriesCallDone(err) {
    if (err) return done(err);

    if (++fnIterator >= num) return done(null, context);
    return callFunction();
  }
};


fnMap.parallel = function parallel(fns, context, done) {
  if (done === undefined && typeof context === 'function') {
    done = context;
    context = {};
  }
  var num = fns.length;
  var numDone = 0;
  var doneCalled = false;

  debug("parallel done function: "+ done.name || '<anonymous>');

  fns.forEach(function (fn) {
    debug("parallel call", fn.name);
    setImmediate(fn, context, onParallelCallDone);
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
        if (typeof done !== 'function') {
          throw new Error('_make - done !== function');
        }
        return fn(fns, context, done);
      };
    };
  }
}

Object.keys(fnMap).forEach(function(key) {
  module.exports[key] = fnMap[key];
});
module.exports.make = make();
