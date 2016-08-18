console.log('linked');

$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();
  var $onlineChatMembers = $('#online-chat-members');

  var socket = io();

  // var channels = ['Lobby', 'JavaScript', 'Node', 'WDI5'];
  setUsername();
  

  function addParticipantsMessage(data) {
    console.log(data.activeUsers)
    var message = '', activeUsersList = '';
    data.activeUsers.forEach(function(val) {
      activeUsersList += "<li>" + val + "</li>";
    })
    $onlineChatMembers.html(activeUsersList);
    log(message);
  }

  // Sets the client's username
  function setUsername() {
      socket.emit('add user', username);
  }

  // Sends a chat message
  function sendMessage() {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log(message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage(data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }
    
    var chatTime;
    if (data.time) {
       chatTime = data.time;
    } else {
      chatTime = new Date();
      // chatTime = ;
    }
    console.log(chatTime, typeof chatTime);
    var $usernameDiv = $('<span class="username" />')
      .text(data.username)
      .css('color', getUsernameColor(data.username)).append(' <span class="livestamp" data-livestamp="' + chatTime + '"></span>');;
    var $messageBodyDiv = $('<p class="messageBody">')
      .text(data.message)
   
    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping(data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping(data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement(el, options) {
    var $el = $(el);
    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }
    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput(input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping() {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages(data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor(username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }
  
  // Gets the channel messages for the active channel
  function getChannelMessages(channel_id) {
    $messages.html('');
    var msgs = chatrooms[channel_id].messages;
    msgs.forEach(function(msg, i) {
      var $usernameDiv = $('<span class="username" />')
          .text(msg.author)
          .css('color', getUsernameColor(msg.author)).append(' <span class="livestamp" data-livestamp="' + msg.time + '"></span>');;
      var $messageBodyDiv = $('<p class="messageBody">')
          .text(msg.message)
      var $messageDiv = $('<li class="message"/>')
        .data('username', msg.author)
        .append($usernameDiv, $messageBodyDiv);
      // Append the created DIV to the DOM
      addMessageElement($messageDiv);
    })
  }

  // Keyboard events
  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });
  

  // Click events
  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  }); 


  // Socket events
  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    console.log('login ' + data);
    // Display the welcome message
    var message = "Welcome to sChat";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('refresh users', function(data) {
    console.log('rereshing users: ' + data)
    addParticipantsMessage (data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    console.log(data)
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    console.log('user joined, data');
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    console.log('user joined, data');
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  // Listing all global channels 
  // on click, emit 'change room' and change css style only for selected <li>


  $.ajax({
    url: '/chatrooms/public',
    type : 'GET',
    success: function(channels) {
      console.log(channels);
      // console.log(typeof channels);
      chatrooms = channels;

      channels.forEach(function(channel, i) {
        $('#channelList').append('<li id="channel' + channel.name + '">' + channel.name + '</li>');  
        $('#channel' + channel.name).click(function() {
          $('#channelList li').css("font-weight", "normal");
          $(this).css("font-weight", "bold");
          socket.emit('change room', i);  
          getChannelMessages(i); 
          });
      });
      
      $('#channelList li').first().css("font-weight", "bold");
      getChannelMessages(0);
    },
    error: function(err) {
      console.log(err);
    }
  });
});

var chatrooms;
// Show login page before chat
// On "Login" click, switch to register
$('#homepage-login-btn').click(function(event) {
  event.preventDefault();
  console.log('login pressed')
  $('.login-page').css('display','block');
  $('.register-page').css('display','none');
});

// On "Register" click, switch to Login
$('#homepage-register-btn').click(function(event) {
  event.preventDefault();
  console.log('register pressed')
  $('.register-page').css('display','block');
  $('.login-page').css('display','none');
});

// add new Private Chat 
$('#newPrivateChat').click(function() {
  $('.addPrivateChat').show();
});

$('#addPrivateChatBtn').click(function(event) {
  event.preventDefault();
  // console.log('send btn pressed, hide form for newPrivateChat');
  $('.addPrivateChat').hide();
})

$('#closeAddPrivateChatBtb').click(function() {
  // Close form without submitting
  $('.addPrivateChat').hide();
})

  




