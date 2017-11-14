document.addEventListener("DOMContentLoaded", initialize)

function initialize() {
let socket = io();

document.getElementById("rockbtn").addEventListener("click", function() {
  socket.emit('choose', "rock")
});
document.getElementById("paperbtn").addEventListener("click", function() {
  socket.emit('choose', "paper");
});
document.getElementById("scissorsbtn").addEventListener("click", function() {
  socket.emit('choose', "scissors")
});

socket.on('result', (points, player, opponent, games) => {
  document.getElementById("winBad").innerHTML = points.p1;
  document.getElementById("drawBad").innerHTML = points.draw;
  document.getElementById("lossBad").innerHTML =  points.p2;

  document.getElementById("winBar").style="width: "+(points.p1/games*100)+"%";
  document.getElementById("drawBar").style="width: "+(points.draws/games*100)+"%";
  document.getElementById("lossBar").style="width: "+(points.p2/games*100)+"%";

  document.getElementById("playerpicture").class = player;
  document.getElementById("opponentpicture").class = opponent;
  document.getElementById("result").class = result;

  document.getElementById("hideatstart1").hidden = false;
  document.getElementById("hideatstart2").hidden = false;
});
}
