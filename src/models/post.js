
// Post Model
// ----------

var mongoose = require('mongoose');


var PostSchema = new mongoose.Schema({
  author_id: Number,
  message:   String,
  date:      Date,
  img:       String,
  snippet:   String
}, {
  strict: false
});

module.exports = mongoose.model('Post', UserSchema);
