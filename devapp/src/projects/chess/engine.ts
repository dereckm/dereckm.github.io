import ChessBoard, { MoveResult } from "./board";
import { Color, PromotablePiece } from './models/Piece';
import { calculateOverallScoreDelta } from "./logic/scoring-heuristics/scoring";
import { getAllLegalMoves, CandidateMove } from "./logic/move-generation/moves";

const TIMEOUT_MS = 500;

interface ScoredMove {
    move: CandidateMove | null;
    score: number;
}

const promotionMoves: PromotablePiece[] = ['N', 'B', 'R', 'Q'];

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

    findDeepeningOptimalMove(board: ChessBoard, color: Color, timeoutMs = TIMEOUT_MS): ScoredMove {
        this._timer = Date.now();
        this._exploredPaths = 0;
        this._prunedNodes = 0;
        let depth = 1
        let bestScore = color === 'white' ? -Infinity : Infinity
        let bestMove: CandidateMove | null = null
        while (Date.now() < this._timer + timeoutMs) {
          const { move, score } = this.findBestMove(board, color, depth, -Infinity, Infinity);
          if ((color === 'white' && score > bestScore) || (color === 'black' && score < bestScore)) {
            bestScore = score
            bestMove = move
          }
          depth++;
        }
        
        this.printMetrics(depth, bestScore);
        return { move: bestMove, score: bestScore };
    }

    findBestMove(board: ChessBoard, color: Color, depth: number, alpha: number = -Infinity, beta: number = Infinity) {
        const moves = getAllLegalMoves(board, color);
        let bestMove: CandidateMove = moves[0];
        let bestScore = color === 'white' ? -Infinity : Infinity;

        for (const move of moves) {
            const moveResult = board.applyMove(move.from, move.to);
            if (board.isCheckmate()) {
                board.undoMove();
                return { move, score: color === 'white' ? Infinity : -Infinity };
            }
            const score = this.minimax(board, board.flipColor(color), depth, alpha, beta, moveResult);
            board.undoMove();

            if ((color === 'white' && score > bestScore) || (color === 'black' && score < bestScore)) {
                bestScore = score;
                bestMove = move;
            }
        }
        return { move: bestMove, score: bestScore };
    }

    minimax(board: ChessBoard, color: Color, depth: number, alpha: number, beta: number, moveResult: MoveResult, quiescenceSearch: boolean = false): number {
        if (depth === 0) {
            if (!quiescenceSearch && (moveResult.isCheck || moveResult.isCapture)) {
                return this.minimax(board, color, 2, alpha, beta, moveResult, true)
            }
            this._exploredPaths++;
            return calculateOverallScoreDelta(board);
        }

        const moves = getAllLegalMoves(board, color);
        if (color === 'white') {
            let bestScore = -Infinity;
            for (const move of moves) {
                const moveResult = board.applyMove(move.from, move.to);
                if (moveResult.isPromotion) {
                  const scores = this.explorePromotions(move.to, board, color, depth, alpha, beta, moveResult)
                  for(const s of scores) {
                    if (s > bestScore) bestScore = s
                  }
                }
                if (board.isCheckmate()) {
                    board.undoMove();
                    return Infinity;
                }
                const score = this.minimax(board, board.flipColor(color), depth - 1, alpha, beta, moveResult, quiescenceSearch);
                board.undoMove();
                
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, bestScore);
                if (alpha >= beta) {
                    this._prunedNodes++;
                    break;
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (const move of moves) {
                const moveResult = board.applyMove(move.from, move.to);
                
                if (moveResult.isPromotion) {
                  const scores = this.explorePromotions(move.to, board, color, depth, alpha, beta, moveResult)
                  for(const s of scores) {
                    if (s < bestScore) bestScore = s
                  }
                }
                if (board.isCheckmate()) {
                    board.undoMove();
                    return -Infinity;
                }
                const score = this.minimax(board, board.flipColor(color), depth - 1, alpha, beta, moveResult, quiescenceSearch);
                board.undoMove();
                
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, bestScore);
                if (alpha >= beta) {
                    this._prunedNodes++;
                    break;
                }
            }
            return bestScore;
        }
    }

    explorePromotions(to: number, board: ChessBoard, color: Color, depth: number, alpha: number, beta: number, moveResult: MoveResult) {
      const scores: number[] = []
      for(const move of promotionMoves) {
        const isCheck = board.applyPromotion(to, move)
        if (isCheck) {
            moveResult.isCheck = true
        }
        const score = this.minimax(board, board.flipColor(color), depth - 1, alpha, beta, moveResult)
        scores.push(score)
      }
      return scores;
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
}
