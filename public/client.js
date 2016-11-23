var socket = io();

var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
name;

var key;

var dhBase;
var dhPrime;

$('#invite').click(function(){
  url = 'localhost:8000/chat/'+id;
  alert('send friend this url: '+url);
  socket.emit('invite sent');
});

socket.on('updatechat', function (username, data) {
  $('#messages').append('<b>'+username + ':</b> ' + data + '<br>');
});

socket.on('updatemessages', function (username, msg) {
  msg = sjcl.decrypt("password", msg);
  $('#messages').append('<b>'+username + ':</b> ' + msg + '<br>');
});

socket.on('connect', function(){
  name = prompt("What's your name?");
  socket.emit('adduser', {
      name: name,
      id: id
  });
});

socket.on('duplicateUsername', function(){
  name = prompt("That name is already in use, please choose a different one");
  socket.emit('adduser', {
      name: name,
      id: id
  });
});

socket.on('firstUser', function(){
  url = 'localhost:8000/chat/'+id;
  alert('Nobody is here yet, invite someone to chat with this url: '+url);
  socket.emit('invite sent');
});

socket.on('newUserAuth', function(){
  console.log('Authorzing');
});

// on load of page
$(function(){
  $('form').submit(function(){
    msg = $('#m').val();
    msg = sjcl.encrypt("password", $('#m').val());
    socket.emit('sendchat', msg);
    $('#m').val('');
    return false;
  });
});
