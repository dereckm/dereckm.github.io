import ChessBoard from "./board"
import { SQUARE_INDEX } from "./constants/squares"
import Engine from "./engine"

test('should not sacrifice with no gain', () => {
    const board = new ChessBoard('8/8/8/KN6/8/8/1q6/1k6 b -')
    const engine = new Engine()
    const bestMove = engine.findBestMove(board, 'black', 2)
    expect(bestMove.move?.to).not.toBe(38)
})

test('should find mate in one', () => {
    const board = new ChessBoard('8/8/7R/8/8/2K5/8/2k5 w -')
    const engine = new Engine()
    const bestMove = engine.findBestMove(board, 'white', 2)
    expect(bestMove.move?.from).toBe(SQUARE_INDEX.h6)
    expect(bestMove.move?.to).toBe(SQUARE_INDEX.h1)
})

test('should eat free piece to get out of check', () => {
    const board = new ChessBoard('8/8/1R6/8/8/2K5/1q6/2k5 w -')
    const engine = new Engine()
    const bestMove = engine.findBestMove(board, 'white', 2)
    expect(bestMove.move?.from).toBe(SQUARE_INDEX.b6)
    expect(bestMove.move?.to).toBe(SQUARE_INDEX.b2)
})

test('should eat free piece to get out of check', () => {
    const board = new ChessBoard('8/8/1r6/8/8/2k5/1Q6/2K5 b -')
    const engine = new Engine()
    const bestMove = engine.findBestMove(board, 'black', 2)
    expect(bestMove.move?.from).toBe(SQUARE_INDEX.b6)
    expect(bestMove.move?.to).toBe(SQUARE_INDEX.b2)
})