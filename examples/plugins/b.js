var Promise = require('bluebird');

exports.start = function*(app){
  app.b = 1;
  yield app.await('a', 'c');
  app.b += app.a * app.c;
  return Promise.delay(250).then(function(){
    app.b -= 2;
  });
};

exports.end = function(app){
  delete app.b;
};
