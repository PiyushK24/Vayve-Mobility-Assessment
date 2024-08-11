document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll(".cell");
  const restartButton = document.getElementById("restart");
  const exitButton = document.getElementById("exit");
  const resultDisplay = document.getElementById("result");
  const leaderboardList = document.getElementById("leaderboard-list");
  const setupDiv = document.getElementById("setup");
  const gameDiv = document.getElementById("game");
  const usernameInput = document.getElementById("usernameInput");
  const chooseXButton = document.getElementById("chooseX");
  const chooseOButton = document.getElementById("chooseO");

  let userSymbol = null;
  let aiSymbol = null;
  let gameActive = false;
  let board = Array(9).fill(null);
  let userId = null;
  let username = "";

  // Handle symbol choice
  chooseXButton.addEventListener("click", () => startGame("X"));
  chooseOButton.addEventListener("click", () => startGame("O"));

  function startGame(symbol) {
    username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter your name.");
      return;
    }

    userSymbol = symbol;
    aiSymbol = userSymbol === "X" ? "O" : "X";

    // Register or update user
    fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
        } else {
          userId = data.userId;
          setupDiv.classList.add("hidden");
          gameDiv.classList.remove("hidden");
          gameActive = true;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

// Handle cell clicks
cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (!board[index] && gameActive && userId) {
      console.log(`Cell ${index} clicked. User Symbol: ${userSymbol}`);
      board[index] = userSymbol;
      cell.textContent = userSymbol;
      cell.classList.add(userSymbol.toLowerCase());
      console.log(`Cell ${index} updated to ${userSymbol}`);
      checkGameResult();
      if (gameActive) {
        aiMove();
        checkGameResult();
      }
    }
  });
});


  restartButton.addEventListener("click", resetGame);
  exitButton.addEventListener("click", exitGame);

  function checkGameResult() {
    const winner = checkWinner(board);
    if (winner) {
      let winnerText = "";
      if (winner === userSymbol) {
        winnerText = `${username} won '${userSymbol}'`;
      } else if (winner === aiSymbol) {
        winnerText = `AI won '${aiSymbol}'`;
      }
      resultDisplay.textContent = winnerText;
      updateStats(winner);
      gameActive = false;
      return;
    }
    if (board.every((cell) => cell !== null)) {
      resultDisplay.textContent = "It's a draw!";
      updateStats(null);
      gameActive = false;
    }
  }
  
  
  function aiMove() {
    const emptyIndices = board
      .map((value, index) => (value === null ? index : null))
      .filter((value) => value !== null);
    if (emptyIndices.length > 0) {
      const aiIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      board[aiIndex] = aiSymbol;
      cells[aiIndex].textContent = aiSymbol;
      cells[aiIndex].classList.add(aiSymbol.toLowerCase());
      console.log(`AI moved to cell ${aiIndex} with symbol ${aiSymbol}`);
    }
  }

  function checkWinner(board) {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  function updateStats(winner) {
    if (userId === null) return;

    let result;
    if (winner === userSymbol) {
      result = 'win';
    } else if (winner === aiSymbol) {
      result = 'loss';
    } else if (board.every((cell) => cell !== null)) {
      result = 'draw';
    } else {
      result = 'pending'; // If the game is still ongoing
    }

    fetch("/api/play", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, board, userSymbol, aiSymbol, result }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
        }
        loadLeaderboard(); // Reload leaderboard after updating stats
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function loadLeaderboard() {
    fetch('/api/leaderboard')
      .then(response => response.json())
      .then(data => {
        if (data.leaderboard) { // Ensure data contains leaderboard
          leaderboardList.innerHTML = ''; // Clear previous data
          data.leaderboard.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${player.username}</td>
              <td>${player.matches_played}</td>
              <td>${player.wins}</td>
              <td>${player.draws}</td>
              <td>${player.losses}</td>
            `;
            leaderboardList.appendChild(row);
          });
        } else {
          console.error('Unexpected data format:', data);
        }
      })
      .catch(error => console.error('Error fetching leaderboard:', error));
  }
  loadLeaderboard();

  function resetGame() {
    board = Array(9).fill(null);
    cells.forEach((cell) => {
      cell.textContent = "";
      cell.classList.remove("x", "o");
    });
    resultDisplay.textContent = "";
    gameActive = true;
  }

  function exitGame() {
    gameActive = false;
    setupDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
    usernameInput.value = "";
    userId = null;
    resetGame();
  }
});
