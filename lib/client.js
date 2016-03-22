/**
 * Created by sko on 08.03.16.
 */
'use strict';

//noinspection JSUnresolvedFunction
var events = require('events'),
    Callback = require('./callback'),
    inherits = require('inherits');

/**
 * A utility function to map objects like {0: "Foo", 1:"Bar"} to ["Foo", "Bar"], as the marshalling of arrays from and
 * to the worker maps arrays to objects
 * @param {Object} obj that will be mapped to the array
 * @returns {Array}
 */
var objectToArray = function (obj) {
    var arr = [];
    if(obj) {
        Object.keys(obj).forEach(function (key) {
            arr.push(obj[key]);
        });
    }
    return arr;
};

/**
 * Creates a new instance of MqttServiceWorker object, that wraps all calls to the MqttClient to a Worker or SharedWorker
 * @param {String} workerUri the Uri where the worker script is located, probably something like "bower_component/mqttsw/mqttsw.js"
 * @param {String} documentUrl
 * @param {Boolean} useSharedWorker flag whether or not to use a SharedWorker===false or Worker===true
 * @returns {MqttSW} A wrapper object arround the MqttClient object that maps all calls to the Worker
 * @constructor
 */
function MqttSW(workerUri, documentUrl, useSharedWorker) {

    console.log("MqttSW", arguments);

    if(!(this instanceof MqttSW)) {
        return new MqttSW(workerUri, documentUrl, useSharedWorker);
    }

    this.workerUri = workerUri;
    this.worker = {};
    this.options = {};
    this.connected = false;
    this.disconnecting = false;
    //'publish',
    //this.clientMethods = [
    //    'setMaxListeners'
    //];
    //'connect'
    //'unsubscribe',
    //'subscribe',

    this.connected = false;
    this.useSharedWorker = useSharedWorker || false;

    this.callbacks = new Callback();

    this._startWorker();
    //this._init(this.clientMethods, this, this.worker);
    events.EventEmitter.call(this);
}

inherits(MqttSW, events.EventEmitter);

MqttSW.prototype.VERSION = "0.0.1";

MqttSW.prototype._startWorker = function () {
    console.log('startWorker', this.workerUri);
    var port;
    if(this.useSharedWorker) {
        this.worker = new SharedWorker(this.workerUri);
        this.worker.port.start();
        port = this.worker.port;
    } else {
        this.worker = new Worker(this.workerUri);
        port = this.worker;
    }

    this.worker.onerror = this._onError.bind(this);
    this._addEventListenerToWoker(port, 'message', this._onMessage.bind(this));

};

/**
 *
 * @param clientMethods
 * @param root
 * @param worker
 * @private
 */
//MqttSW.prototype._init = function (clientMethods, root, worker) {
//    clientMethods.forEach(function (type) {
//        root[type] = function () {
//            if(worker.port) {
//                worker.port.postMessage({type: type, args: arguments});
//            } else {
//                worker.postMessage({type: type, args: arguments});
//            }
//            return root;
//        }
//    });
//};

/**
 *
 * @param event
 * @private
 */
MqttSW.prototype._onMessage = function (event) {
    var arr = objectToArray(event.data.args);

    switch (event.data.type) {
        case 'connect':
            this.connected = true;
            this.emit.apply(this, [event.data.type].concat(arr));
            break;
        case 'close':
            this.connected = false;
            this.emit.apply(this, [event.data.type].concat(arr));
            break;
        case 'callback':
            this.callbacks.onceCallback.apply(this.callbacks, arr);
            break;
        case 'options':
            console.log("_onMessage", event.data.args);
            this.options = event.data.args;
            // this is an extra api that exdends mqtt.js
            // we now could listen on client.on('options', callback)
            this.emit.apply(this, [event.data.type].concat(arr));
            break;
        default:
            this.emit.apply(this, [event.data.type].concat(arr));
    }

    //if(event.data.type === 'callback') {
    //    this.callbacks.onceCallback.apply(this.callbacks, arr);
    //} else {
    //    this.emit.apply(this, [event.data.type].concat(arr));
    //}
    // subscribe and unsubscribe can supply a callback that has to be called when done
};

/**
 *
 * @param event
 * @private
 */
MqttSW.prototype._onError = function (event) {
    this.emit('error', event);
};

/**
 *
 * @param worker
 * @param type
 * @param callback
 * @private
 */
MqttSW.prototype._addEventListenerToWoker = function (worker, type, callback) {
    worker.addEventListener(type, callback, false);
};

/**
 *
 * @param type
 * @param args
 * @private
 */
