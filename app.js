
'use strict';

var config = require('./config.json');

var debug = require('debug')('DataLogger');
var mqtt = require('mqtt')
var Influx = require('influx');

var db = [];

// Define influx databases.
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

  // Create database connection.
  db[sensor.topic] = new Influx.InfluxDB({
    host: config.influx.host,
    database: sensor.database,
    schema: schema
  });
}

// Connect to the MQTT server.
var mqttClient  = mqtt.connect(config.host, {
  port: config.port,
  clean: false,
  clientId: config.clientId,
  username: config.username,
  password: config.password
});

/**
 * On connection to MQTT.
 */
mqttClient.on('connect', function (connack) {
  if (connack.sessionPresent) {
    debug('Already subscribe, no subscribe necessary');
  }
  else {
    debug('First session! Subscribing...');

    mqttClient.subscribe('#', { qos: 2 });
  }
});

/**
 * On message received handler.
 */
mqttClient.on('message', function (topic, message) {
  var res = topic.split('/');
  var field = res.pop();
  var fields = {};
  fields[field] = parseFloat(message.toString())

  var data = [{
    measurement: 'sensor1',
    fields: fields
  }]

  debug(db);
  db[res.join('/')].writePoints(data);
})

