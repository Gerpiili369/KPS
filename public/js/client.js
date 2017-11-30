let theme = "defeault";
let mem = {player: {selection: null, result: null}, opponent: null};

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    let socket = io();

    updateVisuals(theme);

    document.getElementById("namebtn").addEventListener("click", () => {
        socket.emit('setName', document.getElementById("name").value);
    })
    document.getElementById("rockbtn").addEventListener("click", () => {
        socket.emit('choose', "rock");
    });
    document.getElementById("paperbtn").addEventListener("click", () => {
        socket.emit('choose', "paper");
    });
    document.getElementById("scissorsbtn").addEventListener("click", () => {
        socket.emit('choose', "scissors");
    });
    document.getElementById('classicactivate').addEventListener("click", () => {
        theme = "defeault";
        updateVisuals(theme);
    });
    document.getElementById('horroractivate').addEventListener("click", () => {
        theme = "horror";
        updateVisuals(theme);
    });
    document.getElementById('fuckrullaactivate').addEventListener("click", () => {
        theme = "fuckrulla";
        updateVisuals(theme);
    });

    socket.on('loginSucc', (data) => {
        document.getElementById("logindata").innerHTML = data;

        document.getElementById("login").hidden = true;
        document.getElementById("topbar").hidden = false;
        document.getElementById("resultarea").hidden = false;
    });

    socket.on('loginFail', (data) => {
        document.getElementById("logindata").innerHTML = data;
    });

    socket.on('msgFromServer', (data) => {
        document.getElementById("msg").innerHTML = data;
    })

    socket.on('result', (player, opponent) => {
        mem.player = player;
        mem.opponent = opponent;

        document.getElementById("winBad").innerHTML = player.total.wins;
        document.getElementById("drawBad").innerHTML = player.total.draws;
        document.getElementById("lossBad").innerHTML =  player.total.losses;

        document.getElementById("winBar").style = "width: "+(player.points.wins/player.games*100)+"%";
        document.getElementById("drawBar").style = "width: "+(player.points.draws/player.games*100)+"%";
        document.getElementById("lossBar").style = "width: "+(player.points.losses/player.games*100)+"%";

        updateVisuals(theme);
    });
}

function updateVisuals(theme) {
    document.getElementById("playerpicture").src = "img/"+theme+"/"+mem.player.selection+".png";
    document.getElementById("opponentpicture").src = "img/"+theme+"/"+mem.opponent+".png";
    document.getElementById("result").src = "img/"+theme+"/"+mem.player.result+".png";
    document.getElementById("vs").src = "img/"+theme+"/vs.png";
    document.getElementById("stylesheet").href = "css/"+theme+".css";

    if (mem.player.result != null) {
        document.getElementById("hideatstart").hidden = false;
    }
}
