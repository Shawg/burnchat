var socket = io();

var name, key, nonce;
var dhBase = 5;
var dhPrime = 23;
var dhKeys = [];
var dhSecret;
var dhSecretNew;
var inviteIds = [];

$('#invite').click(function(){
  inviteUser();
});

socket.on('firstUser', function(){
  dhSecret = rand(25);
  dhKeys.push(fastModularExponentiation(dhBase,1,dhPrime));
  inviteUser();
});

function inviteUser(){
  invite = rand(25);
  id = rand(25);
  inviteIds.push(id);
  room = getUrlParam("chat");
  url = location.origin+'/chat/'+room+'/id/'+id+'/invite/'+invite;
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

socket.on('dhRequest', function(data){
  console.log('diffe request');
  dhSecretNew = rand(25);
  socket.emit('dhResponse', {
    dhKeys: dhKeys,
    dhPublic: fastModularExponentiation(dhBase, dhSecretNew, dhPrime),
    socket: data.socket
  });
});

socket.on('dhExtend', function(data){
  dhSecret = rand(25);
  dhKeys = data.dhKeys.splice();
  var i = data.dhKeys.length;
  while(i--) { dhKeys[i] = fastModularExponentiation(data.dhKeys[i], dhSecret, dhPrime); }
  dhKeys[data.dhKeys.length] = data.dhPublic;
  console.log(dhKeys);
  console.log(data.dhKeys);
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

/**
 * Fast modular exponentiation for a ^ b mod n
 * @returns {number}
 */
var fastModularExponentiation = function(a, b, n) {
  a = a % n;
  var result = 1;
  var x = a;

  while(b > 0){
    var leastSignificantBit = b % 2;
    b = Math.floor(b / 2);

    if (leastSignificantBit == 1) {
      result = result * x;
      result = result % n;
    }

    x = x * x;
    x = x % n;
  }
  return result;
};

