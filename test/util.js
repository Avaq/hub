var util = require('../src/util');
var nativeUtil = require('util');

describe("util", function(){

  it("should extend native util", function(){
    expect(util.__proto__).to.equal(nativeUtil);
  });

  describe(".isGenerator()", function(){

    it("should return true for generator functions", function(){
      expect(util.isGenerator(function*(){})).to.equal(true);
    });

    it("should return false for anything else", function(){
      expect(util.isGenerator(true)).to.equal(false);
      expect(util.isGenerator(undefined)).to.equal(false);
      expect(util.isGenerator([])).to.equal(false);
      expect(util.isGenerator({})).to.equal(false);
      expect(util.isGenerator(1)).to.equal(false);
      expect(util.isGenerator(NaN)).to.equal(false);
      expect(util.isGenerator(function(){})).to.equal(false);
    });

  });

  describe(".promise()", function(){

    it("should wrap functions to return a promise", function(done){
      var fn = util.promise(function(){return 42});
      expect(fn).to.be.a('function');
      var ret = fn();
      expect(ret).to.be.an.instanceof(Promise);
      expect(ret).to.eventually.equal(42).notify(done);
    });

    it("should wrap generators to return a promise", function(done){
      var fn = util.promise(function*(){
        var a = yield Promise.resolve(41);
        return a+1;
      });
      expect(fn).to.be.a('function');
      var ret = fn();
      expect(ret).to.be.an.instanceof(Promise);
      expect(ret).to.eventually.equal(42).notify(done);
    });

  });

});
