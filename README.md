# gulp-spawn-mocha

This is a plugin for [gulp][gulp] which runs [Mocha][mocha] tests in a child
process. Each time tests are run a new child process is created meaning the
test environment always starts clean and modules are never cached.

## Usage

Usage is according to this API:

```javascript
stream.pipe(mocha({
  // options
}))
```

The only special option is `bin`. You can set `bin` to be a path to a `mocha`
executable to use instead of the one bundled with this plugin. Currently, this
plugin comes with mocha `~1.16.2`. All other options are properly prefixed
with either `-` or `--` and passed to the `mocha` executable. See the
following example usage:

```javascript
var gulp = require('gulp'),
    mocha = require('gulp-spawn-mocha');

gulp.task('test', function () {
  return test().on('error', function (e) {
    throw e;
  });
});

gulp.task('default', function () {
  gulp.watch('{lib,test}/*', test);
  test();
});

function test() {
  return gulp.src(['test/*.test.js'], {read: false}).pipe(mocha({
    r: 'test/setup.js',
    R: 'nyan'
  })).on('error', console.warn.bind(console));
}
```

The `test` *function* will run the `mocha` executable telling it to require
`test/setup.js` and use the `nyan` reporter -- if there is an error it will
output a warning to the console. See `mocha -h` for additional options.

The `test` *task* will throw an error, crashing `gulp` (good for continuous
integration environments).

The `default` task will watch for changes and execute tests whenever a change
is detected. It will also execute tasks immediately without waiting for a
change.

## License

**The MIT License**

Copyright (c) 2014 Kenneth Powers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

  [gulp]: http://gulpjs.com/ "gulp.js"
  [mocha]: http://visionmedia.github.io/mocha/ "Mocha"
