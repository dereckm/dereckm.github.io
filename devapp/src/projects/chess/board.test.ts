import ChessBoard from './board'

test('should allow blocking check with knight', () => {
    const board = setUp('rbn*knbrpp*ppppp**********p*********P****NqPN***P*P**PPPRB*QK*BR1')
    const moves = board.checkMoves(4)
    expect('1000000000000').toBe(moves.toString(2))
})

test('will consider promotion', () => {
    const board = setUp('*******p*P****************p*********P***********P*P*************1')
    const moveResult = board.applyMove(54, 62)
    expect(true).toBe(moveResult.isPromotion)
})

test('king cannot move towards another king', () => {
    const board = setUp('*******p*P**********K*****p*********Pk**********P*P*************1')
    const moves = board.getMoveIndexes(43)
    expect(6).toBe(moves.length)
})

test('king moves should generate correctly', () => {
    const board = setUp('*******p*P**********K*****p***k*****P***********P*P*************0')
    const moves = board.getMoveIndexes(33)
    expect(moves.length).toBe(6)
    expect(moves).toContain(24)
})


test('pawns should not capture via going out of bounds', () => {
    const board = setUp('rnbqkb*rpppppppp*****n**P************************PPPPPPPRNBQKBNR0')
    const moves = board.getMoveIndexes(48)
    expect(moves.length).toBe(2)
})

test('check moves should not have side effects', () => {
    const board = setUp('**b******p**k**rr**qp**np*pP*p*NP**B*******PR*PB***KP**P*N****QR1')
    board.getMoveIndexes(32)
    board.getMoveIndexes(17)
    expect(board._turn).toBe('white')
})

test('rook should not go through a pawn', () => {
    const board = setUp('**b******p**k**rr*******p****p**P**P*N*****K********P**P*N*****Q0')
    const moves = board.getMoveIndexes(48)
    expect(moves.length).toBe(8)
    expect(moves).not.toContain(0)
})

test('rook should be able to reach the edge', () => {
    const board = setUp('**b******p**k**rr*******p****p**P**P*N*****K********P**P*N*****Q0')
    const moves = board.getMoveIndexes(47)
    expect(moves.length).toBe(9)
    expect(moves).toContain(63)
})

function setUp(boardString: string) {
    const board = new ChessBoard(boardString)
    return board
}