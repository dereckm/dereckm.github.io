import ChessBoard from "./board"
import Engine from "./engine"

test('should not sacrifice with no gain', () => {
    const board = new ChessBoard('8/8/8/KN6/8/8/1q6/1k6 b -')
    const engine = new Engine()
    const bestMove = engine.findDeepeningOptimalMove(board, 'black', 500)
    console.log(bestMove)
    expect(bestMove.move?.to).not.toBe(38)
})