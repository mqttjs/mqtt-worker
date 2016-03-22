'use strict';

importScripts('mqtt-elements-bundle.js');
//importScripts('lib/util.js');

// detect if we are a Worker or SharedWorker
var worker = typeof self.postMessage === 'function' || false;

var mqtt = require('mqtt');

//var util = require('./lib/util');
var util = {
    objectToArray: function (obj) {
        var arr = [];
        if(obj && typeof obj === 'object') {
            Object.keys(obj).forEach(function (key) {
                arr.push(obj[key]);
            });
        }
        return arr;
    }
};

// MQTT.js currently depend on document.URL to connect to a local MQTT-broker if no host-url is supplied
// the proper URL is supplied via client.connect as the last argument
var document = {};

var serviceWorker = {
    // map for the clients eg. portN => clientN
    clients: {},
    // a scope wrapping function to generate different postMessages to the worker client
    generateMessageCallback: function (port, type) {
        return function () {
            // type is something like 'publish', 'subscribe', 'message' or 'callback'
            port.postMessage({type: type, args: arguments});
        }
    },

    /**
     * Created a MQTT-client with mqtt.js
     * @param {Array} args the arguments array that is pased on to mqtt.connect
     * @param {Object} port the MessagePort the client is connected to
     * @returns {Object} MQTT-client instance
     */
    createClient: function (args, port) {
        var generateMessageCallback = this.generateMessageCallback;


        function addCallbacks(mqtt) {

            ['close', 'connect', 'error', 'message', 'offline', 'reconnect']
                .forEach(function (callbackName) {
                    mqtt.on(callbackName, generateMessageCallback(port, callbackName));
                });

            return mqtt;
        }

        return addCallbacks(mqtt.connect.apply(null, args));
        //.on('close', this.generateMessageCallback(port, 'close'))
        //.on('connect', this.generateMessageCallback(port, 'connect'))
        //.on('error', this.generateMessageCallback(port, 'error'))
        //.on('message', this.generateMessageCallback(port, 'message'))
        //.on('offline', this.generateMessageCallback(port, 'offline'))
        //.on('reconnect', this.generateMessageCallback(port, 'reconnect'));
    },


    /**
     * A callback method for the 'connect' event. Connect events are only fired when used with a
     * SharedServiceWorker.
     * @param {Object} event that triggered the connect
     */
    connect: function (event) {
        console.log('connect', arguments);

        var port = event.ports[0];
        // this opens the connection to the calling site, the spec states that it is not
        // nessesary to call port.start, as the port will be opened on the first message
        // anyway
        port.start();
        port.addEventListener('message', this.message.bind(this));
    },

    /**
     * Generated a callback function that sends a message with a specific ID, so that the receiver
     * can map the ID to the original callback
     * @param {String} id that works as an identifier
     * @param {Object} port on which the callback message is send to
     * @returns {Function} that wraps the call to a messagePost call
     */
    generateCallbackFunction: function (id, port) {
        return function () {
            port.postMessage({type: 'callback', args: [id].concat(util.objectToArray(arguments))});
        };
    },

    /**
     * A callback method for the 'message' event. A connect event is triggered every time when a
     * client calls MessagePort.portMessage .
     * @param {Object} event that triggered the message
     */
    message: function (event) {
        var arr = util.objectToArray(event.data.args);
        var port;

        if(worker) {
            port = self;
        } else {
            port = event.srcElement;
        }
        var callback;
        var client = this.clients[port];

        switch (event.data.type) {

            case 'connect':
                // the wrapping lib adds the document.URL as the last argument
                document.URL = arr.pop();
                try {
                    this.clients[port] = this.createClient.apply(this, [arr, port]);
                } catch (err){
                    console.log("err", err);
                }
                port.postMessage({type: 'options', args: this.clients[port].options});
                break;

            case 'publish':
                // the client lib always fills up the length to 4 if a callback function is given on a 'publish' call
                if(arr.length === 4) {
                    callback = this.generateCallbackFunction(arr.pop(), port);
                    arr.push(callback);
                }

                client[event.data.type].apply(client, arr);
                break;
            case 'subscribe':
                // the client lib always fills up the length to 3 if a callback function is given on a 'subscribe' call
                if(arr.length === 3) {

                    callback = this.generateCallbackFunction(arr.pop(), port);
                    arr.push(callback);
                }

                client[event.data.type].apply(client, arr);
                break;
            case 'setMaxListeners':
                client[event.data.type].apply(client, arr);
                break;
            case 'unsubscribe':
                client[event.data.type].apply(client, arr);
                break;
            default:
                port.postMessage({type: 'error', args: ['Method ' + event.data.type + 'not supported.']});
        }
    }
};



if(worker) {
    self.addEventListener('message', serviceWorker.message.bind(serviceWorker));
} else {
    self.addEventListener('connect', serviceWorker.connect.bind(serviceWorker));
}

