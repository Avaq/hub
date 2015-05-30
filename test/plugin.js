var App = require('../src/app');
var Plugin = require('../src/plugin');

describe("Plugin", function(){

  describe(".isValid()", function(){

    it("should be false for non-objects", function(){
      expect(Plugin.isValid("")).to.equal(false);
      expect(Plugin.isValid([])).to.equal(false);
      expect(Plugin.isValid(true)).to.equal(false);
      expect(Plugin.isValid(undefined)).to.equal(false);
      expect(Plugin.isValid(1)).to.equal(false);
      expect(Plugin.isValid(NaN)).to.equal(false);
    });

    it("should be false for objects without the proper methods", function(){
      expect(Plugin.isValid({})).to.equal(false);
      expect(Plugin.isValid({foo: function(){}})).to.equal(false);
      expect(Plugin.isValid({start: "nyerk"})).to.equal(false);
    });

    it("should be true for objects with the proper methods", function(){
      expect(Plugin.isValid({start: function(){}})).to.equal(true);
      expect(Plugin.isValid({start: function*(){}})).to.equal(true);
    });

  });

  var app = new App;
  var descriptor = {
    start: function(app){return app instanceof App},
    end: function(app){return app instanceof App}
  };

  it("should not construct with invalid arguments", function(){
    expect(function(){new Plugin}).to.throw(TypeError);
    expect(function(){new Plugin("a", "b")}).to.throw(TypeError);
    expect(function(){new Plugin(app, "b")}).to.throw(TypeError);
    expect(function(){new Plugin("a", descriptor)}).to.throw(TypeError);
  });

  it("should construct with valid arguments", function(){
    expect(new Plugin(app, descriptor)).to.be.an.instanceof(Plugin);
  });

  describe("#start()", function(){

    it("should throw when starting while active", function(){
      var plugin = new Plugin(app, descriptor);
      plugin.state = Plugin.ACTIVE;
      expect(plugin.start.bind(plugin)).to.throw(Error);
    });

    it("should throw when starting while pending", function(){
      var plugin = new Plugin(app, descriptor);
      plugin.state = Plugin.PENDING;
      expect(plugin.start.bind(plugin)).to.throw(Error);
    });

    it("should call descriptor.start", function(done){
      var spy = sinon.spy(), plugin = new Plugin(app, {start: spy});
      plugin.start().then(function(){
        expect(spy).to.have.been.calledWith(app);
      }).nodeify(done);
    });

    it("should become pending and then active", function(done){
      var plugin = new Plugin(app, descriptor);
      var promise = plugin.start();
      expect(plugin.state).to.equal(Plugin.PENDING);
      promise.then(function(){
        expect(plugin.state).to.equal(Plugin.ACTIVE);
      }).nodeify(done);
    });

    it("should emit start", function(done){
      var plugin = new Plugin(app, descriptor);
      this.timeout(20);
      plugin.once('start', done);
      plugin.start();
    });

    it("should become failed when an error is encountered", function(done){
      var plugin = new Plugin(app, {start:function(){throw new Error("Kaputt!")}});
      plugin.start()
      .then(function(){
        done(new Error("No error was encountered!"));
      })
      .catch(function(err){
        expect(err.message).to.equal('Kaputt!');
        expect(plugin.state).to.equal(Plugin.FAILED);
      })
      .nodeify(done);
    });

    it("should emit fail when an error is encountered", function(done){
      var plugin = new Plugin(app, {start:function(){throw new Error("Kaputt!")}});
      this.timeout(20);
      plugin.once('fail', done.bind(null, null));
      plugin.start().catch(function(err){});
    });

  });

  describe("#end()", function(){

    var plugin;

    beforeEach(function(done){
      plugin = new Plugin(app, {
        start: descriptor.start,
        end: sinon.spy()
      });
      plugin.start().nodeify(done);
    });

    it("should throw when starting while not active", function(){
      var plugin = new Plugin(app, descriptor);
      expect(plugin.end.bind(plugin)).to.throw(Error);
    });

    it("should call descriptor.end", function(done){
      plugin.end().then(function(){
        expect(plugin.descriptor.end).to.have.been.calledWith(app);
      }).nodeify(done);
    });

    it("should set the state back to pending and then inactive", function(done){
      var promise = plugin.end();
      expect(plugin.state).to.equal(Plugin.PENDING);
      promise.then(function(){
        expect(plugin.state).to.equal(Plugin.INACTIVE);
      }).nodeify(done);
    });

    it("should emit end", function(done){
      this.timeout(20);
      plugin.on('end', done);
      plugin.end();
    })

  });

});
