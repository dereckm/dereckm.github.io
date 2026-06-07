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
    const move = scoredMove.move;
    if (move == null) throw new Error('Move should not be null');
    let beforeState = board.save()
    move.apply(board)
    move.undo()
    console.log(`State: ${beforeState}, Move: ${INDEX_TO_SQUARE[move.from]}->${INDEX_TO_SQUARE[move.to]}`)
    let afterState = board.save()
    if (beforeState !== afterState) {
        console.log(`Corrupted state!!!`)
    }
    move.apply(board)
}