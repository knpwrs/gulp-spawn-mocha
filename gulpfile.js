var gulp = require('gulp'),
    mocha = require('./lib');

gulp.task('test', function () {
  return test('spec').on('error', function (e) {
    throw e;
  });
});

gulp.task('default', function () {
  gulp.watch('{lib,test}/*', test);
  test();
});

function test(reporter) {
  var isDebug = process.env.NODE_ENV === 'debug';
  return gulp.src(['test/*.test.js'], {read: false}).pipe(mocha({
    debugBrk: isDebug,
    r: 'test/setup.js',
    R: typeof reporter === 'string' ? reporter : 'nyan',
    istanbul: !isDebug
  })).on('error', console.warn.bind(console));
}
