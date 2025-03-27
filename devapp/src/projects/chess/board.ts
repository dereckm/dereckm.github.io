import Int64, { ZERO, ONE } from "../../logic/Int64"
import { Color, Piece, PromotablePiece } from './models/Piece'
import { Square } from './models/Square'
import { 
  checkPawnMoves, checkKnightMoves, checkBishopMoves, 
  checkRookMoves, checkQueenMoves, checkKingMoves,
  getAllLegalMoves
 } from './logic/move-generation/moves'
import { FLAGS_LOOKUP_INDEX, INDEX_TO_SQUARE, SQUARE_INDEX } from "./constants/squares"
import { charToPiece, getInteger } from "./utilities/fast-casting"

const SEVEN = 7
const NINE = 9
const NOT_NUMBER = -1;

const WHITE_PROMOTION_RANK = Int64.fromString("0b1111111100000000000000000000000000000000000000000000000000000000")
const BLACK_PROMOTION_RANK = Int64.fromString("0b0000000000000000000000000000000000000000000000000000000011111111")

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export default class ChessBoard {
  _history: string[] = []

  _turn: Color;
  _isCheck: boolean = false
  _enPassantTargetSquare: Int64 | null = null
  _halfMoveClock: number = 0
  _fullMoveNumber: number = 0

  _bitboards: Record<Color, Record<Piece, Int64>>

  constructor(state: string) {
    this._bitboards = {} as Record<Color, Record<Piece, Int64>>
    this._turn = 'white'
    this.loadAll(state)
  }

  _hasBlackKingSideCastleRight = true;
  _hasBlackQueenSideCastleRight = true;

  _hasWhiteKingSideCastleRight = true;
  _hasWhiteQueenSideCastleRight = true;

  clone() {
    const b = new ChessBoard(this.save())
    b._history = [...this._history]
    return b
  }

  save() {
    let fen = ''
    let count = 0;
    const whitePieces = this.getPiecesForColor('white')
    for(let i = 63; i >= 0; i--) {
      const flag = this.getFlag(i)
      const piece = this.getPiece(flag)
      
      if (piece != null) {
        const color = this.hasPiece(whitePieces, flag) ? 'white' : 'black'
        if (count !== 0) fen += count;
        fen += color === 'white' ? piece : piece.toLowerCase()
        count = 0;
      } else {
        count++;
      }
      if (i % 8 === 0 && i !== 0) {
         if(count !== 0) fen += count;
         fen += '/'
         count = 0;
      }
    }
    if (count > 0 ) fen += count
    fen += this._turn === 'white' ? ' w' : ' b'
    let castlingRights = ''
    if (this._hasWhiteKingSideCastleRight) castlingRights += 'K'
    if (this._hasWhiteQueenSideCastleRight) castlingRights += 'Q'
    if (this._hasBlackKingSideCastleRight) castlingRights += 'k'
    if (this._hasBlackQueenSideCastleRight) castlingRights += 'q'
    if (castlingRights === '') castlingRights = '-'
    fen += ` ${castlingRights}`

    if (this._enPassantTargetSquare != null) {
      fen += ` ${INDEX_TO_SQUARE[this._enPassantTargetSquare.log2()]}`
    } else {
      fen += ' -'
    }
    fen += ` ${this._halfMoveClock}`;
    fen += ` ${this._fullMoveNumber}`

    return fen
  }

  loadAll(fen: string) {
    const chunks = fen.split(' ')
    const pieces = chunks[0]
    this._bitboards['white'] = { P: ZERO, N: ZERO, B: ZERO, R: ZERO, Q: ZERO, K: ZERO } as Record<Piece, Int64>
    this._bitboards['black'] = { P: ZERO, N: ZERO, B: ZERO, R: ZERO, Q: ZERO, K: ZERO } as Record<Piece, Int64>
    let index = 0;
    for (const char of pieces) {
      if (char === '/') continue;
      const number = getInteger(char)
      if (number !== NOT_NUMBER) {
        index += number;
      } else if (char === char.toLowerCase()) {
        const piece = charToPiece(char)
        const flag = this.getFlag(63 - index)
        this._bitboards['black'][piece] = this._bitboards['black'][piece].or(flag)
        index += 1;
      } else {
        const piece: Piece = char as Piece
        const flag = this.getFlag(63 - index)
        this._bitboards['white'][piece] = this._bitboards['white'][piece].or(flag)
        index += 1;
      }
    }
    this._turn = chunks[1] === 'w' ? 'white' : 'black'
    this._hasWhiteKingSideCastleRight = chunks[2].includes('K')
    this._hasWhiteQueenSideCastleRight = chunks[2].includes('Q')
    this._hasBlackKingSideCastleRight = chunks[2].includes('k')
    this._hasBlackQueenSideCastleRight = chunks[2].includes('q')
    this._enPassantTargetSquare = FLAGS_LOOKUP_INDEX[SQUARE_INDEX[chunks[3]]]
    this._halfMoveClock = parseInt(chunks[4])
    this._fullMoveNumber = parseInt(chunks[5])
  }

  toBinaryString(input: string, char: string) {
    let binaryString = '0b'
    for(const c of input) {
      binaryString += (c === char ? '1' : '0')
    }
    return binaryString
  }
  
  getFlag(index: number) {
    return FLAGS_LOOKUP_INDEX[index]
  }

  getIndex(i: number, j: number) {
    return 63 - ((i * 8) + j)
  }

  isCheck(kingPos: Int64, color: Color) {
    var oppositeColor: Color = this.flipColor(color)
    let pawnAttacks: Int64 = color === 'white' 
      ? kingPos.shl(SEVEN).or(kingPos.shl(NINE)) 
      : kingPos.shr(SEVEN).or(kingPos.shr(NINE))
    const bishopMoves = checkBishopMoves(this, kingPos, color)
    const rookMoves = checkRookMoves(this, kingPos, color)
    return this.hasPiece(pawnAttacks, this._bitboards[oppositeColor]['P'])
    || this.hasPiece(checkKnightMoves(this, kingPos, color), this._bitboards[oppositeColor]['N'])
    || this.hasPiece(bishopMoves, this._bitboards[oppositeColor]['B'])
    || this.hasPiece(rookMoves, this._bitboards[oppositeColor]['R'])
    || this.hasPiece(bishopMoves.or(rookMoves), this._bitboards[oppositeColor]['Q'])
  }

  getPiecesForColor(color: Color) {
    return this._bitboards[color]['P']
    .or(this._bitboards[color]['N'])
    .or(this._bitboards[color]['B'])
    .or(this._bitboards[color]['R'])
    .or(this._bitboards[color]['Q'])
    .or(this._bitboards[color]['K'])
  }

  getAllPieces() {
    return this.getPiecesForColor('white').or(this.getPiecesForColor('black'))
  }

  checkMoves(index: number, piecesForColor: Int64) {
    const flag = this.getFlag(index)
    const color = this._turn
    const piece = this.getPiece(flag)
    if (!this.hasPiece(piecesForColor, flag)) return ZERO
    let moves = ZERO
    if (piece === 'P') moves = checkPawnMoves(this, flag, color)
    else if (piece === 'N') moves =  checkKnightMoves(this, flag, color)
    else if (piece === 'B') moves =  checkBishopMoves(this, flag, color)
    else if (piece === 'R') moves =  checkRookMoves(this, flag, color)
    else if (piece === 'Q') moves =  checkQueenMoves(this, flag, color)
    else if (piece === 'K') moves = checkKingMoves(this, flag, color)
    moves = this.checkMovesForCheck(moves, color, index)
    return moves
  }

  /**
   * Backpropagate from the king to check if a piece can cause check
   * @param king 
   * @param color 
   * @returns lookup of positions that can cause check for each piece.
   */
  getCheckingMoves(king: Int64, index: number, color: Color): Record<Piece, Int64> {
    const bishopMoves = checkBishopMoves(this, king, color)
    const rookMoves = checkRookMoves(this, king, color)
    const kingMoves = checkKingMoves(this, king, color)
    const pawnMoves = this.checkPawnCapturesForCheck(king, color)
    return {
      'P': pawnMoves,
      'N': checkKnightMoves(this, king, color),
      'B': bishopMoves,
      'R': rookMoves,
      'Q': bishopMoves.or(rookMoves),
      'K': kingMoves
    }
  }

  checkPawnCapturesForCheck(king: Int64, color: Color) {
    const index = king.log2()
    const x = index % 8
    const y = Math.floor(index / 8)
    let moves = ZERO
    if (color === 'white') {
      if (x > 0 && y < 6) moves = moves.or(king.shl(SEVEN))
      if (x < 7 && y < 6) moves = moves.or(king.shl(NINE))
    } else {
      if (x > 0 && y > 1) moves = moves.or(king.shr(NINE))
      if (x < 7 && y > 1) moves = moves.or(king.shr(SEVEN))
    }
    return moves
  }

  checkMovesForCheck(moves: Int64, color: Color, index: number) {
    if (moves.isZero()) return moves

    const oppositeColor = this.flipColor(color)
    const king = this._bitboards[color]['K']
    let checkingMoves = this.getCheckingMoves(king, index, color)
    if (moves.isFlag()) return this.testMoveForCheck(
      index,
      moves.log2(),
      color,
      oppositeColor,
      moves,
      checkingMoves
    )
    let legalMoves = ZERO
    for(let moveIndex = 0; moveIndex < 64; moveIndex++) {
      const currentMove = this.getFlag(moveIndex)
      if (this.hasPiece(moves, currentMove)) {
        legalMoves = legalMoves.or(this.testMoveForCheck(
          index,
          moveIndex,
          color,
          oppositeColor,
          currentMove,
          checkingMoves
        ))
      }
    }
    return legalMoves
  }

  testMoveForCheck(
      index: number, 
      moveIndex: number, 
      color: Color,
      oppositeColor: Color,
      currentMove: Int64,
      checkingMoves: Record<Piece, Int64>) {
    this.applyMove(index, moveIndex)

    const newKing =  this._bitboards[color]['K']
    checkingMoves = this.getCheckingMoves(newKing, index, color)
    const isCheck = this.hasPiece(checkingMoves['P'], this._bitboards[oppositeColor]['P']) 
      || this.hasPiece(checkingMoves['N'], this._bitboards[oppositeColor]['N'])
      || this.hasPiece(checkingMoves['B'], this._bitboards[oppositeColor]['B'])
      || this.hasPiece(checkingMoves['R'], this._bitboards[oppositeColor]['R'])
      || this.hasPiece(checkingMoves['Q'], this._bitboards[oppositeColor]['Q'])
      || this.hasPiece(checkingMoves['K'], this._bitboards[oppositeColor]['K'])

    this.undoMove()

    if (!isCheck) return currentMove
    return ZERO
  }

  getMoveIndexesFromIndex(index: number) {
    const whitePieces = this.getPiecesForColor('white')
    const fromFlag = this.getFlag(index)
    const color: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const pieces = color === 'white' ? whitePieces : this.getPiecesForColor('black')
    return this.getMoveIndexes(index, pieces)
  }

  getMoveIndexes(index: number, piecesForColor: Int64) {
    const moves = this.checkMoves(index, piecesForColor)
    const indexes = []
    for (let i = 0; i < 64; i++) {
      const toFlag = this.getFlag(i)
      if (this.hasPiece(moves, toFlag)) {
        indexes.push(i)
      }
    }
    return indexes
  }

  applyCastlingMove(toIndex: number) {
    if (toIndex === 1) {
      this._bitboards['white']['R'] = this._bitboards['white']['R'].xor(ONE)
      this._bitboards['white']['R'] = this._bitboards['white']['R'].or(this.getFlag(2))
    } else if (toIndex === 5) {
      this._bitboards['white']['R'] = this._bitboards['white']['R'].xor(this.getFlag(7))
      this._bitboards['white']['R'] = this._bitboards['white']['R'].or(this.getFlag(4))
    } else if (toIndex === 57) {
      this._bitboards['black']['R'] = this._bitboards['black']['R'].xor(this.getFlag(56))
      this._bitboards['black']['R'] = this._bitboards['black']['R'].or(this.getFlag(58))
    } else if (toIndex === 61) {
      this._bitboards['black']['R'] = this._bitboards['black']['R'].xor(this.getFlag(63))
      this._bitboards['black']['R'] = this._bitboards['black']['R'].or(this.getFlag(60))
    }
  }

  updateCastlingRights(from: number) {
    if (this._hasWhiteKingSideCastleRight && (from === SQUARE_INDEX.h1 || from === SQUARE_INDEX.e1)) {
      this._hasWhiteKingSideCastleRight = false;
    } if (this._hasWhiteQueenSideCastleRight && (from === SQUARE_INDEX.e1 || from === SQUARE_INDEX.a1)) {
      this._hasWhiteQueenSideCastleRight = false;
    } if (this._hasBlackKingSideCastleRight && (from === SQUARE_INDEX.h8 || from === SQUARE_INDEX.e8)) {
      this._hasBlackKingSideCastleRight = false;
    } if (this._hasBlackQueenSideCastleRight && (from === SQUARE_INDEX.e8 || from === SQUARE_INDEX.a8)) {
      this._hasBlackQueenSideCastleRight = false;
    }
  }

  applyEnPassant(to: number, color: Color) {
    if (this._enPassantTargetSquare == null) return
    if (color === 'white' && (!this._enPassantTargetSquare.shr(8).equals(this.getFlag(to)))) {
      this._bitboards['black']['P'] =  this._bitboards['black']['P'].xor(this._enPassantTargetSquare.shr(8))
    } else {
      this._bitboards['white']['P'] =  this._bitboards['white']['P'].xor(this._enPassantTargetSquare.shl(8))
    }
  }

  checkEnPassant(from: number, to: number, fromPiece: Piece) {
    if (fromPiece === 'P' && Math.abs(from - to) === 16) {
      const enPassantIndex = (from + to) / 2
      const toFlag = this.getFlag(to)
      if (this._turn === 'white') {
         const blackPawns = this._bitboards['black']['P']
         const blackPawnsThatCouldCapture = toFlag.shr(1).or(toFlag.shl(1))
         if (this.hasPiece(blackPawns, blackPawnsThatCouldCapture)) {
          this._enPassantTargetSquare = this.getFlag(enPassantIndex)
         }
      } else {
        const whitePawns = this._bitboards['white']['P']
        const whitePawnsThatCouldCapture = toFlag.shr(1).or(toFlag.shl(1))
        if (this.hasPiece(whitePawns, whitePawnsThatCouldCapture)) {
          this._enPassantTargetSquare = this.getFlag(enPassantIndex)
        }
      }
    } else {
      this._enPassantTargetSquare = null;
    }
  }

  applyMove(from: number, to: number): MoveResult {

    this._history.push(this.save())

    const whitePieces = this.getPiecesForColor('white')
    const fromFlag = this.getFlag(from)
    const fromColor: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const fromPiece = this.getPiece(fromFlag)
    if (fromPiece == null) {
      debugger;
      throw new Error(`Cannot find the piece to move at index: ${from}`)
    }
    const toFlag = this.getFlag(to)

    this.applyEnPassant(to, fromColor)
    this.checkEnPassant(from, to, fromPiece)
    
    if (fromPiece === 'K') {
      const diff = from - to
      if (diff === 2 || diff === -2) {
        this.applyCastlingMove(to)
      }
    }
    
    this.updateCastlingRights(from)

    const isPawnMove = fromPiece === 'P'
    const toPiece = this.getPiece(toFlag)
    const isCapture = toPiece != null
    if (isCapture) {
      this.capturePiece(toPiece, toFlag)
    }

    // Clear from position
    this._bitboards[fromColor][fromPiece] =  this._bitboards[fromColor][fromPiece].xor(fromFlag)
      
    // Set board with new piece on to position
    this._bitboards[fromColor][fromPiece] = this._bitboards[fromColor][fromPiece].or(toFlag)
    this._turn = this.flipColor(this._turn)
    
    const oppositeColor = this.flipColor(fromColor)
    const oppositeKing = this._bitboards[oppositeColor]['K']
    const isCheck = this.isCheck(oppositeKing, oppositeColor)

    if (this._turn === 'black')
      this._fullMoveNumber++;

    if (!isCapture && !isPawnMove) {
      this._halfMoveClock++
    } else {
      this._halfMoveClock = 0
    }

    return {
      isPromotion: this.isPromotion(toFlag, fromColor, fromPiece),
      movedTo: to,
      isCheck: isCheck
    }
  }

  isCheckmate() {
    const blackKing = this._bitboards['black']['K']
    if (this.isCheck(blackKing, 'black')) {
      const moves = getAllLegalMoves(this, 'black')
      if (moves.length === 0) return true;
    }
    const whiteKing = this._bitboards['white']['K']
    if (this.isCheck(whiteKing, 'white')) {
      const moves = getAllLegalMoves(this, 'white')
      if (moves.length === 0) return true;
    }
    return false
  }

  getColor(flag: Int64) {
    return this.hasPiece(this.getPiecesForColor('white'), flag) ? 'white' : 'black'
  }

  capturePiece(toPiece: Piece, toFlag: Int64) {
    const toColor: Color = this.getColor(toFlag)
    this._bitboards[toColor][toPiece] = this._bitboards[toColor][toPiece].xor(toFlag)
  }

  isPromotion(toFlag: Int64, fromColor: Color, fromPiece: Piece) {
    if (fromPiece !== 'P') return false;
    if (fromColor === 'white') return this.hasPiece(WHITE_PROMOTION_RANK, toFlag)
    return this.hasPiece(BLACK_PROMOTION_RANK, toFlag)
  }

  applyPromotion(position: number, piece: PromotablePiece) {
    const flag = this.getFlag(position)
    const color: Color = this.getColor(flag)
    this._bitboards[color]['P'] = this._bitboards[color]['P'].xor(flag)
    this._bitboards[color][piece] = this._bitboards[color][piece].or(flag)
  }

  undoMove() {
    const lastState = this._history.pop()
    if (lastState) {
      this.loadAll(lastState)
    }
    return lastState
  }

  flipColor(color: Color) {
    return color === 'white' ? 'black' : 'white'
  }

  getPiece(flag: Int64): Piece | null {
    const whitePieces = this._bitboards['white']
    const blackPieces = this._bitboards['black']
    if (this.hasPiece(whitePieces['P'], flag) || this.hasPiece(blackPieces['P'], flag)) return 'P'
    if (this.hasPiece(whitePieces['N'], flag) || this.hasPiece(blackPieces['N'], flag)) return 'N'
    if (this.hasPiece(whitePieces['B'], flag) || this.hasPiece(blackPieces['B'], flag)) return 'B'
    if (this.hasPiece(whitePieces['R'], flag) || this.hasPiece(blackPieces['R'], flag)) return 'R'
    if (this.hasPiece(whitePieces['Q'], flag) || this.hasPiece(blackPieces['Q'], flag)) return 'Q'
    if (this.hasPiece(whitePieces['K'], flag) || this.hasPiece(blackPieces['K'], flag)) return 'K'
    return null
  }

  hasPiecePooled(bitboard: Int64, pos: Int64) {

  }

  hasPiece(bitboard: Int64, pos: Int64) {
    return !(bitboard.and(pos).isZero())
  }

  toNotation(fromIndex: number, toIndex: number) {
    const fromFlag = this.getFlag(fromIndex)
    const fromPiece = this.getPiece(fromFlag)
    const toFlag = this.getFlag(toIndex)
    const toPiece = this.getPiece(toFlag)
    const file = files[fromIndex % 7]
    const rank = Math.floor(toIndex / 8)
    const capture = toPiece != null ? 'x' : ''
    return `${fromPiece}${capture}${file}${rank+1}`
  }

  toBoardView() {
    const boardView: Square[][] = []
    for (let i = 0; i < 8; i++) {
      const row: Square[] = []
      for (let j = 0; j < 8; j++) {
        const index = this.getIndex(i, j)
        const flag = this.getFlag(index)
        const piece = this.getPiece(flag)
        const color = this.hasPiece(this.getPiecesForColor('white'), flag) ? 'white' : 'black'
        row.push({ piece, color, index })
      }
      boardView.push(row)
    }
    return boardView
  }
}



  export type MoveResult = {
    isPromotion: boolean
    movedTo: number
    isCheck: boolean
  }

 