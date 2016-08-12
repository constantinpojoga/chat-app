var mongoose = require('mongoose');

var connectionString = process.env.NODE_ENV === 'production' ? 'mongodb://admin:abc123@ds011755.mlab.com:11755/artgallery' : 'mongodb://localhost:27017/chat';

mongoose.connect(connectionString);

mongoose.connection.on('connected', function() {
  console.log('mongoose connected to ' + connectionString);
});

mongoose.connection.on('error', function(err) {
  console.log('mongoose connected error ' + err);
});

mongoose.connection.on('disconnected', function() {
  console.log('mongoose disconnected ') ;
});
