/**
 * Created by Sandro Kock <sandro.kock@gmail.com> on 22.03.16.
 */
'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
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
};
