'use strict'

// Module Requirements
const _ = require('lodash')
const fs = require('fs')
const through = require('through')
const proc = require('child_process')
const join = require('path').join
const PluginError = require('gulp-util').PluginError

/**
 * Returns a stream to use with Gulp which executes the passed files as Mocha
 * tests with given options. Child process inherits stdin and stdout.
 * @param  {Object} ops Options to pass to the mocha executable (see `mocha
 *     -h`). Also accepts additional `bin` property to specifiy custom mocha
 *     binary.
 * @return {Stream}     A readable and writable stream which excutes Mocha,
 *     piping stdout and stderr to the process stdout and stderr.
 */
module.exports = function (ops, coverage) {
  // Default ops
  ops = ops || {}
  // Setup
  const nyc = ops.nyc
  const output = ops.output
  // Using istanbul? Use _mocha, otherwise use mocha in order to support full node options (e.g., --debug-brk)
  const mochaBin =
    ops.bin || join(require.resolve('mocha'), '..', 'bin', 'mocha')
  const env = _.extend(_.clone(process.env), ops.env || {})
  const cwd = ops.cwd
  const execPath = ops.execPath || process.execPath
  ops = _.omit(ops, ['bin', 'env', 'cwd', 'execPath', 'nyc'])

  // Create stream
  let stream = through(
    function (file) {
      this._files.push(file.path)
    },
    function () {
      // make sure there are files to test
      if (this._files.length === 0) {
        this.emit('end')
        return
      }

      // Save refernce to this (bindless context cheat)
      let that = this

      // Parse arguments
      const mochaArgs = parseArgs(ops)

      let executeBin = mochaBin
      let executeArgs = _.cloneDeep(mochaArgs)

      if (nyc) {
        executeArgs.unshift(mochaBin)
        const nycBin =
          nyc.bin ||
          join(
            require.resolve('nyc'),
            '..',
            require('nyc/package.json').bin.nyc
          )
        executeBin = nycBin
        if (_.isObject(nyc)) {
          const nycArgs = parseArgs(_.omit(nyc, ['bin']))
          executeArgs.unshift(...nycArgs)
        }
      }

      // Execute Mocha, stdin and stdout are inherited
      this._child = proc.fork(executeBin, executeArgs.concat(this._files), {
        cwd,
        env,
        execPath,
        silent: !!output
      })
      // If there's an error running the process. See http://nodejs.org/api/child_process.html#child_process_event_error
      this._child.on('error', (e) => {
        that.emit('error', new PluginError('gulp-spawn-mocha', e))
        that.emit('end')
      })
      // When done...
      this._child.on('close', (code) => {
        // If code is not zero (falsy)
        if (code) {
          that.emit(
            'error',
            new PluginError(
              'gulp-spawn-mocha',
              `Mocha exited with code ${code}`
            )
          )
        }
        that.emit('end')
      })
      // Output to a file
      if (output) {
        let s = _.isString(output) ? fs.createWriteStream(output) : output
        that._child.stdout.pipe(s)
        that._child.stderr.pipe(s)
      }
    }
  )

  // Attach files array to stream
  stream._files = []
  // Return stream
  return stream
}

/**
 * Parses the arugments from a configuration object for passing to a mocha
 * executable.
 * @param  {Object} argsObj The object to parse from.
 * @return {Array}      An array of parsed arguments.
 */
function parseArgs (argsObj) {
  let args = []
  _.each(argsObj, (val, key) => {
    if (_.isArray(val)) {
      _.each(val, (_val) => {
        addArg(args, key, _val)
      })
    } else {
      addArg(args, key, val)
    }
  })
  return args
}

/**
 * Adds a given argument with name and value to arugment array.
 * @param {Array}  args String array of arguments.
 * @param {String} name Name of the argument.
 * @param {String} val  Value of the argument. Returns without doing anything
 *     if falsy and not zero.
 */
function addArg (args, name, val) {
  if (!val && val !== 0) {
    return
  }
  let arg = name.length > 1 ? `--${_.kebabCase(name)}` : `-${name}`
  // --max-old-space-size argument requires an `=`
  if (arg === '--max-old-space-size') {
    args.push(`${arg}=${val}`)
    return
  } else {
    args.push(arg)
  }
  if (_.isString(val) || _.isNumber(val)) {
    args.push(val)
  }
}
