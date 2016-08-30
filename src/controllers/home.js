// HomeController
// ==============
// Controller for the homepage.

var express         = require('express'),
    HomeController  = express.Router(),
    bcrypt          = require('bcrypt'),
    User            = require(__dirname + '/../models/user');
    Chatroom        = require(__dirname + '/../models/chatroom');
    // exphbs          = require('express-handlebars');

HomeController.route('/login')
  // POST /
  // ------
  // Log the user in
.post(function(req, res, next) {
  console.log('post req to /login')
  User.findOne({username: req.body.username}, function(error, user) {
    if (error || !user) {
       req.session.message = 'Could not find the user';
       res.redirect('/');
    } else {
      bcrypt.compare(req.body.password, user.password, function(err, result) {
        if (err) {
          res.send('ERROR: ' + err);
        } else if (result) {
          req.session.isLoggedIn = true;
          req.session.userId     = user._id;
          req.session.username   = req.body.username;
          // console.log("succesfull log in")
          req.session.pageTitle = 'Chat app';
          res.redirect('/');
        } else {
          req.session.message = 'Wrong username or password';
          res.redirect('/');

        }
      })
    }
  })
});

HomeController.route('/register')
.post(function(req, res, next) { 
  if (req.body.password !== re.body.passwordRepeat) {
    res.render('login', {pageTitle: "Log in to continue | Sign in", 
                           message: "Password fields doesn't match"});
  } else {
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        // Save user inside here
        User.create({
          username:  req.body.username,
          password:  hash
        }, function(err, user) {
          if (err) {
            console.log(err);
            res.render('register', {message: "Could not register " + err});
          } else {
            req.session.isLoggedIn  = true;
            req.session.userId      = user._id;
            req.session.username    = req.body.username;
            res.redirect('/');
          }
        });
      });
    }   
  });

HomeController.route('/logout')
 .get(function(req, res, next){
    req.session.isLoggedIn  = false;
    req.session.userId      = null;
    req.session.username    = null;
    res.redirect('/');
 });


HomeController.route('/?')
  // GET /
  .get(function(req, res, next) {
    if (req.session.isLoggedIn) {
      // console.log('you are logged in');
      res.render('home', {pageTitle: 'Chat app', username: req.session.username});
    } else {
      // console.log('you need to log in')
      res.render('login', {pageTitle: 'Log in to continue | Sign in', 
                           message:   req.session.message ? req.session.message : 'Enter username and password'
      });
    }
  });

module.exports = HomeController;
