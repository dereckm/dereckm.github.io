import Int64, { ONE, ZERO } from '../../../../logic/Int64';
import { Color } from '../../models/Piece'
import ChessBoard from '../../board';
import { Piece } from '../../models/Piece'
import { SQUARE_FLAGS, SQUARE_INDEX } from '../../constants/squares';


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

export function generateKingMoves() {
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

export function generateKnightMoves() {
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

export function toIndex(x: number, y: number) {
    return y * 8 + x
}

export function toCoords(index: number) {
    const x = index % 8
    const y = Math.floor(index / 8)
    return { x, y }
}

export function getMoveIndexesFromFlag(flag: Int64) {
    if (flag.isZero()) return []
    if (flag.isFlag()) return [flag.log2()]
    const indexes = []
    for(let i = 0; i < 64; i++) {
        if (!(flag.and(ONE.shl(i)).isZero())) {
            indexes.push(i)
        }
    }
    return indexes;
}

function checkRangeMoves(board: ChessBoard, flag: Int64, oppositeColorPieces: Int64, piecesForColor: Int64, edges: Int64[], directions: ((i: number) => Int64)[]) {
    let moves = ZERO

    for(let direction = 0; direction < directions.length; direction++) {
        const edge = edges[direction]
        if (board.hasPiece(edge, flag)) // we're already at the edge
            continue
        
        for(let i = 1; i <= 7; i++) {
            const pos = directions[direction](i)
            const coords = toCoords(pos.log2())
            if (!isInBounds([coords.x, coords.y])) {
                break;
            }
            if (board.hasPiece(piecesForColor, pos)) {
                break
            }
            moves = moves.or(pos)
            if (board.hasPiece(edge, pos) || board.hasPiece(oppositeColorPieces, pos)) {
                break
            }
        }
    }
    return moves
}

export function checkKingMoves(board: ChessBoard, flag: Int64, color: Color) {
    if (flag.isZero()) return ZERO

    const index = flag.log2()
    let moves = kingMoves[index]
    const pieces = board.getAllPieces()
    if (color === 'white') {
        if (board._data._hasWhiteKingSideCastleRight && !pieces.isBitSet(SQUARE_INDEX.f1) && !pieces.isBitSet(SQUARE_INDEX.g1)) {
            moves = moves.or(SQUARE_FLAGS.g1)
        } 
        if (board._data._hasWhiteQueenSideCastleRight && !pieces.isBitSet(SQUARE_INDEX.b1) && !pieces.isBitSet(SQUARE_INDEX.c1) && !pieces.isBitSet(SQUARE_INDEX.d1)) {
            moves = moves.or(SQUARE_FLAGS.c1)
        }
    } else if (color === 'black') {
        if (board._data._hasBlackKingSideCastleRight && !pieces.isBitSet(SQUARE_INDEX.f8) && !pieces.isBitSet(SQUARE_INDEX.g8)) {
            moves = moves.or(SQUARE_FLAGS.g8)
        } 
        if (board._data._hasBlackQueenSideCastleRight && !pieces.isBitSet(SQUARE_INDEX.b8) && !pieces.isBitSet(SQUARE_INDEX.c8) && !pieces.isBitSet(SQUARE_INDEX.d8)) {
            moves = moves.or(SQUARE_FLAGS.c8)
        }
    }
    const stepOvers = board.getPiecesForColor(color)
    if (moves == null)
        console.log(index)
    const validMoves = moves.and(stepOvers.not())
    return validMoves
  }


export function checkQueenMoves(board: ChessBoard, flag: Int64, oppositeColorPieces: Int64, piecesForColor: Int64) {
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
     return checkRangeMoves(board, flag, oppositeColorPieces, piecesForColor, queenEdges, directions)
  }

  export function checkRookMoves(board: ChessBoard, flag: Int64, oppositeColorPieces: Int64, piecesForColor: Int64) {
    const directions = [
      (i: number) => flag.shl(i * 8),
      (i: number) => flag.shr(i * 1),
      (i: number) => flag.shr(i * 8),
      (i: number) => flag.shl(i * 1)
     ]
     return checkRangeMoves(board, flag, oppositeColorPieces, piecesForColor, rookEdges, directions)
  }

  export function checkBishopMoves(board: ChessBoard, flag: Int64, oppositeColorPieces: Int64, piecesForColor: Int64) {
    const directions = [
      (i: number) => flag.shl(i * 9),
      (i: number) => flag.shl(i * 7),
      (i: number) => flag.shr(i * 7),
      (i: number) => flag.shr(i * 9)
     ]

     return checkRangeMoves(board, flag, oppositeColorPieces, piecesForColor, bishopEdges, directions)
  }

  export function checkKnightMoves(board: ChessBoard, flag: Int64, color: Color) {
    if (flag.isZero()) return ZERO
    const index = flag.log2()
    const moves = knightMoves[index]
    const stepOvers = board.getPiecesForColor(color)
    const validMoves = moves.and(stepOvers.not())
    return validMoves
  }
  

  export function checkPawnMoves(board: ChessBoard, flag: Int64, color: Color) {
    let validMoves = ZERO;
    const index = flag.log2();
    const x = index % 8;
    
    if (color === 'white') {
        validMoves = validMoves.or(getPawnForwardMoves(board, flag, WHITE_PAWN_START, true));
        validMoves = validMoves.or(getPawnCaptureMoves(board, flag, x, 'black', true));
    } else {
        validMoves = validMoves.or(getPawnForwardMoves(board, flag, BLACK_PAWN_START, false));
        validMoves = validMoves.or(getPawnCaptureMoves(board, flag, x, 'white', false));
    }

    validMoves = validMoves.or(checkEnPassant(flag, board, color))
    
    return validMoves;
}

function checkEnPassant(flag: Int64, board: ChessBoard, color: Color): Int64 {
    if (board._data._enPassantTargetSquare != null) {
        if (color === 'black') {
            const whitePawns = board._data._bitboards['white']['P']
            if (board.hasPiece(whitePawns, board._data._enPassantTargetSquare.shr(7)) || board.hasPiece(whitePawns, board._data._enPassantTargetSquare.shr(9)))
                return board._data._enPassantTargetSquare
        } else {
            if (flag.equals(board._data._enPassantTargetSquare.shr(7)) || flag.equals(board._data._enPassantTargetSquare.shr(9)))
                return board._data._enPassantTargetSquare
        }
    }
    return ZERO
}

function getPawnForwardMoves(board: ChessBoard, flag: Int64, startPosition: Int64, isWhite: boolean): Int64 {
    const forwardOne = isWhite ? flag.shl(8) : flag.shr(8);
    let moves = ZERO;

    if (!board.hasPiece(board.getAllPieces(), forwardOne)) {
        moves = moves.or(forwardOne);
        const forwardTwo = isWhite ? flag.shl(16) : flag.shr(16);
        if (board.hasPiece(startPosition, flag) && !board.hasPiece(board.getAllPieces(), forwardTwo)) {
            moves = moves.or(forwardTwo);
        }
    }
    return moves;
}

function getPawnCaptureMoves(board: ChessBoard, flag: Int64, x: number, opponentColor: Color, isWhite: boolean): Int64 {
    let captures = ZERO;
    const opponentPieces = board.getPiecesForColor(opponentColor);
    const leftCapture = isWhite ? flag.shl(7) : flag.shr(9);
    const rightCapture = isWhite ? flag.shl(9) : flag.shr(7);

    if (x > 0) captures = captures.or(leftCapture);
    if (x < 7) captures = captures.or(rightCapture);

    return captures.and(opponentPieces);
}

  export interface CandidateMove {
    from: number,
    to: number,
    isCapture: boolean,
    promoteTo: Piece | null
  }

  const promoteTargets: Piece[] = ['N', 'B', 'R', 'Q']
  export function getAllLegalMoves(board: ChessBoard, color: Color): CandidateMove[] {
      const pieces = board.getPiecesForColor(color)
      const oppositePieces = board.getPiecesForColor(board.flipColor(color))
      const moves = []
      for(let i = 0; i < 64; i++) {
          const flag = board.getFlag(i)
          if (board.hasPiece(pieces, flag)) {
              const piece = board.getPiece(flag)
              if (piece != null) {
                const toIndexes = board.getMoveIndexes(i, pieces, oppositePieces)
                for(const toIndex of toIndexes) {
                  const toFlag = board.getFlag(toIndex)
                  const isCapture = board.hasPiece(oppositePieces, toFlag)
                  const isPromotion = board.isPromotion(toFlag, color, piece)
                  if (isPromotion) {
                    for(const promoteTarget of promoteTargets) {
                        moves.push({ from: i, to: toIndex, isCapture: isCapture, promoteTo: promoteTarget as Piece })
                    }
                  } else {
                    moves.push({ from: i, to: toIndex, isCapture: isCapture, promoteTo: null })
                  }
                }
              }
          }
      }
      return moves.toSorted((a, b) =>  {
        if (a.isCapture && !b.isCapture) {
          return -1
        } else if (!a.isCapture && b.isCapture) {
          return 1
        }
        return 0
      })
    }