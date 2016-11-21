var socket = io();
var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
$('form').submit(function(){
  msg = sjcl.encrypt("password", $('#m').val());
  socket.emit('chat message', msg);
  $('#m').val('');
  return false;
});

$('#invite').click(function(){
  alert('send friend this url: localhost:8000/chat/123');
  socket.emit('invite sent');
});

socket.on('connect', function(){
  console.log('addUser');
  name = prompt('whats your name');
  socket.emit('addUser', {
        name: name,
        id: id
  });
  console.log('addUser2');
});

socket.on('chat message', function(msg){
  msg = sjcl.decrypt("password", msg);
  $('#messages').append($('<li>').text(msg));
});
