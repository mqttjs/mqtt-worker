/**
 * Created by Sandro Kock<sandro.kock@gmail.com> on 04.03.16.
 */


var MqttWorker = require('MqttWorker');

var mqtt = new MqttWorker("../mqttWorker.js", document.URL, true);

var client = mqtt.connect("ws://localhost:3005");

client.setMaxListeners(11);

client.publish('presence', 'Hello mqtt');
client.on('offline', function () {
    console.log("offline", arguments);
});
//
client.on('connect', function () {

    //client.subscribe('presence');
    //client.subscribe('presence', function(){
    //    console.log("client.subscribe", arguments);
    //});

    client.subscribe('presence', {qos: 1}, function(){
        console.log("client.subscribe", arguments);
    });
    //client.subscribe({'presence': 1}, function(){
    //    console.log("client.subscribe", arguments);
    //});

    /*client.subscribe('presence', {qos: 1}, function(){
        console.log("client.subscribe", arguments);
    });*/



    client.publish('presence', 'Hello mqtt', {qos: 0});
    client.publish('presence', 'Hello mqtt', {qos: 0}, function(err, packet){
        console.log("This should not run");
    });
    client.publish('presence', 'Hello mqtt', {qos: 1});
    client.publish('presence', 'Hello mqtt', {qos: 2});
    client.publish('presence', 'Hello mqtt', {qos: 1}, function(err, packet){
        console.log("callback", err, packet);
    });

    client.unsubscribe('presence');
    client.publish('presence', 'THIS MESSAGE SHOULD NOT BE received', {qos: 1});

    //client.publish('foo/bar', 'foo/bar');
});

client.on('message', function (topic, message) {
    // message is Buffer
    console.log("message", String.fromCharCode.apply(null, message));
    //client.end();
});

