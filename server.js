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

io.on("connection", (socket) => {
    console.log("A user connected.");

    socket.on("find", (name) => {
        console.log("Searching for player: " + name);
        arr.push({ id: socket.id, name: name }); // Store player's socket id with their name
        if (arr.length >= 2) {
            const player1 = arr[0];
            const player2 = arr.find(p => p.id !== player1.id); // Find a player who is not player1
            if (player2) {
                const p1obj = {
                    name: player1.name,
                    value: "X",
                    move: "",
                };
                const p2obj = {
                    name: player2.name,
                    value: "O",
                    move: "",
                };
                const obj = {
                    p1: p1obj,
                    p2: p2obj,
                    sum: 1,
                };
                playingArr.push(obj);
                arr = arr.filter(p => p.id !== player1.id && p.id !== player2.id); // Remove matched players from the array

                io.to(player1.id).emit("playerFound", { opponent: player2.name, player: p1obj });
                io.to(player2.id).emit("playerFound", { opponent: player1.name, player: p2obj });
            }
        }
        socket.on("playing", (e) => {
            if(e.value=="X"){
                let objToChange = playingArr.find(obj=>obj.p1.name===e.name);

                objToChange.p1.move = e.id;
                objToChange.sum++;
            }
            else if(e.value=="O"){
                let objToChange = playingArr.find(obj=>obj.p2.name===e.name);

                objToChange.p2.move = e.id;
                objToChange.sum++;
                
            }

            io.emit("playing", {allPlayers:playingArr});
        });
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected.");
        arr = arr.filter(p => p.id !== socket.id); // Remove disconnected player from the array
    });
});

app.get('/', (req, res) => {
    res.render('index', { title: "Tic Tac Toe" });
});

app.get('/online-pvp', (req, res) => {
	res.render('online-pvp');
});

app.post('/makeMove', (req, res) => {
    const { pos, caller } = req.body;
    let scriptToRun = makeMove(pos, caller);
    res.json({ scriptToRun });
});

app.post('/newGame', (req, res) => {
    let scriptToRun = newGame();
    res.json({ scriptToRun });
});

app.post('/selectGameMode', (req, res) => {
    const { mode } = req.body;
    let scriptToRun = selectGameMode(mode);
    res.json({ scriptToRun });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
