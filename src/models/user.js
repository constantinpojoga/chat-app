
// User Model
// ----------

var mongoose = require('mongoose');


var UserSchema = new mongoose.Schema({
  chatname: String,
  username: String,
  password: String,
  img:      String,
  private:  Array
}, {
  strict: false
});

module.exports = mongoose.model('User', UserSchema);
