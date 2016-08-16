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
app.use('/users/?', require('./controllers/posts'));
app.use('/?', require('./controllers/home'));


// Chatroom

var numUsers = 0, 
    activeUsers = [];

io.on('connection', function (socket) {
  console.log('connection')
  var addedUser = false;
  console.log('Users connected: ')

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    console.log('new message: ' + data)
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    console.log('add new user: ' + username)
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    activeUsers.push(socket.username);
    console.log('active users: ' + activeUsers);
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    console.log(socket.username + ' joined the room')
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    console.log(socket.username + ' is typing')
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    console.log(socket.username + ' stopped typing')
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      activeUsers.splice(activeUsers.indexOf(socket.username), 1);
      console.log(socket.username + ' disconected, remain ' + numUsers +' users')
      console.log('remaining active users: ' + activeUsers);
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});


// Start the server
// ----------------
server.listen(process.env.PORT || 3000, function() {
  console.log('App is running at http://localhost:' + server.address().port);
});
