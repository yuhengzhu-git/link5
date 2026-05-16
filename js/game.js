// game.js
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

class GomokuGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
    this.currentPlayer = BLACK;
    this.gameOver = false;
    this.winner = null;
    this.history = [];
  }

  // Returns true if move is valid and played
  play(x, y, checkForbiddenMoves = false) {
    if (this.gameOver || !this.isValidPos(x, y) || this.board[y][x] !== EMPTY) {
      return false;
    }

    if (checkForbiddenMoves && this.currentPlayer === BLACK) {
      if (this.isForbidden(x, y)) {
        return 'forbidden';
      }
    }

    this.board[y][x] = this.currentPlayer;
    this.history.push({ x, y, player: this.currentPlayer });

    if (this.checkWin(x, y, this.currentPlayer)) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
    } else {
      this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
    }

    return true;
  }

  undo() {
    if (this.history.length === 0) return;
    const lastMove = this.history.pop();
    this.board[lastMove.y][lastMove.x] = EMPTY;
    this.currentPlayer = lastMove.player;
    this.gameOver = false;
    this.winner = null;
  }

  isValidPos(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
  }

  // Check if player won after placing at (x,y)
  checkWin(x, y, player) {
    const dirs = [
      [[1, 0], [-1, 0]],   // Horizontal
      [[0, 1], [0, -1]],   // Vertical
      [[1, 1], [-1, -1]],  // Diagonal \
      [[1, -1], [-1, 1]]   // Diagonal /
    ];

    for (let dirPair of dirs) {
      let count = 1;
      for (let dir of dirPair) {
        let nx = x + dir[0];
        let ny = y + dir[1];
        while (this.isValidPos(nx, ny) && this.board[ny][nx] === player) {
          count++;
          nx += dir[0];
          ny += dir[1];
        }
      }
      // Standard win is exactly 5 or more
      if (count >= 5) {
        // If exact 5 or if player is WHITE (WHITE can win with >5). 
        // For BLACK, >5 might be an overline (which is forbidden, but if forbidden rules are off, it's a win).
        return true;
      }
    }
    return false;
  }

  // Advanced: Forbidden move detection (simplified)
  // Only applies to Black.
  isForbidden(x, y) {
    // Temporarily place black stone
    this.board[y][x] = BLACK;
    
    let overlines = 0;
    let fours = 0;
    let liveThrees = 0;

    const dirs = [
      [1, 0], [0, 1], [1, 1], [1, -1] // 4 main directions
    ];

    for (let dir of dirs) {
      const pattern = this.getLinePattern(x, y, dir[0], dir[1]);
      const analysis = this.analyzePattern(pattern);
      
      if (analysis.length > 5) overlines++;
      if (analysis.fours > 0) fours += analysis.fours;
      if (analysis.liveThrees > 0) liveThrees += analysis.liveThrees;
    }

    // Remove temporary stone
    this.board[y][x] = EMPTY;

    if (overlines > 0) return true; // 长连
    if (fours >= 2) return true;    // 四四
    if (liveThrees >= 2) return true; // 三三

    return false;
  }

  // Get a string representation of the line around (x,y)
  getLinePattern(x, y, dx, dy) {
    let pattern = "";
    // Go backward 5 steps, then forward 5 steps
    for (let i = -5; i <= 5; i++) {
      let nx = x + i * dx;
      let ny = y + i * dy;
      if (!this.isValidPos(nx, ny)) {
        pattern += "x"; // Wall
      } else {
        const val = this.board[ny][nx];
        if (val === EMPTY) pattern += "0";
        else if (val === BLACK) pattern += "1";
        else pattern += "2"; // White
      }
    }
    return pattern;
  }

  analyzePattern(pattern) {
    // The stone was placed at index 5 in the string "pattern" (since -5 to 5 is 11 chars, index 5 is center)
    // We count contiguous '1's around the center
    
    // Check overline (length of contiguous 1s)
    let left = 5;
    while(left >= 0 && pattern[left] === '1') left--;
    let right = 5;
    while(right < 11 && pattern[right] === '1') right++;
    const contigLength = right - left - 1;
    
    // Very simplified heuristic for fours and threes to avoid huge regexes
    let fours = 0;
    let liveThrees = 0;

    // Check string patterns
    // Live four: 011110
    if (pattern.includes('011110')) fours++;
    // Dead four (冲四): x11110, 01111x, 211110, 011112, 10111, 11011, 11101
    // Simplification: just count if there's a 4 that isn't a live four, but can form a 5.
    
    // We will use regex for matching Gomoku patterns (Black is 1, Empty is 0, Wall/White is something else)
    const p = pattern.replace(/[x2]/g, '2'); // Treat walls and white same as boundaries
    
    // Find all '1111'
    if (p.includes('011112') || p.includes('211110') || p.includes('10111') || p.includes('11011') || p.includes('11101')) {
      fours++;
    }

    // Live three: 001110, 011100, 010110, 011010
    if (p.includes('001110') || p.includes('011100') || p.includes('010110') || p.includes('011010')) {
      liveThrees++;
    }

    return { length: contigLength, fours, liveThrees };
  }
}

window.GomokuGame = GomokuGame;
window.BOARD_SIZE = BOARD_SIZE;
window.EMPTY = EMPTY;
window.BLACK = BLACK;
window.WHITE = WHITE;
