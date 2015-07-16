zipkin主要关注三个属性：

- traceId：用于跟踪整个服务

- spanId：每一个单独的服务有一个新的spanId

- parentSpanId：如果是由其它的服务调用，指向调用服务

假设用户访问页面A，服务器响应这个请求，在接收到请求的时候，生成了记录A{traceId : TA, spanId : SA}，生成A页面的数据，需要调用B服务，从数据库获取数据，则根据记录A，生成记录B{traceId : TA, spanId : SB, parentSpanId : SA}，如果还有其它的服务，也如此，最终就可以根据traceId，spanId，parentSpanId来生成一个服务的调用时间线。


```
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


```


### initialize

初始化函数

```
zipkin.initialize({
  tracers : [],
  host : 'localhost',
  port : 1463,
  scribeStoreName : 'zipkin',
  maxTraces : 50,
  autoReconnect : true,
  // 设为true则添加debugTracer，输出到控制台
  debug : false,
  // 设置为true则不连接服务器，只本地调试
  localTesting : false
})；
```



### trace

- traceName 服务名称

- options optional

trace服务调用，返回{traceId : xxx, spanId : xxx, parentSpanId : optional, done : function}


### childTrace

- traceName 服务名称

- options 当前trace的相关参数

childTrace服务调用，返回{traceId : xxx, spanId : xxx, parentSpanId : optional, done : function}
