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