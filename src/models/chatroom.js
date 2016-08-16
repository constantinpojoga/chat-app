
// User Model
// ----------

var mongoose = require('mongoose');


var ChatroomSchema = new mongoose.Schema({
  author: Number,
  posts:  Array
}, {
  strict: false
});

module.exports = mongoose.model('Chatroom', ChatroomSchema);
