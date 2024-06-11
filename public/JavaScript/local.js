let firstTurn = "X";
let turn = firstTurn;
let gameMode = "PvP";
let gameCount = 0;
let XWinCount = 0;
let OWinCount = 0;
let tieCount = 0;
let timeoutID;
let gameEnded = false;
let gameState = new Array(9).fill("");
const header = document.getElementById("header");
const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // columns
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

dropdown = document.getElementById("gamemode");
dropdown.addEventListener("change", function () {
  if (dropdown.value !== gameMode) {
    gameMode = dropdown.value;
    newGame();
    console.log(
      "The game mode has been set to " +
        gameMode +
        " and a new game has been started",
    );
  } else console.log(gameMode + " has already been selected, nothing changed");
});
function selectGameMode(mode) {
  if (mode !== gameMode) {
    gameMode = mode;
    newGame();
    console.log(
      "The game mode has been set to " +
        gameMode +
        " and a new game has been started",
    );
  } else console.log(gameMode + " has already been selected, nothing changed");
}

function switchTurn() {
  if (turn === "X") turn = "O";
  else if (turn === "O") turn = "X";
  else console.log("Error");
}
function makeMove(pos, caller) {
  if (!gameEnded && gameState[pos] === "") {
    gameState[pos] = turn;
    document.getElementById(pos.toString()).innerHTML = turn;
    console.log(
      "Position " + pos + " has been set to " + turn + " by the " + caller,
    );

    if (endCheck(gameState) !== null) {
      endGame(gameState);
      clearTimeout(timeoutID); // Clears timeout in case the function is executed again before the previous timeout has expired.
      timeoutID = setTimeout(newGame, 3000);
    } else {
      switchTurn();
      header.innerHTML = "Turn: " + turn;

      if (gameMode === "PvAI" && turn === "O") {
        makeMove(bestMove(gameState), "AI");
      }
    }
  } else if (!gameEnded) {
    console.log("Position " + pos + " is already taken");
  }
}

function newGame() {
  gameEnded = false;
  for (let i = 0; i < 9; i++) {
    gameState[i] = "";
    document.getElementById(i.toString()).innerHTML = "";
  }
  /* if(firstTurn === 'X')firstTurn = 'O';
        else if (firstTurn === 'O')firstTurn = 'X';
        turn=firstTurn; */ // - alternates the first turn to make it fair when playing against a person, should be implemented to work with AI but I CBA to do it atm
  turn = "X";
  header.innerHTML = "Turn: " + turn;
}
function endCheck(board = gameState) {
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  for (let i = 0; i < 9; i++) {
    if (board[i] === "") return null;
  }
  return "tie";
}
function endGame(board = gameState) {
  let message = undefined;
  let result = endCheck(board);
  if (result === null) return;
  else {
    gameEnded = true;
    if (result === "X" || result === "O") {
      message = result + " has won the game.";
      if (result === "X")
        document.getElementById("XWins").innerHTML = (++XWinCount).toString();
      else if (result === "O")
        document.getElementById("OWins").innerHTML = (++OWinCount).toString();
      else console.log("Counter Error");
    } else if (result === "tie") {
      message = "The game has resulted in a tie.";
      document.getElementById("ties").innerHTML = (++tieCount).toString();
    }
    if (message !== undefined) {
      document.getElementById("gameCount").innerHTML = (++gameCount).toString();
      console.log(message);
      header.innerHTML = message;
    }
  }
}
let scores = {
  tie: 0,
  X: -10,
  O: 10,
};
function minimax(gameState, depth, isMaximizing) {
  let result = endCheck(gameState);
  if (result !== null) {
    //console.log(scores[result] - depth , "calculated", depth);
    return scores[result] - depth; // Adjust score by depth to prefer faster wins and slower losses
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < gameState.length; i++) {
      if (gameState[i] === "") {
        gameState[i] = "O"; // Maximizer is 'O'
        let score = minimax(gameState, depth + 1, false);
        gameState[i] = "";
        bestScore = Math.max(score, bestScore);
      }
    }
    //console.log("O maximizer", bestScore);
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < gameState.length; i++) {
      if (gameState[i] === "") {
        gameState[i] = "X"; // Minimizer is 'X'
        let score = minimax(gameState, depth + 1, true);
        gameState[i] = "";
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function bestMove(gameState) {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < gameState.length; i++) {
    if (gameState[i] === "") {
      gameState[i] = "O"; // Assume 'O' is the AI
      let score = minimax(gameState, 0, false);
      gameState[i] = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}
