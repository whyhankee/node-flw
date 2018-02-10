'use strict';
const bench = require('fastbench');
const flw = require('../flw');


const handlers = [handler, handler, handler];


// Our dummy handler
function handler(c, done) {
  return done();
}


const run = bench([

  function series(done) {
    flw.series(handlers, done);
  },
  function parallel(done) {
    flw.parallel(handlers, done);
  },

  function makeSeries(done) {
    const fn = flw.make.series(handlers);
    return fn(done);
  },
  function makeParallel(done) {
    const fn = flw.make.parallel(handlers);
    return fn(done);
  },

  function combined(done) {
    flw.parallel([
      flw.make.parallel(handlers),
      flw.make.series(handlers)
    ], done);
  },

  function each(done) {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];

    return flw.each(items, eachItemHandler, done);
    function eachItemHandler(item, cb) {
      return cb();
    }
  }
], 50000);


// run them two times
run(run);
