import ChessBoard from "../../board"
import { getAllLegalMoves } from "./moves"

// TODO : something about this position corrupts the board
test('should not try to move piece that does not exist', () => {
    const board = new ChessBoard('r1bqkb1r/pppppppp/2n5/8/4P3/8/PPP1NPPP/RNBQKB1R b KQkq')
    const moves = getAllLegalMoves(board, 'black')
    expect(moves).not.toContain(9)
})