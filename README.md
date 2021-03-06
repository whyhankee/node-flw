## flw

Another callback flow control library, inspired by `async` and `bach`.

[![Travis-CI](https://travis-ci.org/whyhankee/node-flw.svg)](https://travis-ci.org/whyhankee/node-flw)
[![Coverage Status](https://coveralls.io/repos/github/whyhankee/node-flw/badge.svg?branch=master)](https://coveralls.io/github/whyhankee/node-flw?branch=master)
[![David](https://david-dm.org/whyhankee/node-flw.svg)](https://david-dm.org)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/node-flw/Lobby?utm_source=share-link&utm_medium=link&utm_campaign=share-link)


## What / Why

* Better way to build complex flows, *very heavy* inspired by the elegant  <https://github.com/gulpjs/bach>
* Be able to stop the flow, keeping the err mechanism for system-errors - Sometimes there is just no more work to be done. Only useful in a `.series()`
* Auto-avoid 'callback on the same tick' stack-overflow issues, all functions will be called with `setImmediate()` (or `setTimeout()` in a browser).

*Note*

  * The context is always passed to the final callback (also in case of an error)


### Example usage

```javascript
const flw = require('flw');

function processFile(filename, done) {
  const flow = [
    flw.fwap(fs.readFile, ['./userid.txt', 'utf8'], 'file'),
    getUserData,
    flw.make.parallel([
      doSomething,
      doSomethingElse
    ]),
    doSomethingLast,
  ];
  return flw.series(flow, (err, context) => {
    if (err) return done(err);

    if (context._stopped === 'emptyFile') {
      return done(null, null);
    }

    return done(null, context.result);
  });
}

function getUserData(c, cb) {
  console.log('contents of the file', c.file);

  // c._stop() will stop the flow
  if (!c.file.length) return c._stop('emptyFile', cb);

  // We assume there is one userId in the file
  const userId = parseInt(c.file);

  // Fetch user from db, save in context
  return lookupUserId(userId, c._store('userData', cb));
}

function doSomething(c, cb) {
  // ...
  return cb();
}

function doSomethingElse(c, cb) {
  // ...
  return cb();
}

function doSomethingLast(c, cb) {
  c.result = ....;
  return cb();
}
```


## Installation

    npm install flw


## API

### .series([fn, fn], [context], [returnKey], done)

Will call the functions in series, you can provide an initial context by passing a context object.
If `returnKey` is present only `context[returnKey]` will be passed to `done()`

example:
```
const context = {
  userid: userId
};

flw.series([a, b, c], context, function (err, context) {
  console.log(err, context._clean();)
});
```

### .parallel([fn, fn], [context], [returnKey], done)

Will call the functions in parallel, you can provide an initial context by passing a context object.
If `returnKey` is present only `context[returnKey]` will be passed to `done()`

example:
```
flw.parallel([a, b, c], function (err, context) {
  console.log(err, context;)
});
```

### .make([fn, fn], [context], [returnKey])

With make you can use the flow functions without them directly executing. In this way you can compose different flow functions without having to resort to anonymous functions or having to `bind` them.

example:
```
const ourSeries = flw.make.series([
  a, b, c
]);
ourSeries(function (err, context) {
  console.log(err, context;)
});
```

or, combine flows:
```
flw.series([
  flw.make.parallel([a, b]),
  flw.make.series([c, d, e]),
  flw.make.parallel([f, g, h, i])
], onDone);
```

### .eachSeries(items, fn, callback)

Simple async Array processing (one at a time).

example:

```
const items = ['a', 'b', 'c', 'd', 'e', 'f'];
flw.eachSeries(items, doItem, function (err, results) { ... });
```

### .each(items, [numParallel], fn, callback)

Simple parallel array processing.

*Note: When running `each()` in parallel your items could be returned out of order. If the order is really important use `.eachSeries()`.*

example:

```
const items = ['a', 'b', 'c', 'd', 'e', 'f'];
const numParallel = 5;  // optional (default 3)
flw.each(items, numParallel, doItem, function (err, results) { ... });
```

### .n(num, fn, callback)

Call an async function `num` times and return the results as an Array.
The difference with `.times` is that `.n` will pass the index as first argument

example:

```
flw.times(2, doItem, function (err, results) { ... });

function doItem(index, done) {
  return done(null, index);
}
```


### .times(num, fn, callback) (deprecated, use .n())

Call an async function `num` times and return the results as an Array.

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

  console.log(context.hostfile);
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
