/**
 * Created by Sandro Kock<sandro.kock@gmail.com> on 04.03.16.
 */


var MqttWorker = require('MqttWorker');

var mqtt = new MqttWorker('../mqttWorker.js', document.URL, true);
var client = mqtt.connect('ws://localhost:3005');

client.setMaxListeners(11);

client.on('connect', function (packet) {
    console.log('MQTT.js is connected', packet);
});

client.subscribe('presence');
client.publish('presence', 'Hello mqtt!');

client.on('message', function (topic, message, packet) {
    // message is Buffer casting to String
    console.log(String.fromCharCode.apply(null, message), packet);
    client.end();
});

client.on('close', function () {
    console.log('close');
});


