console.log('linked');

var chatrooms;
 

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
  var $messages      = $('.messages'); // Messages area
  var $inputMessage  = $('.inputMessage'); // Input message input box
  var $inputImg      = $('#addImgMessageUrl');
  var $inputSnippet  = $('#addSnippetMessageContent');
 

  var $loginPage     = $('.login.page'); // The login page
  var $chatPage      = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var connected      = false;
  var typing         = false;
  var lastTypingTime;
  var $currentInput  = $usernameInput.focus();
  var $onlineChatMembers = $('#online-chat-members');
 
  var socket = io();

  var activeChannel  = 0;
  var readyToType    = true;
  
  // var channels = ['Lobby', 'JavaScript', 'Node', 'WDI5'];
  if(username) {
    setUsername();
  }
  
  // Displays all online user for active channel
  // now disabled!!!
  function addParticipantsMessage(data) {
    console.log(data.activeUsers)
    var message = '', activeUsersList = '';
    // data.activeUsers.forEach(function(val) {
    //   activeUsersList += "<li>" + val + "</li>";
    // });
    $onlineChatMembers.html(activeUsersList);
    log(message);
  }

  // Sets the client's username
  function setUsername() {
      socket.emit('add user', username);
  }

  // Sends the chat message to socket and to addChatMessage(objToSend)
  function sendMessage(type) {
    var objToSend = {},
        message   = '';
    if (type === "img" || type ==="image") {
      message = $inputImg.val();
      $inputImg.val('');
    } else {
      if (type === "snippet") {
        message = $inputSnippet.val();  
        $inputSnippet.val('');
      } else {
          message = $inputMessage.val();
          // Prevent markup from being injected into the message
          message = cleanInput(message);
          $inputMessage.val('');
      }
    }

    objToSend  = {
              username: username,
              message:  message,
              type:     type || 'text',
            };
  
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      addChatMessage(objToSend);
      // Store the message to database, Ajax to /chatrooms/, type "POST"
      $.ajax({
        type: 'POST',
        url: '/chatrooms/' + chatrooms[activeChannel]._id,
        data: {
          author:  username,
          message: message,
          type:    type
        },
        success: function(data) {
          console.log('new message stored in DB')
        },
        error: function(err) {
          console.log('err')
        }
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', objToSend);
    }
  }

  // Log a message
  function log(message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Append the message, snippet or image to the chat
  function addChatMessage(data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var username = data.username || username;
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
      chatTimeISO = chatTime.toISOString();
    }
  
    var typingClass = data.typing ? 'typing' : '';

    var $usernameDiv = $('<span class="username" />')
        .text(username)
        .css('color', getUsernameColor(username)).append(' <span class="livestamp" data-livestamp="' + chatTimeISO + '"></span>');
    var $messageBodyDiv;

    if (data.type === 'img') {
      var timeId = new Date();
      imageId = 'img' + timeId.getTime().toString();

      $messageBodyDiv = '<li><img class="imageMessageBody" id="' + imageId + '" src="' + data.message + '"></li>'
      
       var $messageDiv = $('<li class="message"/>')
        .data('username', username)
        .append($usernameDiv, $messageBodyDiv);
      // Append the created DIV to the DOM
      addMessageElement($messageDiv);

      $('#' + imageId).click(function() {
        console.log('show img');
        $('.imagePreviewDiv div:first-child')
          .css('background-image', 'url(' + data.message + ')')
          .css('background-repeat', 'no-repeat')
          .css('background-size', 'auto content');
        $('.imagePreviewDiv').show();
      });

    } else if (data.type === 'snippet') {
      // Building snippet <div>
      var $messageBodyDiv = '<li><ol class="snippetMessageBody">';
      var snippet = data.message.split('\n').map(function(val) { 
        return val.replace(/\s/g, '&nbsp;')
                  .replace(/\</g, '&lt;')
                  .replace(/\>/g, '&gt;')
                  .replace(/\//g, '&bsol;')
                  .replace(/\n/g, '');
      });

      snippet.forEach(function(val) {
        $messageBodyDiv += '<li><span>' + val + '<span></li>';
      });
      $messageBodyDiv += '</ol></li></br>';

       var $messageDiv = $('<li class="message"/>')
        .data('username', username)
        .append($usernameDiv, $messageBodyDiv);
      // Append the created DIV to the DOM
    addMessageElement($messageDiv);
    } else {
      // Building message <li>
      $messageBodyDiv = $('<p class="messageBody">')
        .text(data.message);

       var $messageDiv = $('<li class="message"/>')
        .data('username', username)
        .addClass(typingClass)
        .append($usernameDiv, $messageBodyDiv);
      // Append the created DIV to the DOM
      addMessageElement($messageDiv);
    }
  }

  // Adds the visual chat "typing" message
  function addChatTyping(data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat "typing" message
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
    return $('.typing.message')
    .filter(function (i) {
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
          .css('color', getUsernameColor(msg.author)).append(' <span class="livestamp" data-livestamp="' + msg.time + '"></span>');
      var $messageBodyDiv;

      if (msg.type === 'img') {
        var timeId = new Date();
        imageId = 'img' + timeId.getTime().toString();

        $messageBodyDiv = '<li><img class="imageMessageBody" id="' + imageId + '" src="' + msg.message + '"></li>'
        
        var $messageDiv = $('<li class="message"/>')
          .data('username', msg.author)
          .append($usernameDiv, $messageBodyDiv);
        // Append the created DIV to the DOM
        addMessageElement($messageDiv);

        $('#' + imageId).click(function() {
          console.log('show img');
          $('.imagePreviewDiv div:first-child')
            .css('background-image', 'url(' + msg.message + ')')
            .css('background-repeat', 'no-repeat')
            .css('background-size', 'cover');
          $('.imagePreviewDiv').show();
        });

      } else if (msg.type === 'snippet') {

        // Building snippet <div>
        var $messageBodyDiv = '<li><ol class="snippetMessageBody">';
        var snippet = msg.message.split('\n').map(function(val) { 
          return val.replace(/\s/g, '&nbsp;')
                    .replace(/\</g, '&lt;')
                    .replace(/\>/g, '&gt;')
                    .replace(/\//g, '&bsol;')
                    .replace(/\n/g, '');
        });
        // console.log( snippet);
        snippet.forEach(function(val) {
          $messageBodyDiv += '<li><span>' + val + '<span></li>';
        });
        $messageBodyDiv += '</ol></li><br />';
        console.log($messageBodyDiv);

         var $messageDiv = $('<li class="message"/>')
          .data('username', msg.author)
          .append($usernameDiv, $messageBodyDiv);
        // Append the created DIV to the DOM
      addMessageElement($messageDiv);
      } else {
        // Building message <li>
        $messageBodyDiv = $('<p class="messageBody">')
          .text(msg.message);
         var $messageDiv = $('<li class="message"/>')
          .data('username', msg.author)
          .append($usernameDiv, $messageBodyDiv);
        // Append the created DIV to the DOM
        addMessageElement($messageDiv);
      }
    })
  }

  // Keyboard events
  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13 && readyToType) {
      if (username) {
        sendMessage("text");
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
    console.log('refeshing users: ' + data)
    addParticipantsMessage (data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    // console.log(data)
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    // console.log('user joined, data');
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    // console.log('user joined, data');
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    console.log(data.username, " is typing" );
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    console.log(data.username, " is typing" );
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
          activeChannel = i;
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
  
  // Listing all global channels 
  // on click, emit 'change room' and change css style only for selected <li>
  $.ajax({
    url: '/chatrooms/private' + username,
    type: 'GET',
    dataType: "json",
    success: function(data) {
      console.log("I found: " + data);
      // console.log(typeof channels);
      // chatrooms = channels;

      // channels.forEach(function(channel, i) {
      //   $('#channelList').append('<li id="channel' + channel.name + '">' + channel.name + '</li>');  
      //   $('#channel' + channel.name).click(function() {
      //     $('#channelList li').css("font-weight", "normal");
      //     $(this).css("font-weight", "bold");
      //     socket.emit('change room', i);  
      //     activeChannel = i;
      //     getChannelMessages(i); 
      //     });
      // });
      // $('#channelList li').first().css("font-weight", "bold");
      // getChannelMessages(0);
    },
    error: function(err) {
      console.log(err);
    }
  });

  
  var privateArr =  [
                      {
                        "_id": "57b616bbe75643273a37a8ff",
                        "name": "admin user",
                        "public": false,
                        "__v": 0,
                        "messages": [
                          {
                            "author": "admin",
                            "message": "Hi user, let's be friends",
                            "time": "Thu Aug 18 2016 15:12:43 GMT-0500 (CDT)"
                          }
                        ],
                        "users": [
                          "admin",
                          "user"
                        ]
                      }
                    ];

    privateArr.forEach(function(channel, i) {
      // chatrooms.push(channel);
        $('#privateChannelList').append('<li id="channel' + channel.name + '">' + channel.name.split(' ').filter(function(val) {  return val !== username }) + '</li>');  
        $('#channel' + channel.name).click(function() {
          $('#channelList li').css("font-weight", "normal");
          $(this).css("font-weight", "bold");
          socket.emit('change room', i + 4);  
          activeChannel = i + 4;
          getChannelMessages(i); 
          });
      });






  // ----------------------------------------------------------------
  // ------------------- setting for the static page ------------------------

  // Show login page before chat
  // On "Login link" click, switch to register
  $('#homepageLoginBtn').click(function(e) {
    e.preventDefault();
    $('.login-page').css('display','block');
    $('.register-page').css('display','none');
  });

  // On "Register link" click, switch to Login
  $('#homepageRegisterBtn').click(function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    console.log('register pressed')
    $('.register-page').css('display','block');
    $('.login-page').css('display','none');
  });

  // add new Private Chat 
  $('#newPrivateChat').click(function() {
    readyToType = false;
    $('.addPrivateChat').show();
  });

  $('#addPrivateChatBtn').click(function(event) {
    event.preventDefault();
    var $user = $('#addPrivateChatUser').val(),
        $message = $('#addPrivateChatMessage').val(),
        $time = new Date();
    var objToSend = {
      name: username + " " + $user,
      public: false,
      users: [username, $user],
      messages: [{
                  author: username,
                  message: $message,
                  time: $time
                }]
    };
    // console.log(objToSend);
    $.ajax({
      type: 'POST',
      url: "/chatrooms",
      dataType: "JSON",
      data: objToSend,
      success: function() {
        console.log('new private chatroom created')
      },
      error: function(err) {
        console.log('err')
      }
    });

    // some function here to refresh the list of private rooms
    // Send to other user msg to refresh chat list
   
    $('.addPrivateChat').hide();
    readyToType = true;
  })

  $('#closeAddPrivateChatBtn').click(function() {
    $('.addPrivateChat').hide();
  })

  // Add new image
  $('#addImgMessageShow').click(function() {
    readyToType = false;
    $('.addImgMessage').show();
  });

  $('#closeAddImgMessageBtn').click(function() {
    $('.addImgMessage').hide();
    readyToType = true;
  });

  $('#addImgMessageBtn').click(function() {
    console.log("IMG")
    sendMessage('img');
    $('.addImgMessage').hide();
    readyToType = true;
  });
  
  // Add new snippet
  $('#addSnippetMessageShow').click(function() {
    readyToType = false;
    $('.addSnippetMessage').show();
  });

  $('#closeAddSnippetMessageBtn').click(function() {
    $('.addSnippetMessage').hide();
    readyToType = true;
  });

  $('#addSnippetMessageBtn').click(function() {
    sendMessage('snippet');
    console.log('snippet');
    $('.addSnippetMessage').hide();
    readyToType = true;
  });


  // Close the Image Preview by pressing X button
  $('#closeImagePreview').click(function() {
    $('.imagePreviewDiv').hide();
  });

});



