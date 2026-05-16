// main.js

document.addEventListener('DOMContentLoaded', () => {
  const game = new window.GomokuGame();
  const ui = new window.GomokuUI(game, 'board-canvas');
  const ai = new window.GomokuAI(game);

  // Settings
  let gameMode = 'pve'; // pve or pvp
  let aiDifficulty = 'medium';
  let checkForbidden = true;

  // DOM Elements
  const menuView = document.getElementById('menu-view');
  const gameView = document.getElementById('game-view');
  const gameOverModal = document.getElementById('game-over-modal');
  const turnIndicator = document.getElementById('current-turn');
  const turnText = document.getElementById('turn-text');
  const winnerText = document.getElementById('winner-text');

  // Set up event listeners for menu
  document.querySelectorAll('#mode-toggle .toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#mode-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      gameMode = e.target.dataset.value;
      
      const diffSetting = document.getElementById('difficulty-setting');
      if (gameMode === 'pvp') {
        diffSetting.style.display = 'none';
      } else {
        diffSetting.style.display = 'flex';
      }
    });
  });

  document.querySelectorAll('#difficulty-toggle .toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#difficulty-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      aiDifficulty = e.target.dataset.value;
    });
  });

  const forbiddenToggle = document.getElementById('forbidden-toggle');
  forbiddenToggle.addEventListener('change', (e) => {
    checkForbidden = e.target.checked;
  });

  document.getElementById('start-btn').addEventListener('click', () => {
    startGame();
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    showMenu();
  });

  document.getElementById('restart-btn').addEventListener('click', () => {
    startGame();
  });

  document.getElementById('modal-restart-btn').addEventListener('click', () => {
    hideModal();
    startGame();
  });

  document.getElementById('modal-menu-btn').addEventListener('click', () => {
    hideModal();
    showMenu();
  });

  // Handle board clicks
  ui.canvas.addEventListener('click', handleInput);
  ui.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    handleInput(e);
  }, { passive: false });

  let isProcessing = false;

  async function handleInput(e) {
    if (game.gameOver || isProcessing) return;

    // In PvE, ignore input if it's White's (AI's) turn
    if (gameMode === 'pve' && game.currentPlayer === window.WHITE) return;

    const coords = ui.getCoordinates(e);
    if (!game.isValidPos(coords.x, coords.y) || game.board[coords.y][coords.x] !== window.EMPTY) return;

    const result = game.play(coords.x, coords.y, checkForbidden);

    if (result === 'forbidden') {
      ui.drawForbiddenMark(coords.x, coords.y);
      return;
    }

    if (result) {
      ui.drawBoard();
      updateTurnUI();

      if (game.gameOver) {
        showGameOver();
        return;
      }

      if (gameMode === 'pve') {
        isProcessing = true;
        // Small delay for UI update before AI starts computing
        setTimeout(async () => {
          const move = await ai.getBestMove();
          game.play(move.x, move.y, false); // AI doesn't have forbidden moves
          ui.drawBoard();
          updateTurnUI();
          isProcessing = false;

          if (game.gameOver) {
            showGameOver();
          }
        }, 100);
      }
    }
  }

  function startGame() {
    game.reset();
    ai.setDifficulty(aiDifficulty);
    ui.drawBoard();
    updateTurnUI();
    hideModal();

    menuView.classList.remove('active');
    gameView.classList.add('active');
    isProcessing = false;
  }

  function showMenu() {
    gameView.classList.remove('active');
    menuView.classList.add('active');
  }

  function updateTurnUI() {
    turnIndicator.className = 'turn-indicator ' + (game.currentPlayer === window.BLACK ? 'black' : 'white');
    turnText.innerText = (game.currentPlayer === window.BLACK ? "Black" : "White") + "'s Turn";
  }

  function showGameOver() {
    winnerText.innerText = (game.winner === window.BLACK ? "Black" : "White") + " Wins!";
    gameOverModal.classList.remove('hidden');
  }

  function hideModal() {
    gameOverModal.classList.add('hidden');
  }

  // Initial draw
  ui.drawBoard();
});
