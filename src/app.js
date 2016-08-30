var express     = require('express'),
    app         = express(),
    http        = require('http'),
    server      = require('http').createServer(app),
    io          = require('socket.io').listen(server),
    exphbs      = require('express-handlebars'),
    bodyParser  = require('body-parser'),
    session     = require('express-session');

// Configuration
// -------------
app.engine('hbs', exphbs({
  defaultLayout: 'default',
  extname: '.hbs',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({extended: true}));

// Connect to database
// -------------------
require(__dirname + '/config/db');
// Middleware
// ----------
app.use(session({
  name:   "sessionclass",
  resave: false,
  saveUninitialized: false,
  secret: 'abdsahbgjyadbg23ebgsgh_3tg'
}));

app.use(express.static(__dirname + '/public')); // Serve static files
app.use('/users/?', require('./controllers/users'));
app.use('/chatrooms/?', require('./controllers/chatrooms'));
app.use('/?', require('./controllers/home'));



var numUsers    = 0; 
// Chatroom
// rooms which are currently available in chat
 


// Setting IO connections
io.on('connection', function(socket) {

  var chatrooms = [ {name: 'Lobby',
                   activeUsers: []
                  },
                  {name: 'JavaScript',
                   activeUsers: []
                  },
                  {name: 'Node',
                   activeUsers: []
                  },
                  {name: 'WDI5',
                   activeUsers: []
                  }
                ];;



  var addedUser = false;
  var currentRoom = 0;
  socket.join(chatrooms[currentRoom].name);
  console.log('Users connected to ' + chatrooms[currentRoom].name + ": "+ chatrooms[currentRoom].activeUsers);
  // console.log(chatrooms);

  // Changing room
  socket.on('change room', function(data) { 
    // delete the users from active users array
    chatrooms[currentRoom].activeUsers.splice(chatrooms[currentRoom].activeUsers.indexOf(socket.username), 1);
    // Emit for all in left channel that user left the room
    socket.to(chatrooms[currentRoom].name).broadcast.emit('user left', {
      username:    socket.username,
      activeUsers: chatrooms[currentRoom].activeUsers
    });
    console.log('user left: ' + chatrooms[currentRoom].activeUsers)
    socket.leave(chatrooms[currentRoom].name);
    currentRoom = data;
    // Update the active users array
    if (chatrooms[currentRoom].activeUsers.indexOf(socket.username) === -1) {
      chatrooms[currentRoom].activeUsers.push(socket.username);
    };
    
    socket.to(chatrooms[currentRoom].name).emit('user joined', {
      username:    socket.username,
      activeUsers: chatrooms[currentRoom].activeUsers
    });
    socket.join(chatrooms[currentRoom].name);
    // socket.emit something thet refr. usr
    console.log('user in new room: ' + chatrooms[currentRoom].activeUsers)
    console.log(chatrooms);
  });
  
  
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function(data) {
    console.log('new message: ' , data.message, data.type);
    var timeNow = new Date();
    // we tell the client to execute 'new message'
    socket.to(chatrooms[currentRoom].name).broadcast.emit('new message', {
      username: socket.username,
      message:  data.message,
      type:     data.type,
      time:     timeNow
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function(username) {
    console.log('add new user: ' + username)
    if (addedUser) return;
    // we store the username in the socket session for this client
    socket.username = username;
    chatrooms[currentRoom].activeUsers.push(socket.username);
    console.log('active users: ' + chatrooms[currentRoom].activeUsers);
    addedUser = true;
    socket.emit('login', {
      numUsers:    numUsers,
      activeUsers: chatrooms[currentRoom].activeUsers
    });
    // echo globally (all clients) that a person has connected
    console.log(socket.username + ' joined the room: ' + chatrooms[currentRoom].name);
    socket.to(chatrooms[currentRoom].name).broadcast.emit('user joined', {
      username:    socket.username,
      activeUsers: chatrooms[currentRoom].activeUsers
    });
    socket.emit('refresh users', {
      username:    socket.username,
      activeUsers: chatrooms[currentRoom].activeUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function() {
    // console.log(socket.username + ' is typing')
    socket.to(chatrooms[currentRoom].name).broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function() {
    console.log(socket.username + ' stopped typing')
    socket.to(chatrooms[currentRoom].name).broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function() {
      // console.log(chatrooms);
      chatrooms[currentRoom].activeUsers.splice(chatrooms[currentRoom].activeUsers.indexOf(socket.username), 1);
      console.log(socket.username + ' disconected, remain ' + numUsers +' users')
      console.log('remaining active users: ' + chatrooms[currentRoom].activeUsers);
      // echo globally that this client has left
      socket.to(chatrooms[currentRoom].name).broadcast.emit('user left', {
        username:    socket.username,
        activeUsers: chatrooms[currentRoom].activeUsers
      });
      socket.leave(chatrooms[currentRoom].name);
  });
}); 

// Start the server
// ----------------
server.listen(process.env.PORT || 3000, function() {
  console.log('App is running at http://localhost:' + server.address().port);
});
