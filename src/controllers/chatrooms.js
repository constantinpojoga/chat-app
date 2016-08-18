// UserController
// ===============
// Controller for handling users
var express         = require('express'),
    ChatroomController = express.Router(),
    Chatroom            = require(__dirname + '/../models/chatroom');

// GET /chatrooms/public/
// --------------------
// Lists all public chatrooms
ChatroomController.route('/public')
.get(function(req, res, next) {
  Chatroom.find({public: true}, function(err, chatrooms) {
    if (err) {
      console.log(err)
    } else {
      res.json(chatrooms);
    }
  });
});


// GET /chatrooms/private/:user_id
// --------------------
// Lists all private chatrooms for :user_id
ChatroomController.route('/private/:username')
.get(function(req, res, next) {
  Chatroom.find({public: false}, function(err, chatrooms) {
    if (err) {
      console.log(err)
    } else {
      res.json(chatrooms.filter(function(chatroom) {
        return chatroom.users.indexOf(req.params.username) !== -1;
      }));
    }
  });
});



ChatroomController.route('/:id')
// GET /chatrooms/:id/
// --------------------
// Add new message to chat room
.get(function(req, res, next) {
    Chatroom.findById(req.params.id, function(err, chatroom) {
      if (err) console.log(err);
      res.json(chatroom);
    });
  })

  .post(function(req, res, next) {
    var msg = {
          author: req.body.author,
          message:  req.body.message,
          time:     new Date()
        }
    Chatroom.findOneAndUpdate(
      {_id: req.params.id},
      {$push: {messages: msg}},
      {safe: true, upsert: true},
      function(err, chatroom) {
        if (err) {
          console.log(err);
        } else {
          res.json(chatroom);
        };
      }
    );
  })

  /* PATCH/chatrooms/:id */
  .patch(function(req, res, next) {
      Chatroom.findByIdAndUpdate(req.params.id, {
          name:     req.body.name,
          public:   req.body.public,
          users:    req.body.users,
          messages: req.body.messages
        }, function (err, chatroom) {
        if (err) console.log(err);
        res.json(chatroom);
      });
  })
  /* DELETE/chatrooms/:id */
  .delete(function(req, res, next) {
    console.log(req.body);
    Chatroom.findByIdAndRemove(req.params.id, req.body, function (err, chatroom) {
      if (err) console.log(err);
      res.json(chatroom);
    });
  });

/* GET /chatrooms/? listing. */
ChatroomController.route('/?')
  .get(function(req, res, next) {
    Chatroom.find(function(err, chatrooms){
      if (err) {
        console.log(err)
        res.send('ERROR: ' + err);
      } else 
      res.json(chatrooms);
    });
  })
  /* POST /chatrooms/? */
  .post(function(req, res, next) {
    // Save user inside here
    Chatroom.create({
      name:  req.body.name,
      public: req.body.public,
      users:   req.body.users,
      messages: req.body.messages
    }, function(err, chatroom) {
      if (err) {
        console.log(err);
      } else {
        res.json(chatroom);
      }
    });
  });

module.exports = ChatroomController;
