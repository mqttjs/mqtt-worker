/**
 * Created by Sandro Kock <sandro.kock@gmail.com> on 22.03.16.
 */
'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        uglify: {
            options: {
                sourceMap: true,
                mangleProperties: true,
                reserveDOMCache: true,
                sourceMapIncludeSources: true,
                nameCache: 'tmp/grunt-uglify-cache.json',
                mangle: {}
            },
            mqttWorker: {
                files: {
                    'dist/MqttWorker.min.js': ['dist/MqttWorker.js']
                }
            },
            mqttBundle: {
                files: {
                    'dist/MqttBundle.min.js': ['dist/MqttBundle.js']
                }
            }
        },

        watch: {
            dist: {
                files: 'lib/client.js',
                tasks: ['browserify:dist'],
                options: {
                    interrupt: true
                }
            }
        },
        browserify: {
            dist: {
                src: "./lib/client.js:MqttWorker",
                dest: "./dist/MqttWorker.js",
                options: {
                    alias: ['./lib/client.js:MqttWorker'],
                    watch: true
                }
            },
            mqtt: {
                src: "./node_modules/mqtt/mqtt.js",
                dest: "./dist/MqttBundle.js"
            },

            watch: {
                src: "./lib/client.js:MqttWorker",
                dest: "./dist/MqttWorker.js",
                options: {
                    alias: ['./lib/client.js:MqttWorker'],
                    watch: true,
                    keepAlive: true
                }
            }

        }
    });


    grunt.task.registerTask('default', ['browserify:dist', 'browserify:mqtt', 'uglify']);

};
