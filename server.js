var express = require('express');
var sjcl = require('sjcl');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(8000, function() {
  console.log('server listening on *:8000');
});

var names = {};
var invites = {};
var keyIds = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res,next) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/newchat', function(req, res,next) {
  room = Math.abs(sjcl.random.randomWords(1,7)[0]);
  res.redirect('/chat/'+room);
});

app.get('/chat/:room', function(req, res,next) {
  res.sendFile(__dirname + '/chat.html');
});

app.get('/chat/:room/id/:id/invite/:invite', function(req, res,next) {
  res.sendFile(__dirname + '/chat.html');
});

app.get('/full', function(req, res, next) {
  res.sendFile(__dirname + '/full.html');
})

// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {
  // updates the chat of everyone except the sender
  // socket.broadcast.to(socket.room).emit(foo);

  // updates chat of everyone
  // io.sockets.in(socket.room).emit(foo);

  // returns message to original sender
  // socket.emit(foo);

  socket.on('adduser', function(data){
      // duplicate username
      if(usernames[data.name] == data.name) {
        socket.emit('duplicateUsername');
        return;
      }
      socket.username = data.name;
      socket.room = data.id;
      if(io.sockets.adapter.rooms[data.id] == null) {
        firstUser(socket, data);
        return;
      } else {
        additionalUsers(socket, data);
        return;
      }
      return;
  });

  socket.on('sendchat', function (data) {
    io.sockets.in(socket.room).emit('updatemessages', socket.username, data);
  });

  socket.on('disconnect', function(){
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    socket.leave(socket.room);
  });

  socket.on('inviteSent', function(data){
    invites[socket.room].count = invites[socket.room].count + 1;
    invites[socket.room].keys.push(data);
  });

  socket.on('dhResponse', function(data){
    console.log(data);
    io.to(data.socket).emit('dhExtend', {
      dhKeys: data.dhKeys,
      dhPublic: data.dhPublic
    });
  });
});

function firstUser(socket, data){
    //add username to list and automatically open one invite
    usernames[data.name] = data.name;
    socket.join(data.id);
    invites[socket.room] = {'count': 0, 'keys': []};
    socket.emit('firstUser');
    socket.emit('updatechat', 'SERVER', 'you have connected to '+data.id);
    socket.broadcast.to(data.id).emit('updatechat', 'SERVER', data.name + ' has connected to this room');
}

function additionalUsers(socket, data){
    if(invites[data.id].count == 0) {
      var destination = '/full';
      socket.emit('noInvite', destination);
      return;
    }
    if(!arrayIncludes(invites[socket.room].keys, data.invite)) {
      var destination = '/full';
      socket.emit('noInvite', destination);
      return;
    }
    inviteIndex = indexOf(invites[socket.room].keys, data.invite);
    invites[socket.room].keys.splice(inviteIndex, 1);
    usernames[data.name] = data.name;
    socket.join(data.id);
    console.log(socket.id);
    invites[socket.room].count = invites[socket.room].count - 1;
    //socket is so the GDH.2 array can be sent to the requesting
    //user, ID allows the user's socket to be targeted
    socket.broadcast.to(data.id).emit('dhRequest', {
      socket: socket.id,
      id: data.id
    });
    socket.emit('updatechat', 'SERVER', 'you have connected to '+data.id);
    socket.broadcast.to(data.id).emit('updatechat', 'SERVER', data.name + ' has connected to this room');
}

function arrayIncludes(arr, val) {
  for(i = 0; i < arr.length; i++) {
    if(arr[i] == val){
      return true;
    }
  }
  return false;
}

function indexOf(arr, val) {
  for(i = 0; i < arr.length; i++) {
    if(arr[i] == val){
      return i;
    }
  }
  return -1;
}
