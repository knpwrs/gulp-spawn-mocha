describe('gulp-spawn-mocha tests', function () {
  var mocha = require('../lib'),
      through = require('through'),
      proc = require('child_process');

  beforeEach(function () {
    sinon.stub(proc, 'spawn');
    proc.spawn.returns({
      stdout: sinon.stub(through()),
      stderr: sinon.stub(through()),
      on: sinon.stub()
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

  it('should pass arguments to mocha', function () {
    var stream = this.stream = mocha({foo: 'bar', b: ['oof', 'rab']});
    stream.end();
    proc.spawn.should.be.calledWith(sinon.match.string, ['--foo', 'bar', '-b', 'oof', '-b', 'rab']);
  });
});
