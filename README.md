## flw

Another callback flow control library, inspired by `async` and `bach`.

[![Travis-CI](https://travis-ci.org/whyhankee/flw.svg)](https://travis-ci.org/whyhankee/flw)
[![Coverage Status](https://coveralls.io/repos/github/whyhankee/flw/badge.svg?branch=master)](https://coveralls.io/github/whyhankee/flw?branch=master)
[![David](https://david-dm.org/whyhankee/flw.svg)](https://david-dm.org)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/whyhankee/flw?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## What / Why

`async` is the defacto standard for callback flow control. I do have some issues here that I would like to improve:

* I'm always struggling with combinations of `auto`, `series`, `parallel`, `waterfall` and keeping references to the results from the called functions. It seems to boil down to either:

	* Assign the results to variables in an outer scope - yuck. This would also require you to use inline functions which gives long messy functions and a performance hit since the functions need to be created every-time the funcion gets called.

	* Dragging everything with you in a waterfall during the entire flow - yuck. When you need to retain more than a few result variables this get messy real fast. It would also limit the beneficial use of parallel functions half-way.

	* Use `async.auto` - Close, however, the dependency map is easy to get wrong over time.

  * So, in `flw` every function gets called with a context object to store and retrieve data. The context object also has some helper methods.

* Better way to build complex flows, *very heavy* inspired by the elegant  <https://github.com/gulpjs/bach>

* Be able to stop the flow, keeping the err mechanism for system-errors - Sometimes there is just no more work to be done. Only useful in a `.series()`

* Auto-avoid 'callback on the same tick' stack-overflow issues, all functions will be called with `setImmediate()` (or `setTimeout()` in a browser).


*Note*

  * The context is always passed to the final callback (also in case of an error)


### Example usage

```
var flw = require('flw');

function processFile(filename, done) {
  return flw.series([
    flw.fwap(fs.readFile, ['./source.txt', 'utf8], 'file'),
    doSomethingFirst,
    flw.make.parallel([
      doSomethingElse,
      doSomethingElseToo
    ])
    doSomethingLast,
  ], (err, context) => {
    if (err) return done(err);

    if (context._stopped === 'emptyFile') {
      return done(null, null);
    }

    return done(null, context.result);
  });
}

function doSomethingFirst(c, cb) {
  console.log('contents of the file', c.file);

  if (!c.file.length) return c._stop('emptyFile', cb);
  ...
  return cb();
}

...

function doSomethingLast() {
  context.result = ....;
  return cb();
}
```


## Installation

    npm install flw


## API

### .series([fn, fn], [context], done)

Will call the functions in series, you can provide an initial context by passing a context object.

example:
```
var context = {
  userid: userId
};

flw.series([a, b, c], context, function (err, context) {
  console.log(err, context._clean();)
});
```

### .parallel([fn, fn], [context], done)

Will call the functions in parallel, you can provide an initial context by passing a context object.

example:
```
flw.parallel([a, b, c], function (err, context) {
  console.log(err, context;)
});
```

### .make

With make you can use the flow functions without them directly executing. In this
way you can compose different flow functions without having to resort to anonymous
functions or having to `bind` them.

example:
```
var ourSeries = flw.make.series([a, b, c]);
ourSeries(function (err, context) {
  console.log(err, context;)
});
```

example:
```
flw.series([
  flw.make.parallel([a, b]),
  flw.make.series([c, d, e]),
  flw.make.parallel([f, g, h, i])
], onDone);
```

### .each(items, [numParallel], fn, callback)

Simple async Array processing.

*Note: When running `each()` in parallel your items could be returned out of order. If the order is really important use `numParallel=0`.*

example:

```
var items = ['a', 'b', 'c', 'd', 'e', 'f'];
var numParallel = 5;  // optional (default 3)
flw.each(items, numParallel, doItem, function (err, results) { ... });
```

### .n(num, fn, callback)

Call an async function `num` times and return the results as an Array
The difference with `.times` is that `.n` will pass the index as first argument

example:

```
flw.times(2, doItem, function (err, results) { ... });

function doItem(index, done) {
  return done(null, index);
}
```


### .times(num, fn, callback) - deprecated, use .n()

Call an async function `num` times and return the results as an Array

example:

```
flw.times(2, doItem, function (err, results) { ... });

function doItem(done) {
  return done(null);
}
```


### .wrap(fn, [arguments], [key])

Wraps a regular async function (without context)
  will call the function with the arguments (if provided)
  will store results in context [key] (if provided)

example:

```
flw.series([
  flw.wrap(fs.readFile, ['/etc/hostfile', 'utf8'], hostfile),
], function (err, context) {
  if (err) throw err;

  console.log(context.hostFile);
}
```

## context methods

### ._store('key', cb)

Store the result of an async operation on the context and call the callback

### ._stop(reason, cb)

Stops the flow in a .series() call, stores `reason` in `context._stopped`.

### ._clean()

Returns a copy of the context without the `flw`-related data



## Tests and development

`npm run test` - for default tests

`DEBUG=flw* npm run tdd` - for continuous reload and debug output

Also, please don't forget to check this when you submit a PR

`npm run benchmark`
