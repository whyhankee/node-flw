'use strict';
var debug = require('debug')('flw');


function series(fns, context, done) {
  if (done === undefined && typeof context === 'function') {
    done = context;
    context = {};
  }
  var i = 0;
  var num = fns.length;

  debug("series done", done.name);
  callFunction();

  function callFunction() {
    debug("series call", fns[i].name);
    setImmediate(fns[i], context, onSeriesCallDone);
  }
  function onSeriesCallDone(err) {
    if (err) return done(err, context);

    if (++i >= num) return done(null, context);
    callFunction();
  }
}


function makeSeries() {
  var fns = [];
  var i =0;
  while (arguments[i]) {
    fns.push(arguments[i++]);
  }

  var f = function seriesFunction(context, done) {
    if (done === undefined && typeof context==='function') {
      done = context;
      context = {};
    }
    if (typeof done !== 'function') throw new Error('done !== function');
    series(fns, context, done);
  };
  return f;
}


function parallel(fns, context, done) {
  if (done === undefined && typeof context === 'function') {
    done = context;
    context = {};
  }
  var num = fns.length;
  var numDone = 0;
  var doneCalled = false;

  debug("parallel done", done.name);

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
}


function makeParallel() {
  var fns = [];
  var i =0;
  while (arguments[i]) {
    fns.push(arguments[i++]);
  }
  var f = function parallelFunction(context, done) {
    if (done === undefined && typeof context==='function') {
      done = context;
      context = {};
    }
    if (typeof done !== 'function') throw new Error('done !== function');
    parallel(fns, context, done);
  };
  return f;
}


// Exports
//
module.exports = {
  series: series,
  makeSeries: makeSeries,

  parallel: parallel,
  makeParallel: makeParallel
};
