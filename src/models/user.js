
// User Model
// ----------

var mongoose = require('mongoose');


var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
}, {
  strict: false
});

module.exports = mongoose.model('User', UserSchema);
