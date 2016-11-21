var socket = io();
$('form').submit(function(){
  msg = sjcl.encrypt("password", $('#m').val());
  socket.emit('chat message', msg);
  $('#m').val('');
  return false;
});

socket.on('chat message', function(msg){
  msg = sjcl.decrypt("password", msg);
  $('#messages').append($('<li>').text(msg));
});
