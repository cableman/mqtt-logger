
'use strict';

var config = require('./config.json');

var debug = require('debug')('DataLogger');
var mqtt = require('mqtt')

var Influx = require('influx');

// Define influx.
for (var i in config.sensors) {
  var sensor = config.sensors[i];

  var schema = [{
    measurement: sensor.measurement,
    fields: {},
    tags: ['esp', 'sensor']
  }];

  for (var j in sensor.fields) {
    schema[0].fields[sensor.fields[j]] = Influx.FieldType.FLOAT;
  }

  var db = new Influx.InfluxDB({
    host: config.influx.host,
    database: config.sensors[i].database,
    schema: schema
  });

  db.getDatabaseNames()
    .then(function (names) {
      if (!names.includes(config.sensors[i].database)) {
        return db.createDatabase(config.sensors[i].database);
      }
    })
    .then(function () {
      debug('READY');

      var mqttClient  = mqtt.connect(config.host, {
        port: config.port,
        clean: false,
        clientId: config.clientId,
        username: config.username,
        password: config.password
      });

      mqttClient.on('connect', function (connack) {  
        if (connack.sessionPresent) {
          debug('Already subbed, no subbing necessary');
        } 
        else {
          debug('First session! Subbing.');
          
          mqttClient.subscribe('#', { qos: 2 });
        }
      });

      mqttClient.on('message', function (topic, message) {
        // message is Buffer
        var res = topic.split('/');
        var field = res.pop();
        var fields = {};
        fields[field] = parseFloat(message.toString())

        var data = [{
          measurement: 'sensor1',
          fields: fields
        }]

        db.writePoints(data);
      })

    })
    .catch(function (err) {
      console.log(err);
      console.error(`Error creating Influx database!`);
    })
}



// Dis-connect.