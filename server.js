var express = require('express');
var sjcl = require('sjcl');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(8000, function() {
  console.log('server listening on *:8000');
});

var names = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res,next) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/newchat', function(req, res,next) {
  id = Math.abs(sjcl.random.randomWords(1,7)[0]);
  res.redirect('/chat/'+id);
});

app.get('/chat/:id', function(req, res,next) {
  res.sendFile(__dirname + '/chat.html');
});

app.get('/full', function(req, res, next) {
  res.sendFile(__dirname + '/full.html');
})

// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {

  socket.on('adduser', function(data){
    socket.username = data.name;
    socket.room = data.id;
    usernames[data.name] = data.name;
    socket.join(data.id);
    socket.emit('updatechat', 'SERVER', 'you have connected to '+data.id);
    socket.broadcast.to(data.id).emit('updatechat', 'SERVER', data.name + ' has connected to this room');
  });

  socket.on('sendchat', function (data) {
    io.sockets.in(socket.room).emit('updatemessages', socket.username, data);
  });

  socket.on('disconnect', function(){
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    socket.leave(socket.room);
  });
});
