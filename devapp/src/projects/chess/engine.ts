import ChessBoard, { CandidateMove, Color } from "./board";

const MAX_DEPTH = 10
const TIMEOUT_MS = 500

interface ScoredMove {
    move: CandidateMove | null
    score: number
}



export default class Engine {

    _maximizingPlayer: Color = 'white'
    _timer: number = 0
    _movesExplored = 0
    _branchesPruned = 0
    _cancellation = 0
    _isCancelled() {
      return Date.now() > this._cancellation
    }

    findOptimalMove(board: ChessBoard, color: Color, depth: number) {
      this._maximizingPlayer = color;
      const legalMoves = board.getAllLegalMoves(color);
      let bestMove: CandidateMove | null = null;
      let bestEval = Number.NEGATIVE_INFINITY;
      for (const move of legalMoves) {
        if (this._isCancelled()) break
        board.applyMove(move.from, move.to);
        const score = this.minimax(board, board.flipColor(color), depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
        board.undoMove()
        if (score > bestEval) {
          bestEval = score;
          bestMove = move;
        }
        if (score >= Number.POSITIVE_INFINITY) {
          break
        }
      }
      return { move: bestMove, score: bestEval };
    }

    findDeepeningOptimalMove(board: ChessBoard, color: Color, timeoutMs = TIMEOUT_MS): ScoredMove {
        this._movesExplored = 0
        this._branchesPruned = 0
        this._cancellation = Date.now() + timeoutMs
        this._timer = Date.now()
        this._maximizingPlayer = color;
        let bestMove: CandidateMove | null = null;
        let bestEval = Number.NEGATIVE_INFINITY;
        let depth = 1;
        for(; depth < MAX_DEPTH; depth++) {
          if (this._isCancelled()) break
          const optimalMove = this.findOptimalMove(board, color, depth)
          const score = optimalMove.score
          const move = optimalMove.move
          if (score > bestEval) {
            bestEval = score;
            bestMove = move;
          }
          if (score >= Number.POSITIVE_INFINITY) {
            break
          }
        }
        
        this.printMetrics(depth, bestEval)
      
        return { move: bestMove, score: bestEval };
    }

    printMetrics(depth: number, score: number) {
      console.log('#### metrics ####')
      console.log(`time: ${Date.now() - this._timer}`)
      console.log(`max depth: ${depth}`)
      console.log(`moves explored: ${this._movesExplored}`)
      console.log(`branches pruned: ${this._branchesPruned} (${(this._branchesPruned / (this._branchesPruned + this._movesExplored) * 100.0).toFixed(2)}%)`)
      console.log(`score: ${score}`)
      console.log('#################')
    }

    minimax(board: ChessBoard, color: Color, depth: number, alpha: number, beta: number) {
        if (depth === 0) {
            const score = this.calculateScore(board, this._maximizingPlayer)
            if (score > 10_000) {
              board.print()
            }
            return score
        }

        const legalMoves = board.getAllLegalMoves(color);
        const isMaximizingPlayer = this._maximizingPlayer === color
        if (isMaximizingPlayer) {
          let maxEval = Number.NEGATIVE_INFINITY;
          for (const move of legalMoves) {
            if (this._isCancelled()) break;
            board.applyMove(move.from, move.to);
            const score = this.minimax(board, board.flipColor(this._maximizingPlayer), depth - 1, alpha, beta);
            board.undoMove()
            maxEval = Math.max(maxEval, score);    
            if (maxEval >= beta) {
              this._branchesPruned++
              break; // Beta cut-off
            }
            alpha = Math.max(alpha, maxEval);
            this._movesExplored++
          }
          return maxEval;
        } else {
          let minEval = Number.POSITIVE_INFINITY;
          for (const move of legalMoves) {
            if (this._isCancelled()) break;
            board.applyMove(move.from, move.to);
            const score = this.minimax(board, this._maximizingPlayer, depth - 1, alpha, beta);
            board.undoMove()
            minEval = Math.min(minEval, score);
            if (minEval <= alpha) {
              this._branchesPruned++
              break; // Alpha cut-off
            }
            beta = Math.min(beta, minEval);
            this._movesExplored++
          }
          return minEval;
        }
    }

    calculateScore(board: ChessBoard, color: Color) {
        return this.calculateScoreOfColor(board, color) - this.calculateScoreOfColor(board, board.flipColor(color))
    }

    calculateScoreOfColor(board: ChessBoard, color: Color) {
        let score = 0
        score += (board._positionScore[color] * 0.1)
        score += this.calculatePiecesScore(board, color)

        return score
    }

    calculatePiecesScore(board: ChessBoard, color: Color) {
        let score = 0
        score += board._material[color]['P'] * 1
        score += board._material[color]['N'] * 3
        score += board._material[color]['B'] * 3
        score += board._material[color]['R'] * 5
        score += board._material[color]['Q'] * 9
        return score
    }
}