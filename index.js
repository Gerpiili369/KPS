'use strict';

const
    { format, createLogger, transports } = require('winston'),
    logger = createLogger({
        format: format.combine(
            format.timestamp(),
            format.colorize(),
            format.errors({ stack: true }),
            format.printf(info => `${ info.timestamp } ${ info.level }: ${ info.message }`),
        ),
        transports: [new transports.Console()],
    }),
    path = require('path'),
    express = require('express'),
    app = express(),
    http = require('http').Server(app),

    io = require('socket.io')(http),
    fs = require('fs'),

    address = fs.existsSync('./address.json') ?
        require('./address.json') :
        { port: 3000, host: '127.0.0.1', location: '' },

    port = address.port,
    host = address.host,
    location = address.location;

app.use(`/${ location }`, express.static(path.join(__dirname, 'public')));

const
    choices = ['rock', 'paper', 'scissors'],
    que = [],
    gameList = [];
let playerlist = {};

playerlist.computer = {
    username: 'computer',
    selection: '',
    result: '',
    socketId: '69696969669696969',
    gameId: NaN,
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

if (fs.existsSync(path.join('serverData', 'playerlist.json'))) {
    fs.readFile(path.join('serverData', 'playerlist.json'), 'utf-8', (err, data) => {
        if (err) {
            logger.error(err);
        } else {
            playerlist = JSON.parse(data);

            Object.keys(playerlist).forEach(username => {
                playerlist[username].socketId = '';
                playerlist[username].gameId = NaN;
            });
        }
    });
}

io.on('connection', socket => {
    socket.on('setName', username => {
        if (username === '') socket.emit('loginFail', "Username is empty!");
        else if (!playerlist[username]) {
            playerlist[username] = {
                username,
                theme: 'defeault',
                selection: '',
                result: '',
                socketId: '',
                gameId: NaN,
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
        } else if (playerlist[username].socketId) socket.emit('loginFail', 'User already logged in!');
        else login(username);
    });

    function login(username) {
        socket.name = username;

        playerlist[socket.name].socketId = socket.id;
        socket.emit('loginSucc', playerlist[socket.name]);

        socket.on('setMode', (data, extra) => {
            logger.info(`(M) [${ socket.name }] set mode to "${ data }"`);
            switch (data) {
                case "ai":
                    addAi(socket);
                    break;
                case "other":
                    addOther(socket.name);
                    break;
                case "friend":
                    addFriend(socket, extra);
                    break;
                default:
            }
        });

        socket.on('choose', data => {
            if (playerlist[socket.name].gameId) {
                gameList[[playerlist[socket.name].gameId]].choose(socket.id, data);
                gameList[[playerlist[socket.name].gameId]].checkGame();
            }
        });

        socket.on('setTheme', data => (playerlist[socket.name].theme = data));

        socket.on('disconnect', () => {
            if (playerlist[socket.name].gameId) gameList[[playerlist[socket.name].gameId]].disconnect(socket.name);
            else que.splice(que.indexOf(socket.name), 1);

            playerlist[socket.name].socketId = '';
        });
    }
});

function addAi(socket) {
    gameList.push(gameList.length);

    const newGameId = gameList.length - 1;

    gameList[newGameId] = new Game(socket.name, 'computer', newGameId);

    socket.on('choose', data => {
        playerlist.computer.selection = choices[Math.floor(Math.random() * choices.length)];
        gameList[newGameId].choose(socket.id, data);
        gameList[newGameId].checkGame();
    });

    playerlist[socket.name].gameId = newGameId;

    io.to(playerlist[socket.name].socketId).emit('msgFromServer', 'Game versus computer started');
    io.to(playerlist[socket.name].socketId).emit('startGame', 'Computer');

    logger.info(`(${ newGameId }) [${ socket.name }] started AI game`);
}

function addOther(username) {
    if (que.indexOf(username) < 0) que.push(username);

    if (que.length > 1) {
        gameList.push(gameList.length);

        const newGameId = gameList.length - 1;

        gameList[newGameId] = new Game(que.shift(), que.shift(), newGameId);

        for (const player of gameList[newGameId].players) {
            playerlist[player].gameId = newGameId;

            const otherP = gameList[newGameId].players.indexOf(player) == 0 ? 1 : 0;

            io.to(playerlist[player].socketId).emit('msgFromServer', 'Opponent found!');
            io.to(playerlist[player].socketId).emit('startGame', gameList[newGameId].players[otherP]);
        }

        logger.info(`(${ newGameId }) Game crated with ${ gameList[newGameId].players }`);
    }
}

function addFriend(socket, friend) {
    if (friend === socket.name)
        socket.emit('msgFromServer', "You can't play against yourself");
    else if (!playerlist[friend])
        socket.emit('msgFromServer', "Friend doesn't exist");
    else if (!playerlist[friend].socketId)
        socket.emit('msgFromServer', "Friend offline");
    else if (playerlist[friend].gameId)
        socket.emit('msgFromServer', "Friend occupied");
    else {
        gameList.push(gameList.length);

        const newGameId = gameList.length - 1;

        gameList[newGameId] = new Game(socket.name, friend, newGameId);

        for (const player of gameList[newGameId].players) {
            playerlist[player].gameId = newGameId;

            const otherP = gameList[newGameId].players.indexOf(player) == 0 ? 1 : 0;

            io.to(playerlist[player].socketId).emit('msgFromServer', 'Friend found!');
            io.to(playerlist[player].socketId).emit('startGame', gameList[newGameId].players[otherP]);
        }

        logger.info(`(${ newGameId }) Friendly match with: ${ gameList[newGameId].players }`);
    }
}

function updateJSON() {
    fs.writeFile(
        path.join('serverData', 'playerlist.json'),
        JSON.stringify(playerlist, null, 4),
        err => {
            if (err) logger.info(err);
        });
}

class Game {
    constructor(p1, p2, id) {
        this.players = [p1, p2];
        this.id = id;
    }

    choose(id, data) {
        for (const player of this.players) if (playerlist[player].socketId == id) {
            playerlist[player].selection = data;
            logger.info(`(${ this.id }) [${ player }] chose ${ data }`);
        } else io.to(playerlist[player].socketId).emit('msgFromServer', 'Ready');
    }

    checkGame() {
        if (playerlist[this.players[0]].selection && playerlist[this.players[1]].selection) {
            this.result = this.decider(playerlist[this.players[0]].selection, playerlist[this.players[1]].selection);

            switch (this.result) {
                case 'p1':
                    playerlist[this.players[0]].points.wins++;
                    playerlist[this.players[0]].total.wins++;
                    playerlist[this.players[0]].result = 'win';
                    playerlist[this.players[1]].points.losses++;
                    playerlist[this.players[1]].total.losses++;
                    playerlist[this.players[1]].result = 'defeat';
                    logger.info(`(${ this.id }) [${ this.players[0] }] has won the round`);
                    break;
                case 'p2':
                    playerlist[this.players[0]].points.losses++;
                    playerlist[this.players[0]].total.losses++;
                    playerlist[this.players[0]].result = 'defeat';
                    playerlist[this.players[1]].points.wins++;
                    playerlist[this.players[1]].total.wins++;
                    playerlist[this.players[1]].result = 'win';
                    logger.info(`(${ this.id }) [${ this.players[1] }] has won the round`);
                    break;
                case 'draw':
                    playerlist[this.players[0]].points.draws++;
                    playerlist[this.players[0]].total.draws++;
                    playerlist[this.players[0]].result = 'draw';
                    playerlist[this.players[1]].points.draws++;
                    playerlist[this.players[1]].total.draws++;
                    playerlist[this.players[1]].result = 'draw';
                    logger.info(`(${ this.id }) The round was a draw`);
                    break;
                default:
            }

            for (const player in this.players) {
                const otherP = player == 0 ? 1 : 0;

                playerlist[this.players[player]].games++;
                io.to(playerlist[this.players[player]].socketId).emit('result', playerlist[this.players[player]], playerlist[this.players[otherP]].selection);
            }

            for (const player of this.players) {
                playerlist[player].selection = '';
                playerlist[player].result = '';

                io.to(playerlist[player].socketId).emit('msgFromServer', 'New round!');
            }

            logger.info(`(${ this.id }) A new round has been started!`);

            updateJSON();
        }
    }

    decider(p1, p2) {
        let result = 'draw';
        if (p1 !== p2) switch (p1) {
            case 'rock':
                result = (p2 === 'scissors') ? 'p1' : 'p2';
                break;
            case 'paper':
                result = (p2 === 'rock') ? 'p1' : 'p2';
                break;
            case 'scissors':
                result = (p2 === 'paper') ? 'p1' : 'p2';
                break;
            default:
        }
        return result;
    }

    disconnect(username) {
        logger.info(`(${ this.id }) [${ this.players[this.players.indexOf(username)] }] left`);

        this.resetGame("Opponent left");
        updateJSON();
    }

    resetGame(reason) {
        for (const player of this.players) {
            playerlist[player].games = 0;
            playerlist[player].points = { wins: 0, losses: 0, draws: 0 };
            playerlist[player].gameId = NaN;
            this.players[player] = '';

            io.to(playerlist[player].socketId).emit('toMainMenu', reason);
        }
    }
}

http.listen(port, host, () => logger.info(`Server ${ host } on port ${ port }.`));
