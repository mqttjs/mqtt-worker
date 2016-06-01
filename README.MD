# mqttWorker
This project is wraps for mqtt.js to run a bundled (browserify) version for the browser within a Web-Worker 

# Build 

browserify -r ./lib/client.js:MqttWorker > dist/MqttWorker.js 


<a name="contributing"></a>
## Contributing

mqttWorker is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [CONTRIBUTING.md](CONTRIBUTING.md) file for more details.

### Contributors

mqttWorker is only possible due to the excellent work of the following contributors:

<table><tbody>
<tr><th align="left">Sandro Kock</th><td><a href="https://github.com/sandro-k">GitHub/sandro-k</a></td><td><a href="https://twitter.com/_syn_k">Twitter/@_syn_k</a></td></tr>

</tbody></table>

<a name="license"></a>
## License

[MIT](LICENSE.md)