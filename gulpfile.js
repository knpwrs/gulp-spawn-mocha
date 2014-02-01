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
  return gulp.src(['test/*.test.js'], {read: false}).pipe(mocha({
    r: 'test/setup.js',
    R: typeof reporter === 'string' ? reporter : 'nyan'
  })).on('error', console.warn.bind(console));
}
