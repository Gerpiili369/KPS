'use strict'

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);

const port = process.env.PORT || 3000;
const host = '127.0.0.1';

const io = require('socket.io')(http);
const fs = require('fs');

app.use('/', express.static(path.join(__dirname,'public')));

let que = [];
var playerlist = {};
var gameList = [];

if (fs.existsSync('serverData/playerlist.json')) {
    fs.readFile('serverData/playerlist.json', 'utf-8', (err, data) => {
        playerlist = JSON.parse(data);

        Object.keys(playerlist).forEach(username => {
            playerlist[username].socketId = null;
            playerlist[username].gameId = null;
        });
    });
}

io.on('connection', socket => {
    socket.on('setName', username => {
        if (username == "") {
            socket.emit('loginFail', "Username is empty!")
        } else if (playerlist[username] == undefined) {
            playerlist[username] = {
                username: username,
                selection: null,
                result: null,
                socketId: null,
                gameId: null,
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
        socket.emit('loginSucc', playerlist[socket.name]);

        socket.on('setMode', data => {
            console.log("["+socket.name+"] set mode to \""+data+"\"");
            switch (data) {
                case "ai":
                    var ai = new Ai(socket.name);
                    break;
                case "other":
                    addOther(socket.name);
                    break;
                case "friend":
                    addFriend(socket,"f1");
                    break;
            }
        });

        socket.on('choose', data => {
            if (playerlist[socket.name].gameId != null) {
                console.log(playerlist[socket.name].gameId);
                gameList[[playerlist[socket.name].gameId]].choose(socket.id,data);
                gameList[[playerlist[socket.name].gameId]].checkGame();
            }
        });

        socket.on('disconnect', () => {
            if (playerlist[socket.name].gameId != null) {
                gameList[[playerlist[socket.name].gameId]].disconnect(socket.name);
            } else {
                que.splice(que.indexOf(socket.name), 1);
            }

            playerlist[socket.name].socketId = null;
        });
    }
});

function addOther(username) {
    if (que.indexOf(username) == -1) {
        que.push(username);
    }

    if (que.length > 1) {
        console.log("que has more 2");
        gameList.push(gameList.length)
        gameList[gameList.length-1] = new Game(que.shift(),que.shift());

        gameList[gameList.length-1].players.forEach(p => {
            playerlist[p].gameId = gameList.length-1;

            io.to(playerlist[p].socketId).emit('msgFromServer', "Opponent found!");
            io.to(playerlist[p].socketId).emit('startGame');
        });

        console.log(this.id+" => game crated with "+this.players);
    }
}

function addFriend(socket,friend) {
    if (friend != socket.name) {
        if (playerlist[friend] != undefined) {
            if (playerlist[friend].socketId != null) {
                if (playerlist[friend].gameId == null) {
                    gameList.push(gameList.length)
                    gameList[gameList.length-1] = new Game(socket.name,friend);

                    gameList[gameList.length-1].players.forEach(u => {
                        playerlist[u].gameId = gameList.length-1;

                        io.to(playerlist[p].socketId).emit('msgFromServer', "Friend found!");
                        io.to(playerlist[p].socketId).emit('startGame');
                    });

                    console.log("Friendly match with: "+this.players);
                } else {
                    socket.emit('msgFromServer', "Friend occupied")
                }
            } else {
                socket.emit('msgFromServer', "Friend offline")
            }
        } else {
            socket.emit('msgFromServer', "Friend doesn't exist")
        }
    } else {
        socket.emit('msgFromServer', "You can't play against yourself")
    }
}

function updateJSON() {
    fs.writeFile('serverData/playerlist.json', JSON.stringify(playerlist), err => {if (err) console.log(err)});
}

class Game {
    constructor(p1,p2) {
        this.players = [p1,p2];
        this.id = gameList.length-1
    }

    choose(id,data) {
        if (playerlist[this.players[0]].socketId == id) {
            playerlist[this.players[0]].selection = data;
            io.to(playerlist[this.players[1]].socketId).emit('msgFromServer', "Ready");
            console.log("("+this.id+") ["+this.players[0]+"] chose "+data);
        } else if (playerlist[this.players[1]].socketId == id) {
            playerlist[this.players[1]].selection = data;
            io.to(playerlist[this.players[0]].socketId).emit('msgFromServer', "Ready");
            console.log("("+this.id+") ["+this.players[1]+"] chose "+data);
        }
    }

    checkGame() {
        if (playerlist[this.players[0]].selection != null && playerlist[this.players[1]].selection != null) {
            this.result = this.decider(playerlist[this.players[0]].selection, playerlist[this.players[1]].selection);

            if (this.result == 'p1') {
                playerlist[this.players[0]].points.wins ++;
                playerlist[this.players[0]].total.wins ++;
                playerlist[this.players[0]].result = "win";
                playerlist[this.players[1]].points.losses ++;
                playerlist[this.players[1]].total.losses ++;
                playerlist[this.players[1]].result = "defeat";
                console.log("("+this.id+") ["+this.players[0]+"] has won the round");
            } else if (this.result == 'p2') {
                playerlist[this.players[0]].points.losses ++;
                playerlist[this.players[0]].total.losses ++;
                playerlist[this.players[0]].result = "defeat";
                playerlist[this.players[1]].points.wins ++;
                playerlist[this.players[1]].total.wins ++;
                playerlist[this.players[1]].result = "win";
                console.log("("+this.id+") ["+this.players[1]+"] has won the round");
            } else if (this.result == 'draw') {
                playerlist[this.players[0]].points.draws ++;
                playerlist[this.players[0]].total.draws ++;
                playerlist[this.players[0]].result = "draw";
                playerlist[this.players[1]].points.draws ++;
                playerlist[this.players[1]].total.draws ++;
                playerlist[this.players[1]].result = "draw";
                console.log(this.id+" => The round was a draw");
            }

            this.players.forEach(p => {
                p = this.players.indexOf(p)
                let otherP;
                if (p == 0) {
                    otherP = 1
                } else if (p == 1) {
                    otherP = 0
                }

                playerlist[this.players[p]].games ++
                io.to(playerlist[this.players[p]].socketId).emit('result', playerlist[this.players[p]], playerlist[this.players[otherP]].selection);
            });

            this.players.forEach(p => {
                playerlist[p].selection = null;
                playerlist[p].result = null;

                io.to(playerlist[p].socketId).emit('msgFromServer', "New round!");
            });

            console.log(this.id+" => A new round has been started!");

            updateJSON();
        }
    }

    decider(p1, p2) {
        if (p1==='rock') {
            if (p2==='rock') {
                return 'draw';
            } else if (p2==='paper') {
                return 'p2';
            } else {
                return 'p1';
            }
        } else if (p1==='paper') {
            if (p2==='rock') {
                return 'p1';
            } else if (p2==='paper') {
                return 'draw';
            } else {
                return 'p2';
            }
        } else {
            if (p2==='rock') {
                return 'p2';
            } else if (p2==='paper') {
                return 'p1';
            } else {
                return 'draw';
            }
        }
    }

    disconnect(username) {
        if (username == this.players[0]) {
            io.to(playerlist[this.players[1]].socketId).emit('msgFromServer', "Opponent left");
            console.log("("+this.id+") ["+this.players[0]+"] left");
        } else if (username == this.players[1]) {
            io.to(playerlist[this.players[0]].socketId).emit('msgFromServer', "Opponent left");
            console.log("("+this.id+") ["+this.players[1]+"] left");
        }

        this.resetGame();
        updateJSON();
    }

    resetGame() {
        this.players.forEach(p => {
            playerlist[p].games = 0;
            playerlist[p].points = {wins: 0, losses: 0, draws: 0};
            playerlist[p].gameId = null;
            this.players[p] = null;

            io.to(playerlist[p].socketId).emit('toMainMenu');
        });
    }
}

class Ai extends Game {
    constructor(player) {
        super();

        this.players = [player]
        this.choices = ['rock','paper','scissors'];

        this.computer = choices[Math.floor(Math.random()*choices.length)];
    }
}

class Friend extends Game {
    constructor(p1,p2) {
        super();
    }
}

http.listen(port,host, ()=>
    console.log(`Server ${host} on port ${port}.`)
);
