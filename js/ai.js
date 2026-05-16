// ai.js

class GomokuAI {
  constructor(game) {
    this.game = game;
    this.maxDepth = 3; // Default medium
  }

  setDifficulty(level) {
    if (level === 'easy') this.maxDepth = 1;
    else if (level === 'medium') this.maxDepth = 2;
    else if (level === 'hard') this.maxDepth = 3;
  }

  // Get best move for current player
  async getBestMove() {
    // To not block UI completely, wrap in promise and small timeout
    return new Promise(resolve => {
      setTimeout(() => {
        const move = this.minimaxRoot(this.maxDepth, this.game.currentPlayer);
        resolve(move);
      }, 50);
    });
  }

  minimaxRoot(depth, player) {
    let bestVal = -Infinity;
    let bestMove = null;
    let alpha = -Infinity;
    let beta = Infinity;

    const candidates = this.generateMoves();
    if (candidates.length === 0) {
      // First move if board empty, play center
      return { x: 7, y: 7 };
    }

    // Sort candidates by basic evaluation to improve alpha-beta pruning
    candidates.sort((a, b) => {
      this.game.board[b.y][b.x] = player;
      let scoreB = this.evaluateBoard(player);
      this.game.board[b.y][b.x] = window.EMPTY;

      this.game.board[a.y][a.x] = player;
      let scoreA = this.evaluateBoard(player);
      this.game.board[a.y][a.x] = window.EMPTY;

      return scoreB - scoreA;
    });

    // If easy, add some randomness
    if (this.maxDepth === 1 && candidates.length > 3) {
      // shuffle top 3
      const top3 = candidates.slice(0, 3);
      top3.sort(() => Math.random() - 0.5);
      candidates.splice(0, 3, ...top3);
    }

    for (let move of candidates) {
      // Skip forbidden moves for black if checking
      // (Assuming forbidden logic handled outside or we just don't play them)
      
      this.game.board[move.y][move.x] = player;
      let val = this.minimax(depth - 1, alpha, beta, player === window.BLACK ? window.WHITE : window.BLACK, player);
      this.game.board[move.y][move.x] = window.EMPTY;

      if (val > bestVal) {
        bestVal = val;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestVal);
    }
    
    return bestMove || candidates[0];
  }

  minimax(depth, alpha, beta, currentPlayer, maximizingPlayer) {
    // Simple win check
    const opp = maximizingPlayer === window.BLACK ? window.WHITE : window.BLACK;
    const score = this.evaluateBoard(maximizingPlayer);
    
    if (Math.abs(score) > 90000) return score; // Win or lose
    if (depth === 0) return score;

    const candidates = this.generateMoves();
    if (candidates.length === 0) return 0; // Draw

    if (currentPlayer === maximizingPlayer) {
      let maxEval = -Infinity;
      for (let move of candidates) {
        this.game.board[move.y][move.x] = currentPlayer;
        let ev = this.minimax(depth - 1, alpha, beta, opp, maximizingPlayer);
        this.game.board[move.y][move.x] = window.EMPTY;
        
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let move of candidates) {
        this.game.board[move.y][move.x] = currentPlayer;
        let ev = this.minimax(depth - 1, alpha, beta, maximizingPlayer, maximizingPlayer);
        this.game.board[move.y][move.x] = window.EMPTY;
        
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  generateMoves() {
    const moves = [];
    const radius = 1; // Only check cells within 1 block of existing stones
    const visited = Array(window.BOARD_SIZE).fill(0).map(() => Array(window.BOARD_SIZE).fill(false));

    let hasStones = false;
    for (let y = 0; y < window.BOARD_SIZE; y++) {
      for (let x = 0; x < window.BOARD_SIZE; x++) {
        if (this.game.board[y][x] !== window.EMPTY) {
          hasStones = true;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              let ny = y + dy, nx = x + dx;
              if (this.game.isValidPos(nx, ny) && this.game.board[ny][nx] === window.EMPTY && !visited[ny][nx]) {
                visited[ny][nx] = true;
                moves.push({x: nx, y: ny});
              }
            }
          }
        }
      }
    }
    
    // If no stones, play center
    if (!hasStones) {
      return [{x: 7, y: 7}];
    }
    
    return moves;
  }

  evaluateBoard(player) {
    const opp = player === window.BLACK ? window.WHITE : window.BLACK;
    let playerScore = this.evaluateFor(player);
    let oppScore = this.evaluateFor(opp);
    
    return playerScore - oppScore * 1.1; // Slightly prioritize blocking opponent
  }

  evaluateFor(player) {
    let score = 0;
    const size = window.BOARD_SIZE;
    
    // Evaluate lines (horizontal, vertical, diagonals)
    // To keep it fast, we can use a simpler pattern matching approach for the whole board
    
    // Horizontal
    for (let y = 0; y < size; y++) {
      let line = "";
      for (let x = 0; x < size; x++) line += this.game.board[y][x];
      score += this.scoreLine(line, player);
    }
    // Vertical
    for (let x = 0; x < size; x++) {
      let line = "";
      for (let y = 0; y < size; y++) line += this.game.board[y][x];
      score += this.scoreLine(line, player);
    }
    // Diagonal \
    for (let d = -size + 1; d < size; d++) {
      let line = "";
      for (let x = 0; x < size; x++) {
        let y = x - d;
        if (y >= 0 && y < size) line += this.game.board[y][x];
      }
      if (line.length >= 5) score += this.scoreLine(line, player);
    }
    // Diagonal /
    for (let d = 0; d < size * 2 - 1; d++) {
      let line = "";
      for (let x = 0; x < size; x++) {
        let y = d - x;
        if (y >= 0 && y < size) line += this.game.board[y][x];
      }
      if (line.length >= 5) score += this.scoreLine(line, player);
    }

    return score;
  }

  scoreLine(lineStr, player) {
    let score = 0;
    const opp = player === window.BLACK ? window.WHITE : window.BLACK;
    
    // Convert to easier string: 1 for player, 2 for opp, 0 for empty
    let s = "";
    for(let i=0; i<lineStr.length; i++) {
        if(lineStr[i] == player) s += '1';
        else if(lineStr[i] == window.EMPTY) s += '0';
        else s += '2'; // opp
    }

    if (s.includes('11111')) return 100000;
    
    // Live 4
    if (s.includes('011110')) score += 10000;
    
    // Dead 4 or Live 3
    let dead4_or_live3_patterns = ['011112', '211110', '10111', '11011', '11101', '011100', '001110', '010110', '011010'];
    for(let p of dead4_or_live3_patterns) {
        if(s.includes(p)) score += 1000;
    }
    
    // Live 2
    let live2_patterns = ['001100', '010100', '001010'];
    for(let p of live2_patterns) {
        if(s.includes(p)) score += 100;
    }

    return score;
  }
}

window.GomokuAI = GomokuAI;
