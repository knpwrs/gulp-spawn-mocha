// Module Requirements
var _ = require('lodash'),
    through = require('through'),
    proc = require('./cross-proc'),
    join = require('path').join,
    PluginError = require('gulp-util').PluginError;

/**
 * Returns a stream to use with Gulp which executes the passed files as Mocha
 * tests with given options.
 * @param  {Object} ops Options to pass to the mocha executable (see `mocha
 *     -h`). Also accepts additional `bin` property to specifiy custom mocha
 *     binary.
 * @return {Stream}     A readable and writable stream which excutes Mocha,
 *     piping stdout and stderr to the process stdout and stderr.
 */
module.exports = function (ops) {
  // Default ops
  ops = ops || {};
  // Setup
  var bin = ops.bin || join(require.resolve('mocha'), '..', 'bin', 'mocha' + (proc.getPlatform() === 'win32' ? '.cmd' : ''));
  var env = _.extend(_.clone(process.env), ops.env || {});

  ops = _.omit(ops, ['bin', 'env']);

  // Create stream
  var stream = through(function (file) {
    this._files.push(file.path);
  }, function () {
    // Save refernce to this (bindless context cheat)
    var that = this;
    // Generate arguments
    var args = [];
    _.each(ops, function (val, key) {
      if (_.isArray(val)) {
        _.each(val, function (val) {
          addArg(args, key, val);
        });
      } else {
        addArg(args, key, val);
      }
    });
    // Execute Mocha
    this._child = proc.spawn(bin, args.concat(this._files), {env:env});
    this._child.stdout.pipe(process.stdout);
    this._child.stderr.pipe(process.stderr);
    // If there's an error running the process. See http://nodejs.org/api/child_process.html#child_process_event_error
    this._child.on('error', function (e) {
      that.emit('error', new PluginError('gulp-spawn-mocha', e));
    });
    // When done...
    this._child.on('close', function (code) {
      // If code is not zero (falsy)
      if (code) {
        that.emit('error', new PluginError('gulp-spawn-mocha', 'Mocha exited with code ' + code));
      }
      that.emit('end');
    });
  });

  // Attach files array to stream
  stream._files = [];
  // Return stream
  return stream;
};

/**
 * Adds a given argument with name and value to arugment array.
 * @param {Array}  args String array of arguments.
 * @param {String} name Name of the argument.
 * @param {String} val  Value of the argument.
 */
function addArg(args, name, val) {
  args.push((name.length > 1 ? '--' : '-') + name);
  if (_.isString(val) || _.isNumber(val)) {
    args.push(val);
  }
}
