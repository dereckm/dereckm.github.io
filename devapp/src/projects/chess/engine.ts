import ChessBoard from "./board";
import { Color, PromotablePiece } from './models/Piece'
import { calculateScoreDelta } from "./logic/scoring-heuristics/scoring";
import { getAllLegalMoves, CandidateMove } from "./logic/move-generation/moves";

const TIMEOUT_MS = 500

interface ScoredMove {
    move: CandidateMove | null
    score: number
}

const enableAlphaBetaPruning = false;


export default class Engine {

    _maximizingPlayer: Color = 'white'
    _timer: number = 0
    _exploredPaths = 0
    _prunedNodes = 0
    _cancellation = 0
    _timeoutMs = 0
    _isCancelled() {
      return Date.now() > this._cancellation
    }

    findDeepeningOptimalMove(
      board: ChessBoard,
      color: Color,
      timeoutMs = TIMEOUT_MS
  ): ScoredMove {
      
      let bestMove: CandidateMove | null = null;
      let bestScore = color === 'white' ? -Infinity : Infinity;
      this._timer = Date.now();
      let depth = 1;
      this._exploredPaths = 0;
      this._prunedNodes = 0;
      this._timeoutMs = timeoutMs;
      while (Date.now() - this._timer < timeoutMs) {
          let legalMoves = getAllLegalMoves(board, color);
          let alpha = -Infinity;
          let beta = Infinity;
  
          for (let move of legalMoves) {
              const moveResult = board.applyMove(move.from, move.to);
              if (moveResult.isPromotion) {
                board.applyPromotion(move.to, move.promoteTo as PromotablePiece)
              }
              if (board.isCheckmate()) {
                return { move: move, score: color === 'black' ? -Infinity : Infinity }
              }
              let evalScore = this.minimax(board, color === 'white' ? 'black' : 'white', depth - 1, alpha, beta);
              board.undoMove();
  
              if ((color === 'white' && evalScore > bestScore) || (color === 'black' && evalScore < bestScore)) {
                  bestScore = evalScore;
                  bestMove = move;
              }
          }
          depth++; // Increase depth for the next iteration
      }
      this.printMetrics(depth, calculateScoreDelta(board))
      return { move: bestMove, score: 0 };
  }

    printMetrics(depth: number, score: number) {
      console.log('#### metrics ####')
      console.log(`time: ${Date.now() - this._timer}`)
      console.log(`max depth: ${depth}`)
      console.log(`moves explored: ${this._exploredPaths}`)
      console.log(`branches pruned: ${this._prunedNodes} (${(this._prunedNodes / (this._prunedNodes + this._exploredPaths) * 100.0).toFixed(2)}%)`)
      console.log(`score: ${score}`)
      console.log('#################')
    }

    minimax(board: ChessBoard, color: Color, depth: number, alpha: number, beta: number): number {
      this._exploredPaths++;
      if (depth === 0 || Date.now() - this._timer > this._timeoutMs) {
          return calculateScoreDelta(board) // this.quiescenceSearch(board, color, alpha, beta)
      }
  
      let legalMoves = getAllLegalMoves(board, color);
      if (color === 'white') {
          let maxEval = -Infinity;
          for (let move of legalMoves) {
              const moveResult = board.applyMove(move.from, move.to);
              if (moveResult.isPromotion) {
                board.applyPromotion(move.to, move.promoteTo as PromotablePiece)
              }
              if (board.isCheckmate()) {
                return Infinity
              }
              let evalScore = this.minimax(board, 'black', depth - 1, alpha, beta);
              board.undoMove();
              maxEval = Math.max(maxEval, evalScore);
              alpha = Math.max(alpha, evalScore);
              if (enableAlphaBetaPruning && beta <= alpha) {
                this._prunedNodes++;
                break;
              }
          }
          return maxEval;
      } else {
          let minEval = Infinity;
          for (let move of legalMoves) {
              const moveResult = board.applyMove(move.from, move.to);
              if (moveResult.isPromotion) {
                board.applyPromotion(move.to, move.promoteTo as PromotablePiece)
              }
              if (board.isCheckmate()) {
                return -Infinity
              }
              let evalScore = this.minimax(board, 'white', depth - 1, alpha, beta);
              board.undoMove();
              minEval = Math.min(minEval, evalScore);
              beta = Math.min(beta, evalScore);
              if (enableAlphaBetaPruning && beta <= alpha) {
                this._prunedNodes++;
                break;
              }
          }
          return minEval;
      }
  }

    quiescenceSearch(board: ChessBoard, color: Color, alpha: number, beta: number): number {
      let standPat = calculateScoreDelta(board); // Current evaluation
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