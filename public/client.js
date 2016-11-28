var socket = io();

var name, key, nonce;
var dhBase = 5;
var dhPrime = 23;

$('#invite').click(function(){
  inviteUser();
});

socket.on('firstUser', function(){
  inviteUser();
});

function inviteUser(){
  invite = rand(25);
  id = getUrlParam("chat");
  url = 'localhost:8000/chat/'+id+'/invite/'+invite;
  alert('Nobody is here yet, invite someone to chat with this url: '+url);
  socket.emit('inviteSent', invite);
}

socket.on('updatechat', function (username, data) {
  $('#messages').append('<b>'+username + ':</b> ' + data + '<br>');
});

socket.on('updatemessages', function (username, msg) {
  msg = sjcl.decrypt("password", msg);
  $('#messages').append('<b>'+username + ':</b> ' + msg + '<br>');
});

socket.on('connect', function(){
  name = prompt("What's your name?");
  if(getUrlParam('invite') == null){
    socket.emit('adduser', {
        name: name,
        id: getUrlParam("chat")
    });
  } else {
    socket.emit("adduser", {
        name: name,
        id: getUrlParam("chat"),
        invite: getUrlParam("invite")
    });
  }
});

socket.on('duplicateUsername', function(){
  name = prompt("That name is already in use, please choose a different one");
  socket.emit('adduser', {
      name: name,
      id: getUrlParam("chat")
  });
});

socket.on('noInvite', function(destination){
  window.location.href = destination;
});


socket.on('newUserAuth1', function(){
  console.log('Authorzing');
  nonce = Math.abs(sjcl.random.randomWords(1,7)[0]);
  AuthReq1 = {
    "name": name,
    "nonce": nonce
  }
  socket.emit('AuthReq1', AuthReq1);
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

function rand(x){
  return Math.floor((Math.random() * x) + 1);
}

function getUrlParam(val){
  vars = window.location.pathname.split('/');
  index = vars.indexOf(val);
  return vars[index + 1];
}
