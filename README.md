## flw

Another callback flow control library, inspired by `async` and `bach`.

[![Travis-CI](https://travis-ci.org/whyhankee/flw.svg)](https://travis-ci.org/whyhankee/flw)
[![David](https://david-dm.org/whyhankee/flw.svg)](https://david-dm.org)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/whyhankee/flw?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## What / Why

`async` is the defacto standard for callback flow control. I do have some issues here that I would like to improve:

* I'm always struggling with combinations of `auto`, `series`, `parallel`, `waterfall` and keeping references to the results from the called functions. It seems to boil down to either:

	* Assign the results to variables in an outer scope - yuck
	* Dragging everything with you in a waterfall during the entire flow - yuck
	* Use `async.auto`, close, however, the dependency map is easy to get wrong over time

* Better way to build complex flows, *very heavy* inspired by the elegant  <https://github.com/gulpjs/bach>

* Be able to stop the flow, keeping the err mechanism for system-errors. Only useful in a .series()


## How (The context)

The major change is that during the flow control a context object is passed to all called functions where they store their results or can retrieve results from other functions. The context is passed to the final callback.

The context is an object with some methods to help interact with the flow:

* `_store('key', cb)`

  Store the result of an async operation on the context and call the callback

* `_stop(reason, cb)`

   Stop's the flow in a .series() call and stores reason in context._stopped)

* `_clean()`


 Cleans the `flw` related data from the context and returns the context


_note: context is always passed to the final callback (also in case of an error)_


### Example code

```
var flw = require('flw');


function addUser(userProps, done) {
  var context = {
    newUserProps: userProps
  };

  flw.series([
    createUser,
    sendCreateEvent
  ], context, function (err, context) {
    if (err) return done(err);

    return done(null, context.user);
  });
}

function _createUser(c, cb) {
  var user = new User(c.userProps);
  return user.save(c._store('user', cb));
}

function _sendCreateEvent(c, cb) {
  queue.publish({
    queue: 'app.user.created',
    id: c.user.id
  }, cb);
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


### .wrap(fn, [arguments], key)

Wraps a regular async function (without context)
  will call the function with the arguments (if provided)
  will store results in context[key] (if provided)

example:

```
flw.series([
  flw.wrap(fs.readFile, ['/etc/hostfile', 'utf8'], hostfile),
], function (err, context) {
  if (err) throw err;

  console.log(context.hostFile);
}
```


## Tests and development

`npm run test` - for default tests

`DEBUG=flw* npm run tdd` - for continuous reload and debug output

Also, please don't forget to check this when you submit a PR

`npm run benchmark`


## Changelog

v0.0.14

* Fix ESlint dependency for older node version

v0.0.13

* Updated dependencies
* Implement .wrap()
* Update README documentation
* Fix: context._clean() now returns a copy of the object

v0.0.12

* Fix ESlint dependency for older node version

v0.0.11

* .series() support for `context._stop(reason, cb);`
* Update dependencies

v0.0.10

* Implement context.\_clean()
* Switched from CircleCI to TravisCI
* Update documentation for `.each()`

v0.0.9

* `.each()` now returns the results

v0.0.8

* Browser bugfix

v0.0.7

* new method `.each()`
* Support predefined (optional) context

```
var context = {
    preset: 'something'
};
flw.series(fns, context, callback);
```

v0.0.6

* Also pass context to final callback in an error situation

v0.0.5

* Complete browser support (see tests/browser.html)
* Added tests for context separation

v0.0.4

* Browser support (setTimeout, slow!!)

v0.0.3

* Changed syntax of makeParallel() & makeSerial() to make.serial() & make.parallel()
  Thanks @godspeedelbow
* Changed function signature of make.* (always use arrays)
* added context.flw_store() method
* Added to CircleCI and show badge
* Added benchmarks

v0.0.2

* Cleanup

v0.0.1

* Initial commit
