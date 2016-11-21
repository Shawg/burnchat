var express = require('express');
var sjcl = require('sjcl');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//the number of participants in the room
curr = 0;
//the total number of participants allowed
limit = 1

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res,next) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/newchat', function(req, res,next) {
  id = 123
  res.redirect('/chat/'+id);
});

app.get('/chat/:id', function(req, res,next) {
  res.sendFile(__dirname + '/chat.html');
});

app.get('/full', function(req, res, next) {
  res.sendFile(__dirname + '/full.html');
})

io.on('connection', function(socket){

  socket.on('addUser', function(data){
    console.log(data);
  });


  socket.on('disconnect', function(){
    curr = curr - 1;
    limit = limit - 1;
    if (limit == 0) {
      limit = 1;
    }
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log(msg);
    io.emit('chat message', msg);
  });

  socket.on('invite', function(){
    limit = limit+1;
  });
});

server.listen(8000, function() {
  console.log('server listening on *:8000');
});
