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
                    p1name: player1.name,
                    p1value: "X",
                    p1move: "",
                };
                const p2obj = {
                    p2name: player2.name,
                    p2value: "O",
                    p2move: "",
                };
                const obj = {
                    p1: p1obj,
                    p2: p2obj
                };
                playingArr.push(obj);
                arr = arr.filter(p => p.id !== player1.id && p.id !== player2.id); // Remove matched players from the array

                io.to(player1.id).emit("playerFound", { opponent: player2.name, player: p1obj });
                io.to(player2.id).emit("playerFound", { opponent: player1.name, player: p2obj });
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected.");
        arr = arr.filter(p => p.id !== socket.id); // Remove disconnected player from the array
    });
});

let firstTurn = 'X';
let turn = firstTurn;
let gameMode = 'PvP';
let gameCount = 0;
let XWinCount = 0;
let OWinCount = 0;
let tieCount = 0;
let timeoutID;
let gameEnded = false;
let gameState = new Array(9).fill('');
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
];

function selectGameMode(mode) {
    if (mode !== gameMode) {
        gameMode = mode;
        newGame();
        console.log('The game mode has been set to ' + gameMode + ' and a new game has been started');
        return `console.log('The game mode has been set to ' + ${gameMode} + ' and a new game has been started');`;
    } else {
        console.log(gameMode + ' has already been selected, nothing changed');
        return `console.log(${gameMode} + ' has already been selected, nothing changed');`;
    }
}

function switchTurn() {
    if (turn === 'X') turn = 'O';
    else if (turn === 'O') turn = 'X';
    else console.log('Error');
}

function makeMove(pos, caller) {
    let returnStatement = ``;
    if (!gameEnded && gameState[pos] === '') {
        gameState[pos] = turn;
        returnStatement += `document.getElementById(${pos}.toString()).innerHTML = ${turn};`;
        console.log('Square ' + (pos + 1) + ' has been set to ' + turn + ' by the ' + caller);
        returnStatement += `console.log('Square ' + ${pos} + ' has been set to ' + ${turn} + ' by the ' + ${caller});`;
        if (endCheck(gameState) !== null) {
            endGame(gameState);
            clearTimeout(timeoutID); // Clears timeout in case the function is executed again before the previous timeout has expired.
            timeoutID = setTimeout(newGame, 3000);
        } else {
            switchTurn();
            returnStatement += `document.getElementById('header').innerHTML = 'Turn: ' + ${turn}`;
        }
    } else if (!gameEnded) {
        console.log('Position ' + pos + ' is already taken');
        returnStatement += `console.log('Position ' + ${pos} + ' is already taken');`;
    }
    return returnStatement;
}

function newGame() {
    let returnStatement = ``;
    gameEnded = false;
    for (let i = 0; i < 9; i++) {
        gameState[i] = '';
        returnStatement += `document.getElementById((i + 1).toString()).innerHTML = '';`;
    }
    if (firstTurn === 'X') firstTurn = 'O';
    else if (firstTurn === 'O') firstTurn = 'X';
    turn = firstTurn; // - alternates the first turn to make it fair when playing against a person, should be implemented to work with AI but I CBA to do it atm
    turn = 'X';
    returnStatement += `document.getElementById('header').innerHTML = 'Turn: ' + ${turn};`;
    return returnStatement;
}

function endCheck(board = gameState) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') return null;
    }
    return 'tie';
}

function endGame(board = gameState) {
    let returnStatement = ``;
    let message = undefined;
    let result = endCheck(board);
    if (result === null) return;
    else {
        gameEnded = true;
        if (result === 'X' || result === 'O') {
            message = result + ' has won the game.'
            if (result === 'X') returnStatement += `document.getElementById('${XWins}').innerHTML = ('X wins: ' + ${(++XWinCount).toString()});`;
            else if (result === 'O') returnStatement += `document.getElementById('OWins').innerHTML = ('O wins: ' + ${(++OWinCount).toString()});`;
            else console.log('Counter Error');
        } else if (result === 'tie') {
            message = 'The game has resulted in a tie.';
            returnStatement += `document.getElementById('ties').innerHTML = ('Ties: ' + ${(++tieCount).toString()});`;
        }
        if (message !== undefined) {
            returnStatement += `document.getElementById('gameCount').innerHTML = ('Games: ' + ${(++gameCount).toString()});`;
            console.log(message);
            returnStatement += `document.getElementById('header').innerHTML = (${message});`;
        }
    }
    return returnStatement;
}

let scores = {
    'X': 1,
    'tie': 0,
    'O': -1
}

function bestMove(gameState) {
    let bestScore = Infinity;
    let move = null;
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === '') {
            gameState[i] = turn;
            let score = minimax(gameState, 0, false);
            gameState[i] = '';
            if (score < bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(gameState, depth, isMaximizing) {
    let copyOfGameState = Array.from(gameState);

    let result = endCheck(copyOfGameState);
    if (result !== null) {
        return scores[result];
    }
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < copyOfGameState.length; i++) {
            if (copyOfGameState[i] === '') {
                copyOfGameState[i] = 'X';
                let score = minimax(copyOfGameState, depth + 1, false);
                copyOfGameState[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < copyOfGameState.length; i++) {
            if (copyOfGameState[i] === '') {
                copyOfGameState[i] = 'O';
                let score = minimax(copyOfGameState, depth + 1, true);
                copyOfGameState[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

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
