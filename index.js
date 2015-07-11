'use strict';
var tryfer = require('tryfer');
var tryferTrace = tryfer.trace;
var tryferTracers = tryfer.tracers;
var nodeTracers = tryfer.node_tracers;
var hexStringify = tryfer.formatters._hexStringify;
var Scribe = require('scribe').Scribe;
var _ = require('lodash');
// 保存相关的配置信息
var localOptions;

exports.initialize = initialize;
exports.trace = trace;
exports.childTrace = childTrace;

/**
 * [initialize 初始化zipkin client(暂只支持初始化一次)]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function initialize(options) {
  options = _.extend({
    tracers : [],
    host : 'localhost',
    port : 1463,
    scribeStoreName : 'zipkin',
    maxTraces : 50,
    autoReconnect : true,
    debug : false,
    endPoint : {
      host : '127.0.0.1',
      port : 3000,
      service : 'albi'
    },
    localTesting : false
  }, options);
  localOptions = options;
  var client;
  if (!options.localTesting) {
    client = new Scribe(options.host, options.port, {
      autoReconnect : options.autoReconnect
    });
    client.open(function open(err) {
      if (err) {
        console.error(err);
      } else {
        console.info('Scribe connection made, now initializing tracing.');
        var tracer =  new nodeTracers.ZipkinTracer(client, options.scribeStoreName, {
          maxTraces : options.maxTraces
        });
        tryferTracers.pushTracer(tracer);
      }
    });
  }

  _.forEach(options.tracers, function(tmp) {
    tryferTracers.pushTracer(tmp);
  });

  if (options.debug) {
    tryferTracers.pushTracer(new tryferTracers.DebugTracer(process.stdout));
  }

  return client;
}


/**
 * [getTrace description]
 * @param  {[type]} traceName [description]
 * @param  {[type]} options   [description]
 * @return {[type]}           [description]
 */
function trace(traceName, options) {
  if (!traceName) {
    throw new Error('trace name can not be null');
  }
  options = options || {};
  var tmpOptions = {};
  _.forEach(options, function (v, k) {
    tmpOptions['x-b3-' + k.toLowerCase()] = v;
  });
  var t = tryferTrace.Trace.fromHeaders(traceName, tmpOptions);
  var endPoint = localOptions.endPoint;
  if (_.isEmpty(tmpOptions) && endPoint) {
    t.setEndpoint(new tryferTrace.Endpoint(endPoint.host, endPoint.port, endPoint.service));
  }
  t.record(tryferTrace.Annotation.serverRecv(Date.now() * 1000));
  return getTraceResult(t);
}


/**
 * [childTrace description]
 * @param  {[type]} traceName [description]
 * @param  {[type]} options   [description]
 * @return {[type]}           [description]
 */
function childTrace(traceName, options) {
  if (!traceName || !options) {
    throw new Error('traceName and options can not be null');
  }
  options = _.clone(options);
  options.parentSpanId = options.spanId;
  delete options.spanId;
  return trace(traceName, options);
}


/**
 * [getTraceResult description]
 * @param  {[type]} t [description]
 * @return {[type]}   [description]
 */
function getTraceResult(t) {
  var result = _.pick(t, ['traceId', 'spanId', 'parentSpanId']);
  _.forEach(result, function (v, k) {
    result[k] = hexStringify(v);
  });
  result.done = function done(tmp){
    var data = _.extend({}, tmp);
    _.forEach(data, function(v, k) {
      t.record(tryferTrace.Annotation.string(k, v));
    });
    t.record(tryferTrace.Annotation.serverSend());
  };
  return result;
}
