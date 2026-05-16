// ui.js

class GomokuUI {
  constructor(game, canvasId) {
    this.game = game;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.boardSize = window.BOARD_SIZE;
    
    // Will be calculated on resize
    this.cellSize = 0;
    this.padding = 0;

    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());
  }

  setupCanvas() {
    // Get container dimensions
    const container = this.canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight) - 20; // 20px padding
    
    // High DPI screens
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    this.ctx.scale(dpr, dpr);
    
    this.padding = size * 0.05; // 5% padding
    this.cellSize = (size - 2 * this.padding) / (this.boardSize - 1);
    
    this.drawBoard();
  }

  drawBoard() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#8b5a2b';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.boardSize; i++) {
      // Vertical lines
      this.ctx.moveTo(this.padding + i * this.cellSize, this.padding);
      this.ctx.lineTo(this.padding + i * this.cellSize, this.padding + (this.boardSize - 1) * this.cellSize);
      // Horizontal lines
      this.ctx.moveTo(this.padding, this.padding + i * this.cellSize);
      this.ctx.lineTo(this.padding + (this.boardSize - 1) * this.cellSize, this.padding + i * this.cellSize);
    }
    this.ctx.stroke();

    // Draw star points (Tengen and Hoshi)
    const stars = [
      [3, 3], [11, 3], [3, 11], [11, 11], [7, 7]
    ];
    this.ctx.fillStyle = '#8b5a2b';
    for (let [x, y] of stars) {
      this.ctx.beginPath();
      this.ctx.arc(this.padding + x * this.cellSize, this.padding + y * this.cellSize, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw stones
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (this.game.board[y][x] !== window.EMPTY) {
          this.drawStone(x, y, this.game.board[y][x]);
        }
      }
    }

    // Highlight last move
    if (this.game.history.length > 0) {
      const lastMove = this.game.history[this.game.history.length - 1];
      this.drawHighlight(lastMove.x, lastMove.y);
    }
  }

  drawStone(x, y, player) {
    const cx = this.padding + x * this.cellSize;
    const cy = this.padding + y * this.cellSize;
    const radius = this.cellSize * 0.45;

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    
    // 3D effect gradient
    const gradient = this.ctx.createRadialGradient(
      cx - radius * 0.3, cy - radius * 0.3, radius * 0.1,
      cx, cy, radius
    );

    if (player === window.BLACK) {
      gradient.addColorStop(0, '#666');
      gradient.addColorStop(1, '#000');
    } else {
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, '#ccc');
    }

    this.ctx.fillStyle = gradient;
    
    // Shadow
    this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fill();
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  drawHighlight(x, y) {
    const cx = this.padding + x * this.cellSize;
    const cy = this.padding + y * this.cellSize;
    
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, this.cellSize * 0.15, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    this.ctx.fill();
  }

  drawForbiddenMark(x, y) {
    const cx = this.padding + x * this.cellSize;
    const cy = this.padding + y * this.cellSize;
    const r = this.cellSize * 0.3;

    this.ctx.beginPath();
    this.ctx.strokeStyle = 'red';
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(cx - r, cy - r);
    this.ctx.lineTo(cx + r, cy + r);
    this.ctx.moveTo(cx + r, cy - r);
    this.ctx.lineTo(cx - r, cy + r);
    this.ctx.stroke();

    // Clear after 1 second
    setTimeout(() => {
      this.drawBoard();
    }, 1000);
  }

  getCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const boardX = Math.round((x - this.padding) / this.cellSize);
    const boardY = Math.round((y - this.padding) / this.cellSize);

    return { x: boardX, y: boardY };
  }
}

window.GomokuUI = GomokuUI;
