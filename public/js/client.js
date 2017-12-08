document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    let theme = "defeault";
    let mem = {player: {selection: null, result: null}, opponent: null};
    let socket = io();

    updateVisuals(theme);
    addSomeListeners(socket);

    socket.on('loginSucc', (data) => {
        htmlEdit("logindata",data);

        updateVisibility(["mainmenu","topbar"],["login"])
    });

    socket.on('loginFail', (data) => {
        htmlEdit("logindata",data);
    });

    socket.on('startGame', () => {
        updateVisibility(["choosebar","resultarea"],["mainmenu"]);
    });

    socket.on('toMainMenu', () => {
        updateVisibility(["mainmenu"],["topbar","resultarea"]);
    });

    socket.on('msgFromServer', (data) => {
        htmlEdit("msg",data);
    });

    socket.on('result', (player, opponent) => {
        mem.player = player;
        mem.opponent = opponent;

        updateTotal(player.total);

        document.getElementById("winBar").style = "width: "+(player.points.wins/player.games*100)+"%";
        document.getElementById("drawBar").style = "width: "+(player.points.draws/player.games*100)+"%";
        document.getElementById("lossBar").style = "width: "+(player.points.losses/player.games*100)+"%";

        updateVisuals(theme);
    });

    function addSomeListeners(socket) {
        document.getElementById("namebtn").addEventListener("click", () => {
            socket.emit('setName',document.getElementById("name").value);
        });

        addClickEmit("playai",socket,'setMode',"ai");
        addClickEmit("playother",socket,'setMode',"other");
        addClickEmit("playfriend",socket,'setMode',"friend");
        addClickEmit("rockbtn",socket,'choose',"rock");
        addClickEmit("paperbtn",socket,'choose',"paper");
        addClickEmit("scissorsbtn",socket,'choose',"scissors")

        addClickTheme('classicactivate',"defeault");
        addClickTheme('horroractivate',"horror");
        addClickTheme('fuckrullaactivate',"fuckrulla");
    }

    function htmlEdit(id,data) {
        document.getElementById(id).innerHTML = data;
    }

    function addClickEmit(id,socket,eventName,data) {
        document.getElementById(id).addEventListener("click", () => socket.emit(eventName, data));
    }

    function addClickTheme(id,data) {
        document.getElementById(id).addEventListener("click", () => {
            theme = data;
            updateVisuals(theme);
        });
    }

    function updateVisibility(nothidden,hidden) {
            nothidden.forEach(e => {
                document.getElementById(e).hidden = false;
            });
            hidden.forEach(e => {
                document.getElementById(e).hidden = true;
            });
    }

    function updateTotal(total) {
        document.getElementById("winBad").innerHTML = total.wins;
        document.getElementById("drawBad").innerHTML = total.draws;
        document.getElementById("lossBad").innerHTML = total.losses;
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
}
