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