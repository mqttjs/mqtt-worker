/**
 * Created by Sandro Kock <sandro.kock@gmail.com> on 08.03.16.
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
        Object.keys(obj).forEach(function (key) { arr.push(obj[key]) });
    }
    return arr;
};

/**
 * Creates a new instance of MqttWorker object, that wraps all calls to the MqttClient to a Worker or SharedWorker
 * @param {String} workerUri the Uri where the worker script is located, probably something like "bower_component/mqttsw/mqttsw.js"
 * @param {String} documentUrl
 * @param {Boolean} useSharedWorker flag whether or not to use a SharedWorker===false or Worker===true
 * @returns {MqttWorker} A wrapper object around the MqttClient object that maps all calls to the Worker
 * @constructor
 */
function MqttWorker(workerUri, documentUrl, useSharedWorker) {

    if(!(this instanceof MqttWorker)) {
        return new MqttWorker(workerUri, documentUrl, useSharedWorker);
    }

    this.workerUri = workerUri;
    this.worker = {};
    this.options = {};
    this.connected = false;
    this.disconnecting = false;

    this.connected = false;
    this.useSharedWorker = useSharedWorker || false;

    this.callbacks = new Callback();

    this._startWorker();
    events.EventEmitter.call(this);
}

inherits(MqttWorker, events.EventEmitter);

MqttWorker.prototype.VERSION = "0.0.1";

/**
 * Starts the Web Worker and sets up EventListeners
 * @private
 */
MqttWorker.prototype._startWorker = function () {
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
    this._addEventListenerToWorker(port, 'message', this._onMessage.bind(this));
};

/**
 * Callback method that handles all messages send from the Web Wroker
 * @param event
 * @private
 */
MqttWorker.prototype._onMessage = function (event) {
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
            this.options = event.data.args;
            // this is an extra api that exdends mqtt.js
            // we now could listen on client.on('options', callback)
            this.emit.apply(this, [event.data.type].concat(arr));
            break;
        default:
            this.emit.apply(this, [event.data.type].concat(arr));
    }
    
    // subscribe and unsubscribe can supply a callback that has to be called when done
};

/**
 * Callback that is bind to the onError method of the Web Worker
 * @param event
 * @private
 */
MqttWorker.prototype._onError = function (event) {
    this.emit('error', event);
};

/**
 * @param worker
 * @param type
 * @param callback
 * @private
 */
MqttWorker.prototype._addEventListenerToWorker = function (worker, type, callback) {
    worker.addEventListener(type, callback, false);
};

/**
 * @param type
 * @param args
 * @private
 */
MqttWorker.prototype._postMessage = function (type, args) {
    if(this.useSharedWorker) {
        this.worker.port.postMessage({type: type, args: args});
    } else {
        this.worker.postMessage({type: type, args: args});
    }
};


/**
 * unsubscribe - unsubscribe from topic(s)
 *
 * @param {String, Array} topic - topics to unsubscribe from
 * @param {Function} [callback] - callback fired on unsuback
 * @returns {MqttWorker} this - for chaining
 * @api public
 * @example client.unsubscribe('topic');
 * @example client.unsubscribe('topic', console.log);
 */
MqttWorker.prototype.unsubscribe = function (topic, callback) {
    var args = {0: topic};

    if(callback && typeof callback === 'function') {
        args[1] = this.callbacks.addCallback(callback);
    }

    this._postMessage('unsubscribe', args);
    return this;
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
 * @returns {MqttWorker} this - for chaining
 * @api public
 * @example client.subscribe('topic');
 * @example client.subscribe('topic', {qos: 1});
 * @example client.subscribe({'topic': 0, 'topic2': 1}, console.log);
 * @example client.subscribe('topic', console.log);
 */
MqttWorker.prototype.subscribe = function (topic, opts, callback) {
    var args = {0: topic};

    if(opts && typeof opts === 'function') {
        args[1] = {qos: 0};
        args[2] = this.callbacks.addCallback(opts);
    }

    if(callback && typeof callback === 'function') {
        args[1] = opts;
        args[2] = this.callbacks.addCallback(callback);
    }

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
 * @returns {MqttWorker} this - for chaining
 * @api public
 *
 * @example client.publish('topic', 'message');
 * @example
 *     client.publish('topic', 'message', {qos: 1, retain: true});
 * @example client.publish('topic', 'message', console.log);
 */
MqttWorker.prototype.publish = function (topic, message, opts, callback) {
    var args = {0: topic, 1: message};

    if(opts && typeof opts === 'function') {
        args[2] = {};
        args[3] = this.callbacks.addCallback(opts);
    }

    if(callback && typeof callback === 'function') {
        args[2] = opts;
        args[3] = this.callbacks.addCallback(callback);
    }

    this._postMessage('publish', args);
    return this;
};

/**
 ** connect - connect to an MQTT broker.
 *
 * @param {String} [brokerUrl] - url of the broker, optional
 * @param {Object} opts - see MqttClient#constructor
 * @returns {MqttWorker}
 */
MqttWorker.prototype.connect = function (brokerUrl, opts) {
    // TODO sandro-k check if arguments.push(document.url) would be sufficient or is a copy needed send the arguemtns to
    // the Web Worker
    var args = [].splice.call(arguments, 0).concat([document.URL]);
    console.log("connect", args, [brokerUrl, opts, document.URL]);

    this._postMessage('connect', args);

    return this;
};

/**
 * end - close connection
 *
 * @param {Boolean} force - do not wait for all in-flight messages to be acked
 * @param {Function} callback - called when the client has been closed
 * @returns {MqttWorker} this - for chaining
 *
 * @api public
 */
MqttWorker.prototype.end = function (force, callback) {
    this.disconnecting = true;
    var args = {0: force};

    if(callback && typeof callback === 'function') {
        args[1] = this.callbacks.addCallback(callback);
    }

    this._postMessage('end', args);
    // todo sandro-k call terminate on the Web Worker after end
    return this;
};

/**
 * By default EventEmitters will print a warning if more than 10 listeners
 * are added to it. This is a useful default which helps finding memory leaks.
 * Obviously not all Emitters should be limited to 10. This function allows
 * that to be increased. Set to zero for unlimited.
 * @param n the maximum EventListeners that can be registered before a waring will be printed
 * @returns {MqttWorker} for chaining calls
 */
MqttWorker.prototype.setMaxListeners = function (n) {
    var args = {0: n};

    this._postMessage('setMaxListeners', args);
    return this;
};


//noinspection JSUnresolvedVariable
module.exports = MqttWorker;