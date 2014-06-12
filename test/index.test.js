describe('gulp-spawn-mocha tests', function () {
  var mocha = require('../lib'),
      through = require('through'),
      proc = require('child_process'),
      PluginError = require('gulp-util').PluginError;

  beforeEach(function () {
    sinon.stub(proc, 'spawn');
    this.childOn = sinon.stub();
    proc.spawn.returns({
      stdout: sinon.stub(through()),
      stderr: sinon.stub(through()),
      on: this.childOn
    });
  });

  afterEach(function () {
    // Common assertions
    proc.spawn.should.be.calledOnce;
    proc.spawn.should.be.calledWith(sinon.match.string, sinon.match.array);
    this.stream._child.stdout.pipe.should.be.calledOnce;
    this.stream._child.stdout.pipe.should.be.calledWith(process.stdout);
    this.stream._child.stderr.pipe.should.be.calledOnce;
    this.stream._child.stderr.pipe.should.be.calledWith(process.stderr);
    // Restore spawn functionality
    proc.spawn.restore();
  });

  it('should buffer filenames and pass them to mocha', function () {
    var stream = this.stream = mocha();
    var paths = ['foo', 'bar', 'baz'];
    paths.forEach(function (path) {
      stream.write({path: path});
    });
    stream._files.should.deep.equal(paths);
    proc.spawn.should.not.be.called;
    stream.end();
    proc.spawn.should.be.calledWith(sinon.match.string, this.stream._files);
  });

  it('should default to proper binary', function () {
    var bin = require('path').join(__dirname, '..', 'node_modules', '.bin', 'mocha');
    var stream = this.stream = mocha();
    stream.end();
    proc.spawn.should.be.calledWith(bin, []);
  });

  it('should allow for a custom mocha binary', function () {
    var stream = this.stream = mocha({bin: 'foo mocha'});
    stream.end();
    proc.spawn.should.be.calledWith('foo mocha', []);
  });

  it('should allow for a custom environment', function () {
    var stream = this.stream = mocha({env: {'FOO' : 'BAR'}});
    stream.end();
    proc.spawn.should.be.calledWith(sinon.match.any, sinon.match.any, sinon.match({env: {'FOO' : 'BAR'}}));
  });

  it('should pass arguments to mocha', function () {
    var stream = this.stream = mocha({foo: 'bar', b: ['oof', 'rab']});
    stream.end();
    proc.spawn.should.be.calledWith(sinon.match.string, ['--foo', 'bar', '-b', 'oof', '-b', 'rab']);
  });

  it('should only pass string or number values of arguments to mocha', function() {
    var stream = this.stream = mocha({foo: 'bar', n: 42, colors: true, debug: undefined, S: null});
    stream.end();
    proc.spawn.should.be.calledWith(sinon.match.string, ['--foo', 'bar', '-n', 42, '--colors', '--debug', '-S']);
  });

  it('should handle errors from mocha', function () {
    this.childOn.yields(-1);
    var stream = this.stream = mocha();
    sinon.stub(stream, 'emit');
    stream.emit.withArgs('error').returns();
    stream.end();
    this.childOn.should.be.calledOnce;
    stream.emit.should.be.calledWith('error', sinon.match.instanceOf(PluginError));
  });
});
