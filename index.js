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

let players = {p1: null, p2: null};
let que = [];
var playerlist = {};

if (fs.existsSync('serverData/playerlist.json')) {
    fs.readFile('serverData/playerlist.json', 'utf-8', (err, data) => {
        playerlist = JSON.parse(data);

        Object.keys(playerlist).forEach(username => {
            playerlist[username].socketId = null;
        });
    });
}

io.on('connection', socket => {
    socket.on('setName', username => {
        if (playerlist[username] == undefined) {
            playerlist[username] = {
                selection: null,
                result: null,
                socket: null,
                games: 0,
                points: {
                    wins: 0,
                    losses: 0,
                    draws: 0
                },
                total: {
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    games: 0
                }
            };

            login(username);
        } else if (playerlist[username].socketId == null) {
            login(username);
        } else {
            socket.emit('loginFail', "User already logged in!");
        }
    });

    function login(username) {
        socket.name = username;

        playerlist[socket.name].socketId = socket.id;
        que.push(socket.name);
        socket.emit('loginSucc');

        updatePlayers();

        socket.on('choose', data => {
            if (playerlist[players.p1].socketId == socket.id) {
                playerlist[players.p1].selection = data;
                io.to(playerlist[players.p2].socketId).emit('msgFromServer', "Ready");
                console.log("["+players.p1+"] chose "+data);
            } else if (playerlist[players.p2].socketId == socket.id) {
                playerlist[players.p2].selection = data;
                io.to(playerlist[players.p1].socketId).emit('msgFromServer', "Ready");
                console.log("["+players.p2+"] chose "+data);
            }

            if (playerlist[players.p1].selection != null && playerlist[players.p2].selection != null) {
                let result = game.decider(playerlist[players.p1].selection, playerlist[players.p2].selection);

                if (result == 'p1') {
                    playerlist[players.p1].points.wins ++;
                    playerlist[players.p1].total.wins ++;
                    playerlist[players.p1].result = "win";
                    playerlist[players.p2].points.losses ++;
                    playerlist[players.p2].total.losses ++;
                    playerlist[players.p2].result = "defeat";
                    console.log("["+players.p1+"] has won the round");
                } else if (result == 'p2') {
                    playerlist[players.p1].points.losses ++;
                    playerlist[players.p1].total.losses ++;
                    playerlist[players.p1].result = "defeat";
                    playerlist[players.p2].points.wins ++;
                    playerlist[players.p2].total.wins ++;
                    playerlist[players.p2].result = "win";
                    console.log("["+players.p2+"] has won the round");
                } else if (result == 'draw') {
                    playerlist[players.p1].points.draws ++;
                    playerlist[players.p1].total.draws ++;
                    playerlist[players.p1].result = "draw";
                    playerlist[players.p2].points.draws ++;
                    playerlist[players.p2].total.draws ++;
                    playerlist[players.p2].result = "draw";
                    console.log("The round was a draw");
                }

                Object.keys(players).forEach(p => {
                    let otherP;
                    if (p == "p1") {otherP = "p2"} else if (p == "p2") {otherP = "p1"}

                    playerlist[players[p]].games ++

                    io.to(playerlist[players[p]].socketId).emit('result', playerlist[players[p]], playerlist[players[otherP]].selection);

                    playerlist[players[p]].selection = null;
                    playerlist[players[p]].result = null;

                    io.to(playerlist[players[p]].socketId).emit('msgFromServer', "New round!");
                });

                console.log("A new round has been started!");
            }
        });

        socket.on('disconnect', () => {
            if (playerlist[players.p1].socketId == socket.id) {
                resetGame("p1");

                io.to(playerlist[players.p2].socketId).emit('msgFromServer', "Opponent left");
                console.log("["+players.p1+"] left");
            } else if (playerlist[players.p2].socketId == socket.id) {
                resetGame("p2");

                io.to(playerlist[players.p1].socketId).emit('msgFromServer', "Opponent left");
                console.log("["+players.p2+"] left");
            } else {
                que.splice(que.indexOf(socket.name), 1);
            }

            playerlist[socket.name].socketId = null;
            updatePlayers();
        });
    }
});

function updatePlayers() {
    if (que[0] != undefined) {
        if (players.p1 == null) {
            players.p1 = que.shift();
            console.log("Players in game: "+players.p1+" Vs. "+players.p2);
            console.log("["+players.p1+"] joined as Player 1");
        } else if (players.p2 == null) {
            players.p2 = que.shift();
            console.log("Players in game: "+players.p1+" Vs. "+players.p2);
            console.log("["+players.p2+"] joined as Player 2");
        }

        if (que[0] != undefined) {
            que.forEach(username => {
                io.to(playerlist[username].socketId).emit('msgFromServer', 'Game full!');
            });

            console.log("Players in que: "+que.length);
        }
    }

    if (players.p1 != null && players.p2 != null) {
        Object.keys(players).forEach(p => {
            io.to(playerlist[players[p]].socketId).emit('msgFromServer', "Opponent found!");
        });
    }

    fs.writeFile('serverData/playerlist.json', JSON.stringify(playerlist), err => {if (err) console.log(err)});
}

function resetGame(p) {
    Object.keys(players).forEach(p => {
        playerlist[players[p]].games = 0;
        playerlist[players[p]].points = {wins: 0, losses: 0, draws: 0};
    });

    playerlist[players[p]].socketId = null;
    players[p] = null;
}

http.listen(port,host, ()=>
    console.log(`Server ${host} on port ${port}.`)
);
