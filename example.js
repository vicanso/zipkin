var zipkin = require('./index');
zipkin.initialize({
  localTesting : true,
  debug : true
});

(function(){
  var done = zipkin.trace('getUserAccount').done;
  getUserAccount(function(err, account) {
    done({
      account : account
    });
  });

  getData(function(){});
})();

setTimeout(function(){}, 120 * 1000);


function getUserAccount(cbf) {
  setTimeout(function() {
    cbf(null, 'vicanso');
  }, 3000);
}


function getData(cbf) {
  var t =  zipkin.trace('getData');
  var httpHeaders = zipkin.getHeaders(t);
  console.dir(httpHeaders);
  var childTrace = zipkin.childTrace('getUserAccount', t);
  getUserAccount(function(err, account){
    childTrace.done({
      account : account
    });
    setTimeout(function(){
      t.done();
    }, 1000);
  })
}
