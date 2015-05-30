"use strict";
var fs = require('fs');
var path = require('path');
var Mocha = require('mocha');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require('chai-as-promised');
global.Promise = require('bluebird');

//Add some mocha.
var mocha = new Mocha;

//Set up Bluebird.
Promise.longStackTraces();

//Set up Chai.
chai.use(sinonChai);
chai.use(chaiAsPromised);

//Expose Sinon and Chai.
global.sinon = sinon;
global.expect = chai.expect;

//Rejections per test.
var rejections = null;

//Store unhandled rejections.
Promise.onPossiblyUnhandledRejection(function(err, promise){
  if(!rejections) throw err;
  rejections.set(promise, err);
});

//Remove eventually handled rejections.
Promise.onUnhandledRejectionHandled(function(promise){
  rejections.delete(promise);
});

//Add files to mocha.
 fs.readdirSync(path.resolve(__dirname, 'test'))
.filter(function(name){return /\.js$/.test(name)})
.map(function(name){return path.resolve(__dirname, 'test', name)})
.forEach(mocha.addFile.bind(mocha));

//Execute the runner.
var runner = mocha.ui('bdd').run();

//When a test starts, create a new map for its possible rejections.
runner.on('test', function(test){
  rejections = new Map;
})

//When the test ends, check if there are rejections left and fail the test if there are.
runner.on('test end', function(test){

  //Try to check for unahandled rejections and fail the test if there are any.
  try{
    if(!(rejections && rejections.size > 0)) return rejections = null;
    var messages = [];
    for(let err of rejections.values()) messages.push(err.stack || err.toString());
    rejections = null;
    runner.fail(test, new Error("Finished with unhandled rejections:\n\n" + messages.join("\n\n")));
  }

  //Let someone know that we couldn't handle the rejections.
  catch(err){
    console.error("Failed to handle rejections:", err.stack);
  }

});
