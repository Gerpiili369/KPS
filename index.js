'use strict'

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);

const port = process.env.PORT || 3000;
const host = '127.0.0.1'

const io = require('socket.io')(http);
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
  }}

io.on('connection', socket => {
  if (players.p1.id == null) {
    players.p1.id = socket.id;
    console.log(socket.id+" connected as Player 1");
  }
  else if (players.p2.id == null) {
    players.p2.id = socket.id;
    console.log(socket.id+" connected as Player 2");
  }
  else {
    socket.emit('msgFromServer', 'Game full!');
    console.log(socket.id+" connected but game is full");
  }
  
  socket.on('choose', data => {
    if (players.p1.id == socket.id) {
      players.p1.selection = data;
      console.log("Player 1 chose "+data);
    }
    else if (players.p2.id == socket.id) {
      players.p2.selection = data;
      console.log("Player 2 chose "+data);
    }
    if (players.p1.selection != null && players.p2.selection != null) {
      games ++
      let result = game.decider(players.p1.selection, players.p2.selection)

      if (result == 'p1') {
        players.p1.points.wins ++; players.p1.result = "win";
        players.p2.points.losses ++; players.p2.result = "defeat";
        console.log("Player 1 has won the round");
      }
      if (result == 'p2') {
        players.p1.points.losses ++; players.p1.result = "defeat";
        players.p2.points.wins ++; players.p2.result = "win";
        console.log("Player 2 has won the round");
      }
      if (result == 'draw') {
        players.p1.points.draws ++; players.p1.result = "draw";
        players.p2.points.draws ++; players.p2.result = "draw";
        console.log("The round was a draw");
      }

      io.to(players.p1.id).emit('result', players.p1, players.p2.selection, games);
      io.to(players.p2.id).emit('result', players.p2, players.p1.selection, games);

      players.p1.selection = null; players.p1.result = null;
      players.p2.selection = null; players.p2.result = null;
      console.log("A new round has been started!");
    }
  });

  socket.on('disconnect', () => {
    games = 0
    players.p1.points = {wins: 0, losses: 0, draws: 0}
    players.p2.points = {wins: 0, losses: 0, draws: 0}

    if (players.p1.id == socket.id) {
      players.p1.id = null;
      console.log("Player 1 left");
    }
    else if (players.p2.id == socket.id) {
      players.p2.id = null;
      console.log("Player 2 left");
    }
  });
});

http.listen(port,host, ()=>
  console.log(`Server ${host} on port ${port}.`)
);
