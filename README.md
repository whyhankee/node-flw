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

* Be able to stop the flow (todo)


## How (The context)

The major change is that during the flow control a context object is passed to all called functions where they store their results or can retrieve results from other functions. The context is used to store and retrieve data during the flow.

It has some methods to work with the flow:
* `_store()` - store the result of an async operation on the context and call the callback
* `_clean()` cleans the `flw` related data from the context.

An example handler looks like this:
```
function createUser(context, cb) {
  // add randomValue to the context;
  context.randomValue = 'notSoRandom';

  var user = new User(userProps);
  return user.save(context._store('user', cb));
}
```
_note: the _store() method stores the result of the operation in the context as 'user_


A flow could be called with:
```
flw.series([
  flw.make.parallel([createUser, createSomethingElse]),
  flw.make.series([doSomething, doSomethingMore]),
], function (err, context) {
  ....
});
```
_note: context is always passed to the final callback (also in case of an error)_


## Installation

    npm install flw

## API

### .series([fn, fn], [context], done)

example:
```
flw.series([a, b, c], function (err, context) {
  console.log(err, context;)
});
```

### .parallel([fn, fn], [context], done)

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


## Tests and development

`npm run test` - for default tests

`DEBUG=flw* npm run tdd` - for continuous reload and debug output

Also, please don't forget to check this when you submit a PR

`npm run benchmark`


## Todo

* Being able to stop the flow without abusing the `err` mechanism.


## Changelog

v0.0.10 (next)

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
