const express = require('express');
const app = express();
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.use(express.static('public'));

let arr = [];
let playingArr = [];
let gameCount=0;
let XWinCount=0;
let OWinCount=0;
let tieCount=0;
let gameEnded = false;
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
];
let turn = 'X';
global.obj;
global.board = [
    '','','',
    '','','',
    '','',''
];
io.on("connection", (socket) => {
    console.log("A user connected.");
    socket.on("find", (name) => {
        console.log("Searching for player: " + name);
        arr.push({ id: socket.id, name: name });
        if (arr.length >= 2) {
            const player1 = arr[0];
            const player2 = arr.find(p => p.id !== player1.id);
            if (player2) {
                obj = {
                    p1: {
                        name: player1.name,
                        value: "X",
                        move: "",
                    },
                    p2: {
                        name: player2.name,
                        value: "O",
                        move: "",
                    },
                    sum: 1,
                };
                playingArr.push(obj);
                arr = arr.filter(p => p.id !== player1.id && p.id !== player2.id);
                turn = 'X';
                io.to(player1.id).emit("playerFound", { opponent: player2.name, player: obj.p1 });
                io.to(player2.id).emit("playerFound", { opponent: player1.name, player: obj.p2 });
            }
        }
    });

    socket.on("playing", (data) => {
        // for(let cell in global.board){
        //     console.log(`Cell ${cell} is occupied by ${global.board[cell]}`);
        // }
        if(gameEnded)return;
        console.log("Playing event received:", data);
        const { value, id, name } = data;
        let objToChange;
        if(value === turn){
            turn = (turn === 'X') ? 'O' : 'X';
            if(global.board[id]===''){
                console.log(`Pos ${id} has been set to ${value}.`);
                global.board[id] = value;
            }
            else console.log(`Pos ${id} is already taken by ${global.board[id]}.`);
            if (value === 'X') {
                objToChange = playingArr.find(obj => obj.p1.name === name);
                if (objToChange) {
                    objToChange.p1.move = id;
                }
            } else if (value === 'O') {
                objToChange = playingArr.find(obj => obj.p2.name === name);
                if (objToChange) {
                    objToChange.p2.move = id;
                }
            }
            if (objToChange) {
                objToChange.sum++;
                console.log("Emitting updated playingArr:", playingArr);
                io.emit("playing", playingArr);
        
                // Check for game over after updating the game state
                let {name, board, sum} = data;
                let result;
                for(const combination of winningCombinations) {
                  const [a,b,c] = combination;
                  if (global.board[a] && global.board[a] === global.board[b] && global.board[a] === global.board[c]) {
                    result = global.board[a];
                    break;
                  }
                }
                if(sum===10 && !result){
                  result = "tie";
                }
                if(result){
                  if(result === 'X'){
                    XWinCount++;
                    name = obj.p1.name;
                  } else if(result === 'O'){
                    OWinCount++;
                    name = obj.p2.name;
                  } else if(result === 'tie'){
                    tieCount++;
                    name = 'null';
                  }
                  gameCount++;
                  for(let cell in global.board){
                    global.board[cell]='';
                  }
                  gameEnded = true;
                  //turn = 'X';
                  obj = null; // Reset the obj
        
                  // Emit the gameOver event to all connected sockets
                  io.emit("gameOver", {name:name, board: global.board,result: result, gameCount: gameCount, XWinCount: XWinCount, OWinCount: OWinCount, tieCount: tieCount});
                }
            }
        }
        else console.log(`Clicked cell ${id}, but it is not ${value}'s turn.`);
    });

    socket.on("endCheck", (data) => {
        let {name, board, sum} = data;
        let result;
        for(const combination of winningCombinations) {
          const [a,b,c] = combination;
          if (global.board[a] && global.board[a] === global.board[b] && global.board[a] === global.board[c]) {
            result = global.board[a];
            break;
          }
        }
        if(sum===10 && !result){
          result = "tie";
        }
        if(result){
          if(result === 'X'){
            XWinCount++;
            name = obj.p1.name;
          } else if(result === 'O'){
            OWinCount++;
            name = obj.p2.name;
          } else if(result === 'tie'){
            tieCount++;
            name = 'null';
          }
          gameCount++;
          for(cell in global.board){
            global.board[cell]='';
          }
          socket.emit("gameOver", {name:name, result: result, gameCount: gameCount, XWinCount: XWinCount, OWinCount: OWinCount, tieCount: tieCount});
        }
      });
      

      socket.on("gameOver", (data) => {
        console.log(playingArr);
        const { name, board, result } = data;
        if (result !== 'tie' && result !== null) console.log(`${name} has won the game.`);
        else if (result === 'tie') console.log(`The game has resulted in a ${result}`);
        
        for (let cell in global.board) {
            global.board[cell] = '';
        }
    
        // turn = 'X'; // if you want to reset turn to X, uncomment this line
        obj = null; // Reset the obj
        playingArr = []; // Reset the playingArr
        gameEnded = false; // Reset gameEnded
    
        // Emit the gameOver event to all connected sockets
        io.emit("gameOver", { name: name, result: result, gameCount: gameCount, XWinCount: XWinCount, OWinCount: OWinCount, tieCount: tieCount });
    
        // Emit the resetGame event to reset the client-side state
        io.emit("resetGame");
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected.");
        arr = arr.filter(p => p.id !== socket.id);
        playingArr = playingArr.filter(obj => obj.p1.id !== socket.id && obj.p2.id !== socket.id);
    });
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/local.html');
});

app.get('/online-pvp', (req, res) => {
    res.sendFile(__dirname + '/views/online-pvp.html');
});

server.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
