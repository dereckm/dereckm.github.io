import { Color, PromotablePiece } from "./models/Piece";
import { calculateOverallScoreDelta } from "./logic/scoring-heuristics/scoring";
import { getAllLegalMoves } from "./logic/move-generation/moves";
import { Move } from "./logic/game/move";
import ChessBoard from "./logic/game/board";
import { prioritizeMoves } from "./logic/scoring-heuristics/move-ordering";

const TIMEOUT_MS = 500;
const TT_FLAG = { EXACT: 0, LOWERBOUND: 1, UPPERBOUND: 2 };

interface ScoredMove {
    move: Move | null;
    score: number;
}

interface TTEntry {
    value: number;
    depth: number;
    flag: number;
}

const promotionMoves: PromotablePiece[] = ["N", "B", "R", "Q"];

class TranspositionTable {
    private table: Map<string, TTEntry> = new Map();

    get(hash: string): TTEntry | undefined {
        return this.table.get(hash);
    }

    set(hash: string, entry: TTEntry): void {
        const existing = this.table.get(hash);
        if (!existing || entry.depth >= existing.depth) {
            this.table.set(hash, entry);
        }
    }
}

export default class Engine {
    _maximizingPlayer: Color = "white";
    _timer: number = 0;
    _exploredPaths = 0;
    _prunedNodes = 0;
    _timeoutMs = 0;
    _transpositionTable = new TranspositionTable();

    findDeepeningOptimalMove(board: ChessBoard, color: Color, timeoutMs = TIMEOUT_MS): ScoredMove {
        this._timer = Date.now();
        this._exploredPaths = 0;
        this._prunedNodes = 0;
        let depth = 1;
        let bestScore = color === "white" ? -Infinity : Infinity;
        let bestMove: Move | null = null;
        while (Date.now() < this._timer + timeoutMs) {
            const { move, score } = this.findBestMove(board, color, depth, -Infinity, Infinity);
            if ((color === "white" && score > bestScore) || (color === "black" && score < bestScore)) {
                bestScore = score;
                bestMove = move;
            }
            depth++;
        }
        this.printMetrics(depth, bestScore);
        return { move: bestMove, score: bestScore };
    }

    findBestMove(board: ChessBoard, color: Color, depth: number, alpha: number = -Infinity, beta: number = Infinity) {
        const moves = prioritizeMoves(getAllLegalMoves(board, color));
        let bestMove: Move = moves[0];
        let bestScore = color === "white" ? -Infinity : Infinity;

        for (const move of moves) {
            move.apply(board)
            if (board.isCheckmateState()) {
                move.undo()
                return { move, score: color === "white" ? Infinity : -Infinity };
            }
            const score = this.minimax(board, board.flipColor(color), depth, alpha, beta, move);
            move.undo()
            if ((color === "white" && score > bestScore) || (color === "black" && score < bestScore)) {
                bestScore = score;
                bestMove = move;
            }
        }
        return { move: bestMove, score: bestScore };
    }

    minimax(board: ChessBoard, color: Color, depth: number, alpha: number, beta: number, move: Move, quiescenceSearch: boolean = false): number {
        const hash = board.hash();
        const ttEntry = this._transpositionTable.get(hash);
        if (ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === TT_FLAG.EXACT) return ttEntry.value;
            if (ttEntry.flag === TT_FLAG.LOWERBOUND) alpha = Math.max(alpha, ttEntry.value);
            else if (ttEntry.flag === TT_FLAG.UPPERBOUND) beta = Math.min(beta, ttEntry.value);
            if (alpha >= beta) return ttEntry.value;
        }

        if (depth === 0) {
            if (!quiescenceSearch && (board.isCheckState() || move.result.capturedPiece)) {
                return this.minimax(board, color, 2, alpha, beta, move, true);
            }
            this._exploredPaths++;
            return calculateOverallScoreDelta(board);
        }

        const moves = prioritizeMoves(getAllLegalMoves(board, color));
        let bestScore = color === "white" ? -Infinity : Infinity;

        for (const move of moves) {
            move.apply(board)
            if (board.isCheckmateState()) {
                move.undo()
                return color === "white" ? Infinity : -Infinity;
            }
            const score = this.minimax(board, board.flipColor(color), depth - 1, alpha, beta, move, quiescenceSearch);
            move.undo()
            bestScore = color === "white" ? Math.max(bestScore, score) : Math.min(bestScore, score);
            if (color === "white") alpha = Math.max(alpha, bestScore);
            else beta = Math.min(beta, bestScore);
            if (alpha >= beta) {
                this._prunedNodes++;
                break;
            }
        }

        const flag = bestScore <= alpha ? TT_FLAG.UPPERBOUND : bestScore >= beta ? TT_FLAG.LOWERBOUND : TT_FLAG.EXACT;
        this._transpositionTable.set(hash, { value: bestScore, depth, flag });
        return bestScore;
    }

    printMetrics(depth: number, score: number) {
        console.log("#### metrics ####");
        console.log(`time: ${Date.now() - this._timer}`);
        console.log(`max depth: ${depth}`);
        console.log(`moves explored: ${this._exploredPaths}`);
        console.log(`branches pruned: ${this._prunedNodes} (${((this._prunedNodes / (this._prunedNodes + this._exploredPaths)) * 100.0).toFixed(2)}%)`);
        console.log(`score: ${score}`);
        console.log("#################");
    }
}
