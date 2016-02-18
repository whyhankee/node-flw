'use strict';
var debug = require('debug')('flw');


function series(fns, context, done) {
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
}


function makeSeries() {
  var fns = [];
  var fnIterator =0;
  while (arguments[fnIterator]) {
    fns.push(arguments[fnIterator++]);
  }

  var f = function seriesFunction(context, done) {
    if (done === undefined && typeof context === 'function') {
      done = context;
      context = {};
    }
    if (typeof done !== 'function') {
      throw new Error('seriesFunction - done !== function');
    }
    return series(fns, context, done);
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
}


function makeParallel() {
  var fns = [];
  var fnIterator =0;

  while (arguments[fnIterator]) {
    fns.push(arguments[fnIterator++]);
  }
  var f = function parallelFunction(context, done) {
    if (done === undefined && typeof context==='function') {
      done = context;
      context = {};
    }
    if (typeof done !== 'function') throw new Error('done !== function');
    return parallel(fns, context, done);
  };
  return f;
}


module.exports = {
  series: series,
  makeSeries: makeSeries,

  parallel: parallel,
  makeParallel: makeParallel
};
