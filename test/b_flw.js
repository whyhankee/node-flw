"use strict;";
var bench = require('fastbench');
var flw = require('../flw');


function handler(c, cb) {
  return cb();
}


var run = bench([
  function series (done) {
    flw.series([handler, handler, handler], done);
  },
  function parallel (done) {
    flw.parallel([handler, handler, handler], done);
  },

  function makeSeries (done) {
    var fn = flw.make.series(handler, handler, handler);
    fn(done);
  },
  function makeParallel (done) {
    var fn = flw.make.parallel(handler, handler, handler);
    fn(done);
  },

  function combined (done) {
    flw.series([
      flw.make.parallel(handler, handler, handler),
      flw.make.series(handler, handler, handler)
    ], done);
  },

], 50000);


// run them two times
run(run);
