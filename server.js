const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

let arr = [];
let playingArr = [];
let board = [
    '','','',
    '','','',
    '','',''
];
let turn = 'X';

io.on("connection", (socket) => {
    console.log("A user connected.");

    socket.on("find", (name) => {
        console.log("Searching for player: " + name);
        arr.push({ id: socket.id, name: name });
        if (arr.length >= 2) {
            const player1 = arr[0];
            const player2 = arr.find(p => p.id !== player1.id);
            if (player2) {
                let p1obj = {
                    name: player1.name,
                    value: "X",
                    move: "",
                };
                let p2obj = {
                    name: player2.name,
                    value: "O",
                    move: "",
                };
                let obj = {
                    p1: p1obj,
                    p2: p2obj,
                    sum: 1,
                };
                playingArr.push(obj);
                arr = arr.filter(p => p.id !== player1.id && p.id !== player2.id);

                io.to(player1.id).emit("playerFound", { opponent: player2.name, player: p1obj });
                io.to(player2.id).emit("playerFound", { opponent: player1.name, player: p2obj });
            }
        }
    });

    socket.on("playing", (data) => {
        console.log("Playing event received:", data);
        const { value, id, name } = data;
        let objToChange;
        if(value === turn){
            turn = (turn === 'X') ? 'O' : 'X';
            if(board[id]===''){
                console.log(`Pos ${id} has been set to ${value}.`);
                board[id] = value;
            }
            else console.log(`Pos ${id} is already taken by ${board[id]}.`);
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
            }
        }
        else console.log(`Clicked cell ${id}, but it is not ${value}'s turn.`);
    });

    socket.on("gameOver", (data) => {
        const{name, result} = data
        if(result !=='tie' && result !==null)console.log(`${name} has won the game.`);
        else if(result==='tie')console.log(`The game has resulted in a ${result}`);
        io.emit("gameOver", {name:name, result: result});
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected.");
        arr = arr.filter(p => p.id !== socket.id);
        playingArr = playingArr.filter(obj => obj.p1.id !== socket.id && obj.p2.id !== socket.id);
    });
});


app.get('/', (req, res) => {
    res.render('index', { title: "Tic Tac Toe" });
});

app.get('/online-pvp', (req, res) => {
    res.render('online-pvp');
});

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
