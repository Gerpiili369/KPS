'use strict'

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);

const port = process.env.PORT || 3000;
const host = '127.0.0.1';

const io = require('socket.io')(http);
const fs = require('fs');
const game = require('./game.js');

app.use('/', express.static(path.join(__dirname,'public')));

let games = 0;
let players = {
    p1: {
        selection: null,
        id: null,
        result: null,
        points: {
            wins: 0,
            losses: 0,
            draws: 0
        }
    },
    p2: {
        selection: null,
        id: null,
        result: null,
        points: {
            wins: 0,
            losses: 0,
            draws: 0
        }
    }
};
let que = [];
var playerlist = {};

fs.readFile('serverData/playerlist.json', 'utf-8', (err, data) => {
    playerlist = JSON.parse(data);
});

io.on('connection', socket => {
    socket.on('setName', data => {
        if (playerlist[data] == undefined) {
            playerlist[data] = {};
            playerlist[data].points = {wins: 0, losses: 0, draws: 0};

            login(data);
        } else if (playerlist[data].socket == null) {
            login(data);
        } else {
            console.log("error you fug up");
        }

        fs.writeFile('serverData/playerlist.json', JSON.stringify(playerlist), err => {
            if (err) console.log(err);
        });
    });

    function login(data) {
        socket.name = data;
        playerlist[data].socket = socket.id;
    }

    que.push(socket.id)
    updatePlayers();

    socket.on('choose', data => {
        if (players.p1.id == socket.id) {
            players.p1.selection = data;
            io.to(players.p2.id).emit('msgFromServer', "Ready");
            console.log("Player 1 chose "+data);
        } else if (players.p2.id == socket.id) {
            players.p2.selection = data;
            io.to(players.p1.id).emit('msgFromServer', "Ready");
            console.log("Player 2 chose "+data);
        }

        if (players.p1.selection != null && players.p2.selection != null) {
            games ++;
            let result = game.decider(players.p1.selection, players.p2.selection);

            if (result == 'p1') {
                players.p1.points.wins ++; players.p1.result = "win";
                players.p2.points.losses ++; players.p2.result = "defeat";
                console.log("Player 1 has won the round");
            } else if (result == 'p2') {
                players.p1.points.losses ++; players.p1.result = "defeat";
                players.p2.points.wins ++; players.p2.result = "win";
                console.log("Player 2 has won the round");
            } else if (result == 'draw') {
                players.p1.points.draws ++; players.p1.result = "draw";
                players.p2.points.draws ++; players.p2.result = "draw";
                console.log("The round was a draw");
            }

            io.to(players.p1.id).emit('result', players.p1, players.p2.selection, games);
            io.to(players.p2.id).emit('result', players.p2, players.p1.selection, games);

            players.p1.selection = null; players.p1.result = null;
            players.p2.selection = null; players.p2.result = null;

            io.to(players.p1.id).emit('msgFromServer', "New round!");
            io.to(players.p1.id).emit('msgFromServer', "New round!");
            console.log("A new round has been started!");
        }
    });

    socket.on('disconnect', () => {
        if (players.p1.id == socket.id) {
            resetGame();
            players.p1.id = null;
            io.to(players.p2.id).emit('msgFromServer', "Opponent left");
            console.log("Player 1 left");
        } else if (players.p2.id == socket.id) {
            resetGame();
            players.p2.id = null;
            io.to(players.p1.id).emit('msgFromServer', "Opponent left");
            console.log("Player 2 left");
        } else {
            que.splice(que.indexOf(socket.id), 1);
        }

        playerlist[socket.name].socket = null;
        updatePlayers();
    });
});

function updatePlayers() {
    if (que[0] != undefined) {
        if (players.p1.id == null) {
            players.p1.id = que.shift();
            console.log(players.p1.id+" joined as Player 1");
        } else if (players.p2.id == null) {
            players.p2.id = que.shift();
            console.log(players.p2.id+" joined as Player 2");
        }

        if (que[0] != undefined) {
            que.forEach(queId => {
                io.to(queId).emit('msgFromServer', 'Game full!');
            });
            console.log("Players in que: "+que.length);
        }
    }

    if (players.p1.id != null && players.p2.id != null) {
        io.to(players.p1.id).emit('msgFromServer', "Opponent found!");
        io.to(players.p2.id).emit('msgFromServer', "Opponent found!");
    }
}

function resetGame() {
    games = 0;

    players.p1.points = {wins: 0, losses: 0, draws: 0};
    players.p2.points = {wins: 0, losses: 0, draws: 0};
}

http.listen(port,host, ()=>
    console.log(`Server ${host} on port ${port}.`)
);
