/**
 * Created by sko on 16.03.16.
 */
//var expect = chai.expect;
//var should = chai.should;

describe("MqttWorker", function () {
    var port = 3005;
    var host = 'localhost';
    var scheme = 'ws';
    var url = scheme + '://' + host + ':' + port;

    var mqttsw, mqtt;

    beforeEach(function () {
        console.log("beforeEach", arguments);
        mqttsw = require('MqttWorker');
        mqtt = new mqttsw("../mqttWorker.js", document.URL, true);
    });


    describe("client", function () {
        it(".VERSION should be defined ", function () {
            mqtt.should.have.property('VERSION', '0.0.1');
        });
    });

    describe('#connect', function () {
        var sslOpts, sslOpts2;

        sslOpts2 = {
            keyPath: '../node_modules/mqtt/test/helpers/private-key.pem',
            key: '../node_modules/mqtt/test/helpers/private-key.pem',
            certPath: '../node_modules/mqtt/test/helpers/private-csr.pem',
            cert: '../node_modules/mqtt/test/helpers/public-csr.pem',
            caPaths: ['../node_modules/mqtt/test/helpers/public-csr.pem']
        };

        it('should throw an error when it is called with cert and key set and protocol other than allowed: mqtt,mqtts,ws,wss', function () {
            (function () {
                sslOpts2.protocol = 'UNKNOWNPROTOCOL';
                var c = mqtt.connect(sslOpts2);
                c.end();
            }).should.throw();
        });

        it('BBBB should return a MqttClient with wss set when connect is called key and cert set and protocol ws', function (done) {
            sslOpts2.protocol = 'ws';
            var c = mqtt.connect(sslOpts2)
                .on('options', function () {
                    c.should.be.instanceOf(mqttsw);
                    c.options.should.have.property('protocol', 'wss');
                    done();
                }).on('error', function () {

                });

        });


        it('should return an MqttClient when connect is called with ws:// url', function () {
            var c = mqtt.connect(url);
            c.should.be.instanceOf(mqttsw);
            c.end();

        });

        it('should return an MqttClient with username option set', function (done) {
            var c = mqtt.connect('ws://user@localhost:3005')
                .on('options', function () {
                    c.should.be.instanceOf(mqttsw);
                    c.options.should.have.property('username', 'user');
                    c.end();
                    done();
                });
        });

        it('should return an MqttClient with username and password options set', function (done) {
            var c = mqtt.connect('ws://user:pass@localhost:3005')
                .on('options', function () {
                    c.should.be.instanceOf(mqttsw);
                    c.options.should.have.property('username', 'user');
                    c.options.should.have.property('password', 'pass');
                    c.end();
                    done()
                })
        });


        it('should return an MqttClient with the clientid option set', function (done) {
            var c = mqtt.connect('ws://user@localhost:3005?clientId=123');

            c.on('options', function () {
                c.should.be.instanceOf(mqttsw);
                c.options.should.have.property('clientId', '123');
                c.end();
                done()
            })
        });

        //it('should return an MqttClient when connect is called with tcp:/ url', function () {
        //    var c = mqtt.connect('tcp://localhost');
        //
        //    c.should.be.instanceOf(mqttsw);
        //});

        it('should return an MqttClient with correct host when called with a host and port', function (done) {
            var c = mqtt.connect('ws://user:pass@localhost:3005');

            c.on('options', function () {
                c.options.should.have.property('hostname', 'localhost');
                c.options.should.have.property('port', '3005');
                c.end();
                done();
            });
        });


        //it('should return an MqttClient when connect is called with mqtts:/ url', function () {
        //    var c = mqtt.connect('mqtts://localhost', sslOpts);
        //
        //    c.options.should.have.property('protocol', 'mqtts');
        //
        //    c.on('error', function () {});
        //
        //    c.should.be.instanceOf(mqttsw);
        //});


        it('should return an MqttClient when connect is called with wss:/ url', function (done) {
            //var c = mqtt.connect('wss://localhost', sslOpts);
            var c = mqtt.connect('wss://localhost');

            c.on('options', function () {
                c.options.should.have.property('protocol', 'wss');

                c.on('error', function () {
                });

                c.should.be.instanceOf(mqttsw);
                c.end();

                done();
            });

        });


        it('should return an MqttClient when connect is called with ws:/ url', function (done) {
            //var c = mqtt.connect('ws://localhost', sslOpts);
            var c = mqtt.connect('ws://localhost');


            c.on('options', function () {
                c.options.should.have.property('protocol', 'ws');

                c.on('error', function () {
                });

                c.should.be.instanceOf(mqttsw);
                c.end();
                done();
            });
        });


        it('should return a MqttClient with wss set when connect is called key and cert set and protocol wss', function () {
            sslOpts2.protocol = 'wss';
            var c = mqtt.connect(sslOpts2);

            c.options.should.have.property('protocol', 'wss');

            c.on('error', function () {
            });

            c.should.be.instanceOf(mqttsw);
        });
    });


});