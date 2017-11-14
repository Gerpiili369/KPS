'use strict'

const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);

const port = process.env.PORT || 3000;
const host = '127.0.0.1'

const io = require('socket.io')(http);

app.get('/', (req,res) =>
  res.sendFile(path.join(__dirname,'index.html'))
);

let points = {draw: 0, p1: 0, p2: 0};

let selection = {p1:'', p2:''}
let games;
let player1;
let player2;


io.on('connection', socket => {
  if (player1 == null) player1 = socket.id;
  else if (player2 == null) player2 = socket.id;
  else socket.emit('msgFromServer', 'Game full!');

  socket.on('choose', data => {
    if (player1 == socket.id) selection.p1 = data;
    else if (player2 == socket.id) selection.p2 = data;

    if (selection.p1 != "" && selection.p2 != "") {
      games ++
      let result = decider(selection.p1, selection.p2)

      if (result == 'p1') {points.p1 ++}
      if (result == 'p2') {points.p2 ++}
      if (result == 'draw') {points.draws ++}

      if (player1 == socket.id) {
        socket.emit('result', points, selection.p1, selection.p2, games);
      }
      else if (player2 == socket.id) {
        let p2help = {draw: 0, p2: 0, p1: 0}

        p2help.draw = points.draw;
        p2help.p1 = points.p2;
        p2help.p2 = points.p1

        socket.emit('result,', (p2help, selection.p2, selection.p1, games))
      }
    }
  });

  socket.on('disconnect', () => {
    if (player1 == socket.id) player1 = null;
    else if (player2 == socket.id) player2 = null;
  });
});
