import ChessBoard from "./board";
import { Color, PromotablePiece } from './models/Piece';
import { calculateScoreDelta, calculateOverallScoreDelta } from "./logic/scoring-heuristics/scoring";
import { getAllLegalMoves, CandidateMove } from "./logic/move-generation/moves";

const TIMEOUT_MS = 500;

interface ScoredMove {
    move: CandidateMove | null;
    score: number;
}

const enableAlphaBetaPruning = true;
const promotionMoves: PromotablePiece[] = ['N', 'B', 'R', 'Q']

export default class Engine {

    _maximizingPlayer: Color = 'white';
    _timer: number = 0;
    _exploredPaths = 0;
    _prunedNodes = 0;
    _cancellation = 0;
    _timeoutMs = 0;
    _isCancelled() {
      return Date.now() > this._cancellation;
    }

    findDeepeningOptimalMove(
      board: ChessBoard,
      color: Color,
      timeoutMs = TIMEOUT_MS
  ): ScoredMove {
      this._exploredPaths = 0;
      const { move, score } = this.findBestMove(board, color, 2)
      this.printMetrics(4, score);
      return { move, score };
  }

  findBestMove(board: ChessBoard, color: Color, depth: number) {
    const moves = getAllLegalMoves(board, color)
    let bestMove: CandidateMove = moves[0]
    let bestScore = color === 'white' ? -Infinity : Infinity
    for(const move of moves) {
      board.applyMove(move.from, move.to)
      if (board.isCheckmate()) {
        board.undoMove()
        return { move, score: color === 'white' ? Infinity : -Infinity }
      }
      const score = this.minimax(board, board.flipColor(color), depth, 0, 0)
      board.undoMove()
      if ((color === 'white' && score > bestScore) 
        || (color === 'black' && score < bestScore)) {
        bestScore = score
        bestMove = move
      }
    }
    return { move: bestMove, score: bestScore }
  }

    printMetrics(depth: number, score: number) {
      console.log('#### metrics ####');
      console.log(`time: ${Date.now() - this._timer}`);
      console.log(`max depth: ${depth}`);
      console.log(`moves explored: ${this._exploredPaths}`);
      console.log(`branches pruned: ${this._prunedNodes} (${(this._prunedNodes / (this._prunedNodes + this._exploredPaths) * 100.0).toFixed(2)}%)`);
      console.log(`score: ${score}`);
      console.log('#################');
    }

    minimax(board: ChessBoard, color: Color, depth: number, alpha: number, beta: number): number {
      if (depth === 0) {
        this._exploredPaths++;
        return calculateOverallScoreDelta(board)
      }
      
      const moves = getAllLegalMoves(board, color)
      if (color === 'white') {
        let bestScore = -Infinity
        for(const move of moves) {
          const moveResult = board.applyMove(move.from, move.to)
          if (moveResult.isPromotion) {
            const scores = this.explorePromotions(move.to, board, color, depth, alpha, beta)
            for(const s of scores) {
              if (s > bestScore) bestScore = s
            }
          }
          if (board.isCheckmate()) {
            board.undoMove()
            return Infinity
          }
          const score = this.minimax(board, board.flipColor(color), depth - 1, alpha, beta)
          if (score > bestScore) {
            bestScore = score
          }
          board.undoMove()
        }
        return bestScore
      } else {
        let bestScore = Infinity
        for(const move of moves) {
          const moveResult = board.applyMove(move.from, move.to)
          if (moveResult.isPromotion) {
            const scores = this.explorePromotions(move.to, board, color, depth, alpha, beta)
            for(const s of scores) {
              if (s < bestScore) bestScore = s
            }
          }
          if (board.isCheckmate()) {
            board.undoMove()
            return -Infinity
          }
          const score = this.minimax(board, board.flipColor(color), depth - 1, alpha, beta)
          if (score < bestScore) {
            bestScore = score
          }
          board.undoMove()
        }
        return bestScore
      }
  }

  explorePromotions(to: number, board: ChessBoard, color: Color, depth: number, alpha: number, beta: number) {
    const scores: number[] = []
    for(const move of promotionMoves) {
      board.applyPromotion(to, move)
      const score = this.minimax(board, board.flipColor(color), depth - 1, alpha, beta)
      scores.push(score)
    }
    return scores;
  }

    quiescenceSearch(board: ChessBoard, color: Color, alpha: number, beta: number): number {
      let standPat = calculateScoreDelta(color, board); // Current evaluation
      if (standPat >= beta) return beta; // Cut off search
      alpha = Math.max(alpha, standPat);

      let captureMoves = getAllLegalMoves(board, color).filter(move => move.isCapture); // Only captures
      for (let move of captureMoves) {
          board.applyMove(move.from, move.to);
          let score = -this.quiescenceSearch(board, color === 'white' ? 'black' : 'white', -beta, -alpha);
          board.undoMove();
          if (score >= beta) return beta; // Prune
          alpha = Math.max(alpha, score);
      }
      return alpha;
  }
}
