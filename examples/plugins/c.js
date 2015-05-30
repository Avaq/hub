var Promise = require('bluebird');

exports.start = function(app){
  app.c = 2;
  return Promise.delay(2000).then(function(){app.c++});
};

exports.end = function(app){
  return Promise.delay(400).then(function(){delete app.c});
};
