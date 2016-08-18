// UserController
// ===============
// Controller for handling users
var express         = require('express'),
    UserController = express.Router(),
    bcrypt          = require('bcrypt'),
    User            = require(__dirname + '/../models/user');


UserController.route('/:id')
.get(function(req, res, next) {
    User.findById(req.params.id, function (err, user) {
      if (err) console.log(err);
      res.json(user);
    });
  })

  /* PATCH/users/:id */
  .patch(function(req, res, next) {
    bcrypt.hash(req.body.password, 10, function(err, hash) {
      User.findByIdAndUpdate(req.params.id, {
          username:  req.body.username,
          password:  hash
        }, function (err, user) {
        if (err) console.log(err);
        res.json(user);
      });
    })
  })
  /* DELETE/users/:id */
  .delete(function(req, res, next) {
    console.log(req.body);
    User.findByIdAndRemove(req.params.id, req.body, function (err, user) {
      if (err) console.log(err);
      res.json(user);
    });
  });

/* GET //users/? listing. */
UserController.route('/?')
   .get(function(req, res, next) {
    User.find(function(err, users){
      if (err) {
        console.log(err)
        res.send('ERROR: ' + err);
      } else 
      res.json(users)
    });
  })
  /* POST //users/? */
  .post(function(req, res, next) {
      bcrypt.hash(req.body.password, 10, function(err, hash) {
        // Save user inside here
        User.create({
          username:  req.body.username,
          password:  hash
        }, function(err, user) {
          if (err) {
            console.log(err);
            
          } else {
            req.session.isLoggedIn  = true;
            req.session.userId      = user._id;
            res.json(user)
          }
        });
      });
  });



module.exports = UserController;
