var express = require('express');
var sjcl = require('sjcl');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

numChatters = 0;

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res,next) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  numChatters = numChatters + 1;
  console.log('a user connected, '+numChatters+' connected');
  socket.on('disconnect', function(){
    numChatters = numChatters - 1;
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log(msg);
    io.emit('chat message', msg);
  });
});

server.listen(8000, function() {
  console.log('server listening on *:8000');
});
