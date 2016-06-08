![Travis Build](https://travis-ci.org/mqttjs/mqtt-worker.svg?branch=master)

# mqtt-worker
This project wraps mqtt.js to run a bundled (browserify) version for the browser within a [Web Worker](https://www.w3.org/TR/workers/). Currently 
this project is still prototypical and needs some work, feel free to help.
 
## Usage

```
bower install --save mqttjs/mqtt-worker
```

```html
<script src="bower_components/mqtt-wrapper/dist/MqttWorker.js"></script>

<script>
var MqttWorker = require('MqttWorker');
var mqtt = new MqttWorker("../mqttWorker.js", document.URL, true);
// use the same API on mqtt available from https://github.com/mqttjs/MQTT.js  
var client = mqtt.connect("ws://localhost:3005");

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
</script>
```

## Debug / Inspect 
In Chrome Web Workers can be debuged at [chrome://inspect/#workers](chrome://inspect/#workers).  

## Build 
```
npm install
```

```
grunt 
```

or

```
browserify -r ./lib/client.js:MqttWorker > dist/MqttWorker.js
browserify -r mqtt > dist/MqttBundle.js
```

<a name="contributing"></a>
## Contributing

mqtt-worker is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [CONTRIBUTING.md](CONTRIBUTING.md) file for more details.

### Contributors

mqtt-worker is only possible due to the excellent work of the following contributors:

<table><tbody>
<tr><th align="left">Sandro Kock</th><td><a href="https://github.com/sandro-k">GitHub/sandro-k</a></td><td><a href="https://twitter.com/_syn_k">Twitter/@_syn_k</a></td></tr>

</tbody></table>

<a name="license"></a>
## License

[MIT](LICENSE.md)