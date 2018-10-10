document.addEventListener('DOMContentLoaded', () => fetch('sockSrc.json')
    .then(res => res.json())
    .then(data => data, () => ({ url: '', options: { path: '/socket.io' } }))
    .then(sockData => {
        sockpath = document.getElementById('socket');
        sockpath.src = `${sockData.options.path}/socket.io.js`;
        return new Promise(resolve => sockpath.onload = () => resolve(sockData));
    })
    .then(initialize)
    .catch(console.log)
);

function initialize(sockData) {
    let
        theme = 'defeault',
        mem = { player: { selection: '', result: '' }, opponent: '' },
        socket = io(sockData.url, sockData.options);

    updateVisuals(theme);
    addSomeListeners(socket);

    socket.on('loginSucc', player => {
        theme = player.theme;

        htmlEdit('msg', 'Choose mode');
        htmlEdit('usertext', player.username);
        updateTotal(player.total);

        updateVisuals(theme);
        updateVisibility(['mainmenu','topbar'], ['login'])
    });

    socket.on('loginFail', data => htmlEdit('msg', data));

    socket.on('startGame', data => {
        htmlEdit('opponent', data);
        updateVisibility(['choosebar', 'gamearea'], ['mainmenu']);
    });

    socket.on('toMainMenu', data => {
        htmlEdit('msg', data);
        updateVisibility(['mainmenu'], ['choosebar', 'gamearea', 'resultarea', 'progress']);
    });

    socket.on('msgFromServer', data => htmlEdit('msg', data));

    socket.on('result', (player, opponent) => {
        mem.player = player;
        mem.opponent = opponent;

        updateTotal(player.total);

        document.getElementById('winBar').style = `width: ${player.points.wins / player.games * 10}%`;
        document.getElementById('drawBar').style = `width: ${player.points.draws / player.games * 10}%`;
        document.getElementById('lossBar').style = `width: ${player.points.losses / player.games * 10}%`;

        updateVisuals(theme);
        updateVisibility(['resultarea', 'progress']);
    });

    function addSomeListeners(socket) {
        document.getElementById('namebtn').addEventListener('click', () =>
            socket.emit('setName', document.getElementById('name').value)
        );

        addClickEmit('playai', socket, 'setMode', 'ai');
        addClickEmit('playother', socket, 'setMode', 'other');
        document.getElementById('playfriend').addEventListener('click', () =>
            socket.emit('setMode', 'friend', document.getElementById('friendname').value)
        );

        for (const choice of ['rock', 'paper', 'scissors'])
            addClickEmit(choice + 'btn', socket, 'choose', choice);

        addClickTheme('classicactivate', 'defeault');
        for (const theme of ['horror', 'fuckrulla', 'hand'])
            addClickTheme(theme + 'activate', theme);
    }

    function htmlEdit(id, data) {
        document.getElementById(id).innerHTML = data;
    }

    function addClickEmit(id, socket, eventName, data) {
        console.log(id, socket, eventName, data);
        document.getElementById(id).addEventListener('click', () => socket.emit(eventName, data));
    }

    function addClickTheme(id, data) {
        document.getElementById(id).addEventListener('click', () => {
            socket.emit('setTheme', data);
            theme = data;
            updateVisuals(theme);
        });
    }

    function updateVisibility(nothidden, hidden = []) {
        for (const id of nothidden) document.getElementById(id).hidden = false;
        for (const id of hidden) document.getElementById(id).hidden = true;
    }

    function updateTotal(total) {
        document.getElementById('winBad').innerHTML = total.wins;
        document.getElementById('drawBad').innerHTML = total.draws;
        document.getElementById('lossBad').innerHTML = total.losses;
    }

    function updateVisuals(theme) {
        document.getElementById('playerpicture').src = `img/${ theme }/${ mem.player.selection }.png`;
        document.getElementById('opponentpicture').src = `img/${ theme }/${ mem.opponent }.png`;
        document.getElementById('resultimg').src = `img/${ theme }/${ mem.player.result }.png`;
        document.getElementById('vs').src = `img/${ theme }/vs.png`;
        document.getElementById('stylesheet').href = `css/${ theme }.css`;
    }
}
