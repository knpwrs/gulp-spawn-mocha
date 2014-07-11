/**
 * This is a simple replacement for the child_process module which only
 * exposes a `spawn` method. Its purpose is to make testing easier by enabling
 * spying on a method of a module rather than a standalone function.
 */

exports.spawn = require('cross-spawn');

exports.getPlatform = function () {
  return process.platform;
};
