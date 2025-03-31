import ChessBoard from '../logic/game/board' 
import { DEFAULT_BOARD } from '../constants/fen'
import { INDEX_TO_SQUARE } from '../constants/squares'
import Engine from '../engine'
import { Color } from '../models/Piece'


const engine = new Engine()

export function tryFindBoardCorruptionIssues() {
    const board = new ChessBoard(DEFAULT_BOARD)
    let i = 0;
    while (i < 100) {
        playTurn(board, 'white')
        playTurn(board, 'black')
        i++;
    }
}

function playTurn(board: ChessBoard, color: Color) {
    const scoredMove = engine.findDeepeningOptimalMove(board, color)
    if (scoredMove.move == null) throw new Error('Move should not be null');
    let beforeState = board.save()
    const whiteMoveResult = board.applyMove(scoredMove.move.from, scoredMove.move.to)
    board.undoMove(whiteMoveResult)
    console.log(`State: ${beforeState}, Move: ${INDEX_TO_SQUARE[scoredMove.move.from]}->${INDEX_TO_SQUARE[scoredMove.move.to]}`)
    let afterState = board.save()
    if (beforeState !== afterState) {
        console.log(`Corrupted state!!!`)
    }
    board.applyMove(scoredMove.move.from, scoredMove.move.to)
}