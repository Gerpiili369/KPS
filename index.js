'use strict'

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);

const io = require('socket.io')(http);
const fs = require('fs');

var address = {port: 3000, host: '127.0.0.1'}

if (fs.existsSync('./address.json')) {
    address = require('./address.json');
}

const port = process.env.PORT || address.port;
const host = address.host;

app.use('/', express.static(path.join(__dirname,'public')));

let que = [];
var playerlist = {};
var gameList = [];

playerlist.computer = {
    //username: "computer",
    selection: null,
    result: null,
    socketId: 69696969669696969,
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

if (fs.existsSync(path.join('serverData','playerlist.json'))) {
    fs.readFile(path.join('serverData','playerlist.json'), 'utf-8', (err, data) => {
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
                theme: "defeault",
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

        socket.on('setMode', (data,extra) => {
            console.log("(M) ["+socket.name+"] set mode to \""+data+"\"");
            switch (data) {
                case "ai":
                    addAi(socket)
                    break;
                case "other":
                    addOther(socket.name);
                    break;
                case "friend":
                    addFriend(socket,extra);
                    break;
            }
        });

        socket.on('choose', data => {
            if (playerlist[socket.name].gameId != null) {
                gameList[[playerlist[socket.name].gameId]].choose(socket.id,data);
                gameList[[playerlist[socket.name].gameId]].checkGame();
            }
        });

        socket.on('setTheme', data => {
            playerlist[socket.name].theme = data;
        })

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

function addAi(socket) {
    gameList.push(gameList.length)

    let newGameId = gameList.length-1

    gameList[newGameId] = new Ai(socket,newGameId);

    playerlist[socket.name].gameId = newGameId;

    io.to(playerlist[socket.name].socketId).emit('msgFromServer', "Game versus computer started");
    io.to(playerlist[socket.name].socketId).emit('startGame', "Computer");

    console.log("("+newGameId+") ["+socket.name+"] started AI game");
}

function addOther(username) {
    if (que.indexOf(username) == -1) {
        que.push(username);
    }

    if (que.length > 1) {
        gameList.push(gameList.length)

        let newGameId = gameList.length-1

        gameList[newGameId] = new Game(que.shift(),que.shift(),newGameId);

        gameList[newGameId].players.forEach(p => {
            playerlist[p].gameId = newGameId;

            let otherP;
            switch (gameList[newGameId].players.indexOf(p)) {
                case 0:
                    otherP = 1;
                    break;
                case 1:
                    otherP = 0;
                    break;
            }

            io.to(playerlist[p].socketId).emit('msgFromServer', "Opponent found!");
            io.to(playerlist[p].socketId).emit('startGame', gameList[newGameId].players[otherP]);
        });

        console.log("("+newGameId+") Game crated with "+gameList[newGameId].players);
    }
}

function addFriend(socket,friend) {
    if (friend != socket.name) {
        if (playerlist[friend] != undefined) {
            if (playerlist[friend].socketId != null) {
                if (playerlist[friend].gameId == null) {
                    gameList.push(gameList.length)

                    let newGameId = gameList.length-1

                    gameList[newGameId] = new Game(socket.name,friend,newGameId);

                    gameList[newGameId].players.forEach(p => {
                        playerlist[p].gameId = newGameId;

                        let otherP;
                        switch (gameList[newGameId].players.indexOf(p)) {
                            case 0:
                                otherP = 1;
                                break;
                            case 1:
                                otherP = 0;
                                break;
                        }

                        io.to(playerlist[p].socketId).emit('msgFromServer', "Friend found!");
                        io.to(playerlist[p].socketId).emit('startGame', gameList[newGameId].players[otherP]);
                    });

                    console.log("("+newGameId+") Friendly match with: "+gameList[newGameId].players);
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
    fs.writeFile(path.join('serverData','playerlist.json'), JSON.stringify(playerlist), err => {if (err) console.log(err)});
}

class Game {
    constructor(p1,p2,id) {
        this.players = [p1,p2];
        this.id = id;
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
                console.log("("+this.id+") The round was a draw");
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

            console.log("("+this.id+") A new round has been started!");

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
    constructor(socket,id) {
        super();

        this.players = [socket.name,'computer'];
        this.choices = ['rock','paper','scissors'];

        socket.on('choose', () => {
            playerlist.computer.selection = this.choices[Math.floor(Math.random()*this.choices.length)];
            this.checkGame();
        });
    }
}

class Friend extends Game {
    constructor(p1,p2,id) {
        super();
    }
}

http.listen(port,host, ()=>
    console.log(`Server ${host} on port ${port}.`)
);
