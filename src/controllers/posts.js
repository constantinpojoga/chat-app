// UserController
// ===============
// Controller for handling users
var express         = require('express'),
    PostController = express.Router(),
    bcrypt          = require('bcrypt'),
    Post            = require(__dirname + '/../models/user');


PostController.route('/:id')
.get(function(req, res, next) {
    User.findById(req.params.id, function (err, post) {
      if (err) console.log(err);
      res.json(post);
    });
  })

  /* PATCH/users/:id */
  .patch(function(req, res, next) {
    bcrypt.hash(req.body.password, 10, function(err, hash) {
      Post.findByIdAndUpdate(req.params.id, {
          author_id:  req.body.author_id,
          message:    req.body.message,
          img:        req.body.img,
          snippet:    req.body.snippet
        }, function (err, post) {
        if (err) console.log(err);
        res.json(post);
      });
    })
  })
  /* DELETE/users/:id */
  .delete(function(req, res, next) {
    console.log(req.body);
    Post.findByIdAndRemove(req.params.id, req.body, function (err, post) {
      if (err) console.log(err);
      res.json(post);
    });
  });

/* GET //users/? listing. */
PostController.route('/?')
  .get(function(req, res, next) {
    Post.find(function(err, posts){
      // console.log(users)
      console.log(err)
      if (err) {
        res.send('ERROR: ' + err);
      } else 
      res.json(posts);
    });
  })
  /* POST //users/? */
  .post(function(req, res, next) {
    // Save user inside here
    Post.create({
      author_id:  req.body.author_id,
      message:    req.body.message,
      img:        req.body.img,
      snippet:    req.body.snippet
    }, function(err, post) {
      if (err) {
        console.log(err);
      } else {
        res.json(post);
      }
    });
  });

module.exports = PostController;
