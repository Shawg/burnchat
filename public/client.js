var socket = io();

var name, key, nonce;
var dhBase = bigInt("17");
var dhPrime = bigInt("179769313486231590772930519078902473361797697894230657273430081157732675805500963132708477322407536021120113879871393357658789768814416622492847430639474124377767893424865485276302219601246094119453082952085005768838150682342462881473913110540827237163350510684586298239947245938479716304835356329624262294183");
var dhKeys = [];
var dhSecret;
var dhSecretNew;
var keyIndex;
var inviteIds = [];
var modal = document.getElementById('myModal');
var span = document.getElementsByClassName("close")[0];

$('.invite').click(function(){
  inviteUser();
});

socket.on('firstUser', function(){
  dhSecret = bigInt(String(rand(20000))).pow(String(rand(100)));
  keyIndex = dhKeys.length;
  dhKeys.push(dhBase);
  key = dhBase.toString();
  inviteUser();
});

function inviteUser(){
  invite = rand(999);
  id = rand(999);
  inviteIds.push(id);
  room = getUrlParam("chat");
  url = location.origin+'/chat/'+room+'/id/'+id+'/invite/'+invite;
  document.getElementById("inviteURL").innerHTML = url;
  modal.style.display = "block";
  //alert('Nobody is here yet, invite someone to chat with this url: '+url);
  socket.emit('inviteSent', invite);
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

socket.on('connect', function(){
  name = prompt("What's your name?");
  // name = encodeHTML(name);
  if(getUrlParam('invite') == null){
    socket.emit('adduser', {
        name: name,
        chat: getUrlParam("chat")
    });
  } else {
    socket.emit("adduser", {
        name: name,
        id: getUrlParam("id"),
        chat: getUrlParam("chat"),
        invite: getUrlParam("invite")
    });
  }
});

socket.on('duplicateUsername', function(){
  name = prompt("That name is already in use, please choose a different one");
  // name = encodeHTML(name);
  socket.emit('adduser', {
      name: name,
      chat: getUrlParam("chat")
  });
});

socket.on('noInvite', function(destination){
  window.location.href = destination;
});

// The client who invited the user sends them the dhKey array
socket.on('dhRequest', function(data){
  if(inviteIds.indexOf(parseInt(data.id)) == -1){
    return;
  }
  dhSecretNew = bigInt(String(rand(20000))).pow(String(rand(100)));
  //adds temp secret value to all keys
  var i = dhKeys.length;
  var newKeys = [];
  while(i--) { newKeys[i] = dhKeys[i].modPow(dhSecretNew, dhPrime).toString(); }
  if(newKeys.length == 1){
    tmpKey = dhBase.modPow(dhSecret, dhPrime);
    socket.emit('dhResponse', {
      dhKeys: newKeys,
      dhPublic: tmpKey.modPow(dhSecretNew, dhPrime).toString(),
      socket: data.socket
    });
  } else {
    socket.emit('dhResponse', {
      dhKeys: newKeys,
      dhPublic: key.modPow(dhSecretNew, dhPrime).toString(),
      socket: data.socket
    });
  }
});

socket.on('dhBroadcast', function(data){
  console.log('getting new keys');
  console.log(data);
  for(i = 0; i < data.length; i++) {
    dhKeys[i] = bigInt(data[i]);
  }
  console.log('new keys');
  console.log(dhKeys);
  key = dhKeys[keyIndex].modPow( dhSecret, dhPrime);
});

// The newly added member adding their secret data to the key array
socket.on('dhExtend', function(data){
  dhSecret = bigInt(String(rand(20000))).pow(String(rand(100)));
  dhKeys = data.dhKeys.splice();
  var i = data.dhKeys.length;
  keyIndex = i;
  while(i--) {
    dhKeys[i] = bigInt(data.dhKeys[i]).modPow(dhSecret, dhPrime).toString();
  }
  //converts all key values to string for transport
  dhKeys[keyIndex] = bigInt(data.dhPublic).toString();
  console.log(dhKeys);
  socket.emit('dhBroadcast', {
    dhKeys: dhKeys
  });

  for(i = 0; i < dhKeys.length; i++) {
    dhKeys[i] = bigInt(dhKeys[i]);
  }
});

socket.on('updatechat', function (username, data) {
  message = $("<span></span></br>");
  username = encodeHTML(username);
  username = username+": ";
  data = encodeHTML(data);
  message.text(username).append(data);
  $('#messages').append(message);
  window.scrollTo(0,document.body.scrollHeight);
});

socket.on('updatemessages', function (username, msg) {
  console.log('printing messge');
  console.log(key.toString());
  msg = sjcl.decrypt(key.toString(), msg);
  msg = encodeHTML(msg);
  message = $("<span></span></br>");
  // username = encodeHTML(username);
  username = username+": ";
  message.text(username).append(msg);
  $('#messages').append(message);
  window.scrollTo(0,document.body.scrollHeight);
});

// on load of page
$(function(){
  $('form').submit(function(){
    msg = $('#m').val();
    msg = encodeHTML(msg);
    msg = sjcl.encrypt(String(key), msg);

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

function encodeHTML(s) {
  return s
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
  // .replace(/&/g, '&amp;');
}
