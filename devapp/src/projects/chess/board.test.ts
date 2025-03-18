import ChessBoard from './board'

test('should allow blocking check with knight', () => {
    const board = new ChessBoard()
    board.loadAll('rbn*knbrpp*ppppp**********p*********P****NqPN***P*P**PPPRB*QK*BR')
    const moves = board.checkMoves(4)
    expect('1000000000000').toBe(moves.toString(2))
})