MqttSW.prototype._postMessage = function (type, args) {
    if(this.useSharedWorker) {
        this.worker.port.postMessage({type: type, args: args});
    } else {
        this.worker.postMessage({type: type, args: args});
    }
};

/**
 *
 * @param topic
 * @param callback
 */
MqttSW.prototype.unsubscribe = function (topic, callback) {
    var args = {0: topic};

    if(callback && typeof callback === 'function') {
        args[1] = this.callbacks.addCallback(callback);
    }

    //if(this.useSharedWorker) {
    //    this.worker.port.postMessage({type: 'unsubscribe', args: args});
    //} else {
    //    this.worker.postMessage({type: 'unsubscribe', args: args});
    //}

    this._postMessage('unsubscribe', args);

};

/**
 * subscribe - subscribe to <topic>
 *
 * @param {String, Array, Object} topic - topic(s) to subscribe to, supports objects in the form {'topic': qos}
 * @param {Object} [opts] - optional subscription options, includes:
 *    {Number} qos - subscribe qos level
 * @param {Function} [callback] - function(err, granted){} where:
 *    {Error} err - subscription error (none at the moment!)
 *    {Array} granted - array of {topic: 't', qos: 0}
 * @returns {MqttSW} this - for chaining
 * @api public
 * @example client.subscribe('topic');
 * @example client.subscribe('topic', {qos: 1});
 * @example client.subscribe({'topic': 0, 'topic2': 1}, console.log);
 * @example client.subscribe('topic', console.log);
 */
MqttSW.prototype.subscribe = function (topic, opts, callback) {
    var args = {0: topic};

    if(opts && typeof opts === 'function') {
        args[1] = {qos: 0};
        args[2] = this.callbacks.addCallback(opts);
    }

    if(callback && typeof callback === 'function') {
        args[1] = opts;
        args[2] = this.callbacks.addCallback(callback);
    }

    //if(this.useSharedWorker) {
    //    this.worker.port.postMessage({type: 'subscribe', args: args});
    //} else {
    //    this.worker.postMessage({type: 'subscribe', args: args});
    //}
    this._postMessage('subscribe', args);
    return this;
};

/**
 * publish - publish <message> to <topic>
 *
 * @param {String} topic - topic to publish to
 * @param {String, Buffer} message - message to publish
 * @param {Object} [opts] - publish options, includes:
 *    {Number} qos - qos level to publish on
 *    {Boolean} retain - whether or not to retain the message
 * @param {Function} [callback] - function(err){}
 *    called when publish succeeds or fails
 * @returns {MqttSW} this - for chaining
 * @api public
 *
 * @example client.publish('topic', 'message');
 * @example
 *     client.publish('topic', 'message', {qos: 1, retain: true});
 * @example client.publish('topic', 'message', console.log);
 */
MqttSW.prototype.publish = function (topic, message, opts, callback) {
    var args = {0: topic, 1: message};

    if(opts && typeof opts === 'function') {
        args[2] = {};
        args[3] = this.callbacks.addCallback(opts);
    }

    if(callback && typeof callback === 'function') {
        args[2] = opts;
        args[3] = this.callbacks.addCallback(callback);
    }

    //if(this.useSharedWorker) {
    //    this.worker.port.postMessage({type: 'publish', args: args});
    //} else {
    //    this.worker.postMessage({type: 'publish', args: args});
    //}

    this._postMessage('publish', args);
    return this;
};

/**
 *
 * @returns {MqttSW}
 */
MqttSW.prototype.connect = function () {
    var args = [].splice.call(arguments, 0).concat([document.URL]);

    //if(this.useSharedWorker) {
    //    this.worker.port.postMessage({type: 'connect', args: args});
    //} else {
    //    this.worker.postMessage({type: 'connect', args: args});
    //}

    this._postMessage('connect', args);

    return this;
};

/**
 * end - close connection
 *
 * @param {Boolean} force - do not wait for all in-flight messages to be acked
 * @param {Function} callback - called when the client has been closed
 * @returns {MqttSW} this - for chaining
 *
 * @api public
 */
MqttSW.prototype.end = function (force, callback) {
    this.disconnecting = true;
    var args = {0: force};

    if(callback && typeof callback === 'function') {
        args[1] = this.callbacks.addCallback(callback);
    }

    this._postMessage('end', args);
    return this;
};


MqttSW.prototype.setMaxListeners = function (n) {
    var args = {0: n};

    this._postMessage('setMaxListeners', args);
    return this;
};


//noinspection JSUnresolvedVariable
module.exports = MqttSW;