let theme = "defeault";
let mem = {player: {selection: null, result: null}, opponent: null}

document.addEventListener("DOMContentLoaded", initialize)

function initialize() {
  let socket = io();

  updateVisuals(theme);

  document.getElementById("rockbtn").addEventListener("click", function() {
    socket.emit('choose', "rock");
  });
  document.getElementById("paperbtn").addEventListener("click", function() {
    socket.emit('choose', "paper");
  });
  document.getElementById("scissorsbtn").addEventListener("click", function() {
    socket.emit('choose', "scissors");
  });
  document.getElementById('classicactivate').addEventListener("click", function() {
    theme = "defeault";
    updateVisuals(theme);
  });
  document.getElementById('horroractivate').addEventListener("click", function() {
    theme = "horror"
    updateVisuals(theme);
  })

  socket.on('result', (player, opponent, games) => {
    mem.player = player
    mem.opponent = opponent

    document.getElementById("winBad").innerHTML = player.points.wins;
    document.getElementById("drawBad").innerHTML = player.points.draws;
    document.getElementById("lossBad").innerHTML =  player.points.losses;

    document.getElementById("winBar").style = "width: "+(player.points.wins/games*100)+"%";
    document.getElementById("drawBar").style = "width: "+(player.points.draws/games*100)+"%";
    document.getElementById("lossBar").style = "width: "+(player.points.losses/games*100)+"%";

    updateVisuals(theme);
  });
}

function updateVisuals(theme) {
  document.getElementById("playerpicture").src = "img/"+theme+"/"+mem.player.selection+".png";
  document.getElementById("opponentpicture").src = "img/"+theme+"/"+mem.opponent+".png";
  document.getElementById("result").src = "img/"+theme+"/"+mem.player.result+".png";
  document.getElementById("vs").src = "img/"+theme+"/vs.png";
  document.getElementById("stylesheet").href = "css/"+theme+".css"

  if (mem.player.result != null) {
    document.getElementById("hideatstart").hidden = false;
  }
}
