import ChessBoard from './board'

test('should allow blocking check with knight', () => {
    const board = new ChessBoard()
    board.loadAll('rbn*knbrpp*ppppp**********p*********P****NqPN***P*P**PPPRB*QK*BR')
    const moves = board.checkMoves(4)
    expect('1000000000000').toBe(moves.toString(2))
})

test('will consider promotion', () => {
    const board = new ChessBoard()
    board.loadAll('*******p*P****************p*********P***********P*P*************')
    const moveResult = board.applyMove(54, 62)
    expect(true).toBe(moveResult.isPromotion)
})

test('king cannot move towards another king', () => {
    const board = setUp('*******p*P**********K*****p*********Pk**********P*P*************')
    const moves = board.getMoveIndexes(43)
    expect(6).toBe(moves.length)
})

function setUp(boardString: string) {
    const board = new ChessBoard()
    board.loadAll(boardString)
    return board
}