zipkin主要关注三个属性：

- traceId：用于跟踪整个服务

- spanId：每一个单独的服务有一个新的spanId

- parentSpanId：如果是由其它的服务调用，指向调用服务

假设用户访问页面A，服务器响应这个请求，在接收到请求的时候，生成了记录A{traceId : TA, spanId : SA}，生成A页面的数据，需要调用B服务，从数据库获取数据，则根据记录A，生成记录B{traceId : TA, spanId : SB, parentSpanId : SA}，如果还有其它的服务，也如此，最终就可以根据traceId，spanId，parentSpanId来生成一个服务的调用时间线。


```
var traceA = zipkin.trace('A');
// A服务调用的东西
setTimeout(function(){
  var traceB = zipkin.childTrace('B', traceA);
  setTimeout(function(){
    // B服务相关的一些参数记录
    traceB.done({
      code : 'xxx'
    });
    // A服务相关的一些参数记录
    traceA.done({
      name : 'xxx'
    });
  });
}, 1000);

```
