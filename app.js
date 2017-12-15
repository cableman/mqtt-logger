
'use strict';

var config = require('./config.json');

var mqtt = require('mqtt')
var mqttClient  = mqtt.connect(config.host, {
	port: config.port,
	clean: false,
	clientId: config.clientId,
	username: config.username,
	password: config.password
});

mqttClient.on('connect', (connack) => {  
  if (connack.sessionPresent) {
    console.log('Already subbed, no subbing necessary');
  } else {
    console.log('First session! Subbing.');
    mqttClient.subscribe('#', { qos: 2 });
  }
});

mqttClient.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic + ": " + message.toString())
})

// Dis-connect.