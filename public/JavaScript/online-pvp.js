const socket = io();

document.getElementById("loading").style.display = "none";
document.getElementById("board").style.display = "none";
document.getElementById("userContainer").style.display = "none";
document.getElementById("oppContainer").style.display = "none";
document.getElementById("valueContainer").style.display = "none";
document.getElementById("whosTurn").style.display = "none";
document.getElementById("info-box").style.display = "none";

let name;
let playerSymbol;
let turn = "X";
let gameEnded = false;

document.getElementById("find").addEventListener("click", function () {
  name = document.getElementById("name").value;
  document.getElementById("user").innerHTML = name;

  if (name === null || name === "") {
    alert("Please enter a name!");
  } else {
    socket.emit("find", name);
    document.getElementById("loading").style.display = "block";
  }
});

socket.on("playerFound", (data) => {
  const opponent = data.opponent;
  playerSymbol = data.player.value;
  document.getElementById("userContainer").style.display = "block";
  document.getElementById("oppContainer").style.display = "block";
  document.getElementById("valueContainer").style.display = "block";
  document.getElementById("loading").style.display = "none";
  document.getElementById("name").style.display = "none";
  document.getElementById("find").style.display = "none";
  document.getElementById("enterName").style.display = "none";
  document.getElementById("board").style.display = "grid";
  document.getElementById("whosTurn").style.display = "block";
  document.getElementById("info-box").style.display = "block";
  document.getElementById("turn").innerText = "X";
  document.getElementById("opponent").innerText = opponent;
  document.getElementById("value").innerText = playerSymbol;

  document.querySelectorAll(".cell").forEach((cell) => {
    cell.addEventListener("click", function () {
      const id = this.id;
      console.log(
        `Clicked cell with id "${id}" and playerSymbol "${playerSymbol}"`,
      );
      socket.emit("playing", { value: playerSymbol, id: id, name: name });
    });
  });
});

socket.on("playing", (data) => {
  console.log("Playing event data received:", data);
  const foundObject = data.find(
    (obj) => obj.p1.name === name || obj.p2.name === name,
  );
  if (!foundObject) {
    console.log("Object not found when attempting to make move.");
    return;
  }
  const p1id = foundObject.p1.move;
  const p2id = foundObject.p2.move;

  document.getElementById("turn").innerText =
    foundObject.sum % 2 === 0 ? "O" : "X";

  if (p1id) {
    document.getElementById(p1id).innerText = "X";
    document.getElementById(p1id).style.pointerEvents = "none";
  }
  if (p2id) {
    document.getElementById(p2id).innerText = "O";
    document.getElementById(p2id).style.pointerEvents = "none";
  }
  if (!gameEnded) {
    endCheck(name, foundObject.sum);
  }
});

function endCheck(name, sum) {
  board = Array.from(
    { length: 9 },
    (_, i) => document.getElementById(i.toString()).innerText || "",
  );
  socket.emit("endCheck", { name, board, sum });
}

socket.on("gameOver", (data) => {
  const { name, result, gameCount, XWinCount, OWinCount, tieCount } = data;
  if (result) {
    let message;
    if (result === "X" || result === "O") {
      message = `Player ${name}, playing as ${result} has won the game.`;
    } else if (result === "tie") {
      message = `The game has resulted in a ${result}`;
    } else message = "gameOver called with no result given.";
    document.getElementById("gameCount").innerText = `${gameCount}`;
    document.getElementById("XWins").innerText = `${XWinCount}`;
    document.getElementById("OWins").innerText = `${OWinCount}`;
    document.getElementById("ties").innerText = `${tieCount}`;
    if (result !== null) {
      gameEnded = true;
      let temp = document.getElementById("whosTurn").innerText;
      document.getElementById("whosTurn").innerText = message;
      console.log(message);
      let timeoutID = setTimeout(() => {
        gameEnded = false;
        for (let i = 0; i < 9; i++) {
          board[i] = "";
        }
        document.querySelectorAll(".cell").forEach((cell) => {
          cell.innerText = "";
          cell.style.pointerEvents = "auto";
          document.getElementById("whosTurn").innerText = temp;
        });
      }, 3000);
    }
  }
});

socket.on("resetGame", () => {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.innerText = "";
    cell.style.pointerEvents = "auto";
  });
  document.getElementById("turn").innerText = "X";
  gameEnded = false;
});
