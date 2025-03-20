import Int64, { ONE, ZERO } from '../../../../logic/Int64';
import { Color } from '../../models/Piece'
import ChessBoard from '../../board';


const knightMoves = generateKnightMoves()
const kingMoves = generateKingMoves()
const WHITE_PAWN_START = Int64.fromString('0b1111111100000000')
const BLACK_PAWN_START = Int64.fromString("0b0000000011111111000000000000000000000000000000000000000000000000")
const rookEdges = [
  Int64.fromString("0b1111111100000000000000000000000000000000000000000000000000000000"),
  Int64.fromString("0b0000000100000001000000010000000100000001000000010000000100000001"),
  Int64.fromString("0b0000000000000000000000000000000000000000000000000000000011111111"),
  Int64.fromString("0b1000000010000000100000001000000010000000100000001000000010000000"),
]

const bishopEdges = [
  Int64.fromString("0b1111111110000000100000001000000010000000100000001000000010000000"),
  Int64.fromString("0b1111111100000001000000010000000100000001000000010000000100000001"),
  Int64.fromString("0b1000000010000000100000001000000010000000100000001000000011111111"),
  Int64.fromString("0b0000000100000001000000010000000100000001000000010000000111111111"),
]

const queenEdges = [
  ...rookEdges,
  ...bishopEdges
]

type Coords = [x: number, y: number]

function generateKingMoves() {
    const lookup: Record<number, Int64> = {}
    for(let i = 0; i < 64; i++) {
        const { x, y } = toCoords(i)
        let moves = ZERO
        let candidateMoves: Coords[] = [
            [x, y + 1],
            [x + 1, y + 1],
            [x + 1, y],
            [x + 1, y - 1],
            [x, y - 1],
            [x - 1, y - 1],
            [x - 1, y],
            [x - 1, y + 1],
        ]
        candidateMoves = candidateMoves.filter(isInBounds)
        for(const move of candidateMoves) {
            const [x, y] = move
            const index = toIndex(x, y)
            moves = moves.or(ONE.shl(index))
        }
        lookup[i] = moves
    }
    return lookup
}

function isInBounds(move: Coords) {
    const [x, y] = move
    return x >= 0 && x <= 7 && y >= 0 && y <= 7
}

function generateKnightMoves() {
    const lookup: Record<number, Int64> = {}
    for(let i = 0; i < 64; i++) {
        const { x, y } = toCoords(i)
        let moves = ZERO
        let candidateMoves: Coords[] = [
            [x - 1, y + 2],
            [x + 1, y + 2],
            [x + 2, y + 1],
            [x + 2, y - 1],
            [x + 1, y - 2],
            [x - 1, y - 2],
            [x - 2, y - 1],
            [x - 2, y + 1]
        ]
        candidateMoves = candidateMoves.filter(isInBounds)
        for(const move of candidateMoves) {
            const [x, y] = move
            const index = toIndex(x, y)
            moves = moves.or(ONE.shl(index))
        }
        lookup[i] = moves
    }
    return lookup
}

function toIndex(x: number, y: number) {
    return y * 8 + (7 - x)
}

function toCoords(index: number) {
    const x = 7 - (index % 8)
    const y = Math.floor(index / 8)
    return { x, y }
}

function checkRangeMoves(board: ChessBoard, flag: Int64, color: Color, edges: Int64[], directions: ((i: number) => Int64)[]) {
    let moves = ZERO
    const skips: boolean[] = []
    skips.fill(false, 0, directions.length - 1)
    const sameColorPieces = board._pieces[color]
    const oppositeColor = board.flipColor(color)
    const oppositePieces = board._pieces[oppositeColor]
    for(let direction = 0; direction < directions.length; direction++) {
        const edge = edges[direction]
        if (board.hasPiece(edge, flag))
        continue
        for(let i = 1; i <= 7; i++) {
        const pos = directions[direction](i)
        if (board.hasPiece(sameColorPieces, pos)) {
            break
        }
        if (board.hasPiece(edge, pos) || board.hasPiece(oppositePieces, pos)) {
            moves = moves.or(pos)
            break
        }
        moves = moves.or(pos)
        }
    }
    return moves
}

export function checkKingMoves(board: ChessBoard, flag: Int64, color: Color) {
    const index = flag.log2()
    const moves = kingMoves[index]
    const stepOvers = board._pieces[color]
    return moves.and(stepOvers.not())
  }


export function checkQueenMoves(board: ChessBoard, flag: Int64, color: Color) {
    const directions = [
      (i: number) => flag.shl(i * 8),
      (i: number) => flag.shr(i * 1),
      (i: number) => flag.shr(i * 8),
      (i: number) => flag.shl(i * 1),
      (i: number) => flag.shl(i * 9),
      (i: number) => flag.shl(i * 7),
      (i: number) => flag.shr(i * 7),
      (i: number) => flag.shr(i * 9)
     ]
     return checkRangeMoves(board, flag, color, queenEdges, directions)
  }

  export function checkRookMoves(board: ChessBoard, flag: Int64, color: Color) {
    const directions = [
      (i: number) => flag.shl(i * 8),
      (i: number) => flag.shr(i * 1),
      (i: number) => flag.shr(i * 8),
      (i: number) => flag.shl(i * 1)
     ]
     return checkRangeMoves(board, flag, color, rookEdges, directions)
  }

  export function checkBishopMoves(board: ChessBoard, flag: Int64, color: Color) {
    const directions = [
      (i: number) => flag.shl(i * 9),
      (i: number) => flag.shl(i * 7),
      (i: number) => flag.shr(i * 7),
      (i: number) => flag.shr(i * 9)
     ]

     return checkRangeMoves(board, flag, color, bishopEdges, directions)
  }

  export function checkKnightMoves(board: ChessBoard, flag: Int64, color: Color) {
    if (flag.isZero()) return ZERO
    const index = flag.log2()
    const moves = knightMoves[index]
    const stepOvers = board._pieces[color]
    return moves.and(stepOvers.not())
  }

  export function checkPawnMoves(board: ChessBoard, flag: Int64, color: Color) {
    let validMoves: Int64 = new Int64(0)
    // TODO : check en passant
    if (color === 'white') {
        const forwardOne = flag.shl(8)
        if (!board.hasPiece(board.getAllPieces(), forwardOne)) {
            validMoves = validMoves.or(forwardOne)
            const forwardTwo = flag.shl(16)
            if (board.hasPiece(WHITE_PAWN_START, flag) && !board.hasPiece(board.getAllPieces(), forwardTwo)) {
                validMoves = validMoves.or(forwardTwo)
            }
        }
        const blackPieces = board._pieces['black']
        const diag1 = flag.shl(7)
        const diag2 = flag.shl(9)
        const captures = (diag1.or(diag2)).and(blackPieces)
        validMoves = validMoves.or(captures)
    } else if (color === 'black') {
        const forwardOne = flag.shr(8)
        if (!board.hasPiece(board.getAllPieces(), forwardOne)) {
            validMoves = validMoves.or(forwardOne)
            const forwardTwo = flag.shr(16)
            if (board.hasPiece(BLACK_PAWN_START, flag) && !board.hasPiece(board.getAllPieces(), forwardTwo)) {
                validMoves = validMoves.or(forwardTwo)
            }
        }
        
        const whitePieces = board._pieces['white']
        const diag1 = flag.shr(7)
        const diag2 = flag.shr(9)
        const captures = (diag1.or(diag2)).and(whitePieces)
        validMoves = validMoves.or(captures)
    }
    return validMoves
  }