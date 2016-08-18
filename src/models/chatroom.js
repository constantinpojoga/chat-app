// Chatroom Model
// ----------

var mongoose = require('mongoose');

var ChatroomSchema = new mongoose.Schema({
  name:     String,
  public:   Boolean,
  users:    Array,
  messages: Array
}, {
  strict: false
});

module.exports = mongoose.model('Chatroom', ChatroomSchema);
