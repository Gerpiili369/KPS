'use strict'

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);

const port = process.env.PORT || 3000;
const host = '127.0.0.1'

const io = require('socket.io')(http);
const game = require('./game.js');


let points = {draw: 0, p1: 0, p2: 0};
app.use('/', express.static(path.join(__dirname,'public')));

let players = {
  p1: {
    selection: null,
    id: null,
    result: "",
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
let games = 0;

io.on('connection', socket => {
  if (players.p1.id == null) players.p1.id = socket.id;
  else if (players.p2.id == null) players.p2.id = socket.id;
  else socket.emit('msgFromServer', 'Game full!');

  socket.on('choose', data => {
    if (players.p1.id == socket.id) players.p1.selection = data;
    else if (players.p2.id == socket.id) players.p2.selection = data;
    console.log(players)
    if (players.p1.selection != null && players.p2.selection != null) {
      games ++
      let result = game.decider(players.p1.selection, players.p2.selection)
      console.log(result)
      if (result == 'p1') {
        players.p1.points.wins ++; players.p1.result = "win";
        players.p2.points.losses ++; players.p2.result = "defeat";
      }
      if (result == 'p2') {
        players.p1.points.losses ++; players.p1.result = "defeat";
        players.p2.points.wins ++; players.p2.result = "win";
      }
      if (result == 'draw') {
        players.p1.points.draws ++; players.p1.result = "draw";
        players.p2.points.draws ++; players.p2.result = "draw";
      }

      io.to(players.p1.id).emit('result', players.p1, players.p2.selection, games);
      io.to(players.p2.id).emit('result', players.p2, players.p1.selection, games);

      players.p1.selection = null; players.p1.result = null;
      players.p2.selection = null; players.p2.result = null;
    }
  });

  socket.on('disconnect', () => {
    if (players.p1.id == socket.id) players.p1.id = null;
    else if (players.p2.id == socket.id) players.p2.id = null;
  });
});
