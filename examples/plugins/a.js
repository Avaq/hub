var Promise = require('bluebird');

exports.start = function*(app){
  app.a = 0;
  yield app.await('c');
  return Promise.delay(1000).then(function(){app.a = app.a + 1});
};

exports.end = function(app){
  return Promise.delay(1337).then(function(){delete app.a});
};
