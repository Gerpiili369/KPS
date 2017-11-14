document.addEventListener("DOMContentLoaded", initialize)

function initialize() {
  let socket = io();
  let theme = "horror";

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
  });
  document.getElementById('horroractivate').addEventListener("click", function() {
    theme = "horror"
  })

  socket.on('result', (player, opponent, games) => {
    console.log("points: "+player.points+", your: "+player.selection+", opponents: "+opponent+", games"+games)
    document.getElementById("winBad").innerHTML = player.points.wins;
    document.getElementById("drawBad").innerHTML = player.points.draws;
    document.getElementById("lossBad").innerHTML =  player.points.losses;

    document.getElementById("winBar").style = "width: "+(player.points.wins/games*100)+"%";
    document.getElementById("drawBar").style = "width: "+(player.points.draws/games*100)+"%";
    document.getElementById("lossBar").style = "width: "+(player.points.losses/games*100)+"%";
    document.getElementById("playerpicture").src = "img/"+theme+"/"+player.selection+".png";
    document.getElementById("opponentpicture").src = "img/"+theme+"/"+opponent+".png";
    document.getElementById("result").src = "img/"+theme+"/"+player.result+".png";
    document.getElementById("vs").src = "img/"+theme+"/vs.png";

    document.getElementById("hideatstart1").hidden = false;
    document.getElementById("hideatstart2").hidden = false;
  });
}
