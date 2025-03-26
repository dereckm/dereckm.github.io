import ChessBoard from './board'
import { SQUARE_INDEX } from './constants/squares'

test('should allow blocking check with knight', () => {
    const board = setUp('rbn1knbr/pp1ppppp/8/2p5/4P3/1NqPN3/P1P2PPP/RB1QK1BR w KQkq - 0 0')
    const moves = board.checkMoves(4)
    expect(moves.toString(2)).toBe('1000000000000')
})

test('will consider promotion', () => {
    const board = setUp('7p/1P6/8/2p5/4P3/8/P1P5/8 w - - 0 0')
    const moveResult = board.applyMove(54, 62)
    expect(true).toBe(moveResult.isPromotion)
})

test('king cannot move towards another king', () => {
    const board = setUp('7p/1P6/4K3/2p5/4Pk2/8/P1P5/8 w - - 0 0')
    const moves = board.getMoveIndexes(43)
    expect(6).toBe(moves.length)
})

test('king moves should generate correctly', () => {
    const board = setUp('7p/1P6/4K3/2p3k1/4P3/8/P1P5/8 b - - 0 0')
    const moves = board.getMoveIndexes(33)
    expect(moves.length).toBe(6)
    expect(moves).toContain(24)
})


test('pawns should not capture via going out of bounds', () => {
    const board = setUp('rnbqkb1r/pppppppp/5n2/P7/8/8/1PPPPPPP/RNBQKBNR b - - 0 0')
    const moves = board.getMoveIndexes(48)
    expect(moves.length).toBe(2)
})

test('check moves should not have side effects', () => {
    const board = setUp('2b5/1p2k2r/r2qp2n/p1pP1p1N/P2B4/3PR1PB/3KP2P/1N4QR w - - 0 0')
    board.getMoveIndexes(32)
    board.getMoveIndexes(17)
    expect(board._turn).toBe('white')
})

test('rook should not go through a pawn', () => {
    const board = setUp('2b5/1p2k2r/r7/p4p2/P2P1N2/3K4/4P2P/1N5Q b - - 0 0')
    const moves = board.getMoveIndexes(48)
    expect(moves.length).toBe(8)
    expect(moves).not.toContain(0)
})

test('rook should be able to reach the edge', () => {
    const board = setUp('2b5/1p2k2r/r7/p4p2/P2P1N2/3K4/4P2P/1N5Q b - - 0 0')
    const moves = board.getMoveIndexes(47)
    expect(moves.length).toBe(9)
    expect(moves).toContain(63)
})

test('should allow white king-side castling', () => {
    const board = setUp('rb1qk1br/pppppppp/3n4/8/8/4NP2/PPQPPBPP/RBN1K2R w Kkq - 0 0')
    const moves = board.getMoveIndexes(3)
    expect(moves.length).toBe(3)
    expect(moves).toContain(1)
})

test('should apply white king-side castling correctly', () => {
    const board = setUp('rb1qk1br/pppppppp/3n4/8/8/4NP2/PPQPPBPP/RBN1K2R w Kkq - 0 0')
    board.applyMove(3, 1)
    const newState = board.save()
    expect(newState).toBe('rb1qk1br/pppppppp/3n4/8/8/4NP2/PPQPPBPP/RBN2RK1 b kq - 1 1')
})

test('should allow white queen-side castling', () => {
    const board = setUp('rb3kbr/pppp1ppp/3n1q2/4p3/8/P2NNP2/BPQPPBPP/R3K2R w KQk - 0 0')
    const moves = board.getMoveIndexes(3)
    expect(moves.length).toBe(4)
    expect(moves).toContain(5)
})

test('should apply white queen-side castling correctly', () => {
    const board = setUp('rb3kbr/pppp1ppp/3n1q2/4p3/8/P2NNP2/BPQPPBPP/R3K2R w KQk - 0 0')
    board.applyMove(3, 5)
    const newState = board.save()
    expect(newState).toBe('rb3kbr/pppp1ppp/3n1q2/4p3/8/P2NNP2/BPQPPBPP/2KR3R b k - 1 1')
})

test('should allow black king-side castling', () => {
  const board = new ChessBoard('rnbqk2r/pppp1ppp/3bpn2/8/4P3/5PPP/PPPP4/RNBQKBNR b KQkq - 0 0')
  const moves = board.getMoveIndexes(SQUARE_INDEX.e8)
  expect(moves.length).toBe(3)
  expect(moves).toContain(SQUARE_INDEX.g8)  
})

test('should apply black king-side castling correctly', () => {
    const board = new ChessBoard('rnbqk2r/pppp1ppp/3bpn2/8/4P3/5PPP/PPPP4/RNBQKBNR b KQkq - 0 0')
    const moves = board.getMoveIndexes(SQUARE_INDEX.e8)
    board.applyMove(SQUARE_INDEX.e8, SQUARE_INDEX.g8)
    const newState = board.save()
    expect(newState).toBe('rnbq1rk1/pppp1ppp/3bpn2/8/4P3/5PPP/PPPP4/RNBQKBNR w KQ - 1 0')
  })

  test('should allow black queen-side castling', () => {
    const board = new ChessBoard('r3kbnr/pppqpppp/2np4/5b2/8/1PPPPP2/P5PP/RNBQKBNR b KQkq - 0 0')
    const moves = board.getMoveIndexes(SQUARE_INDEX.e8)
    expect(moves.length).toBe(2)
    expect(moves).toContain(SQUARE_INDEX.c8)  
  })

  test('should allow en-passant', () => {
    const board = new ChessBoard('rnbqkbnr/pp1p1ppp/2p5/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 - 0 0')
    const moves = board.getMoveIndexes(SQUARE_INDEX.f5)
    expect(moves.length).toBe(2)
    expect(moves).toContain(SQUARE_INDEX.e6)
  })

  test('should apply en-passant correctly', () => {
    const board = new ChessBoard('rnbqkbnr/pp1p1ppp/2p5/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 - 0 0')
    board.applyMove(SQUARE_INDEX.f5, SQUARE_INDEX.e6)
    const newState = board.save()
    expect(newState).toBe('rnbqkbnr/pp1p1ppp/2p1P3/8/8/8/PPPPP1PP/RNBQKBNR b KQkq - 0 1')
  })


//TODO : Make sure black can castle as well
//TODO : Investigate why bot keeps sacrificing material

function setUp(boardString: string) {
    const board = new ChessBoard(boardString)
    return board
}