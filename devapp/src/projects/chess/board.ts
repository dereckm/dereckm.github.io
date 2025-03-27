import Int64, { ZERO, ONE } from "../../logic/Int64"
import { Color, Piece, PromotablePiece } from './models/Piece'
import { Square } from './models/Square'
import { 
  checkPawnMoves, checkKnightMoves, checkBishopMoves, 
  checkRookMoves, checkQueenMoves, checkKingMoves,
  getAllLegalMoves
 } from './logic/move-generation/moves'
import { FLAGS_LOOKUP_INDEX, INDEX_TO_SQUARE, SQUARE_INDEX } from "./constants/squares"
import { FENParser } from "./utilities/parse-fen"
import { BoardModel } from "./models/BoardModel"

const fenParser = new FENParser()

const SEVEN = 7
const NINE = 9

const WHITE_PROMOTION_RANK = Int64.fromString("0b1111111100000000000000000000000000000000000000000000000000000000")
const BLACK_PROMOTION_RANK = Int64.fromString("0b0000000000000000000000000000000000000000000000000000000011111111")

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export default class ChessBoard {
  _history: string[] = []
  _data: BoardModel
  _isCheck: boolean = false

  constructor(state: string) {
    this._data = fenParser.parseFEN(state)
  }

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
    fen += this._data._turn === 'white' ? ' w' : ' b'
    let castlingRights = ''
    if (this._data._hasWhiteKingSideCastleRight) castlingRights += 'K'
    if (this._data._hasWhiteQueenSideCastleRight) castlingRights += 'Q'
    if (this._data._hasBlackKingSideCastleRight) castlingRights += 'k'
    if (this._data._hasBlackQueenSideCastleRight) castlingRights += 'q'
    if (castlingRights === '') castlingRights = '-'
    fen += ` ${castlingRights}`

    if (this._data._enPassantTargetSquare != null) {
      fen += ` ${INDEX_TO_SQUARE[this._data._enPassantTargetSquare.log2()]}`
    } else {
      fen += ' -'
    }
    fen += ` ${this._data._halfMoveClock}`;
    fen += ` ${this._data._fullMoveNumber}`

    return fen
  }

  parseTurn() {

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
    const sameColorPieces = this.getPiecesForColor(color)
    const oppositeColorPieces = this.getPiecesForColor(this.flipColor(color))
    const bishopMoves = checkBishopMoves(this, kingPos, oppositeColorPieces, sameColorPieces)
    const rookMoves = checkRookMoves(this, kingPos,  oppositeColorPieces, sameColorPieces)
    return this.hasPiece(pawnAttacks, this._data._bitboards[oppositeColor]['P'])
    || this.hasPiece(checkKnightMoves(this, kingPos, color), this._data._bitboards[oppositeColor]['N'])
    || this.hasPiece(bishopMoves, this._data._bitboards[oppositeColor]['B'])
    || this.hasPiece(rookMoves, this._data._bitboards[oppositeColor]['R'])
    || this.hasPiece(bishopMoves.or(rookMoves), this._data._bitboards[oppositeColor]['Q'])
  }

  getPiecesForColor(color: Color) {
    return this._data._bitboards[color]['P']
    .or(this._data._bitboards[color]['N'])
    .or(this._data._bitboards[color]['B'])
    .or(this._data._bitboards[color]['R'])
    .or(this._data._bitboards[color]['Q'])
    .or(this._data._bitboards[color]['K'])
  }

  getAllPieces() {
    return this.getPiecesForColor('white').or(this.getPiecesForColor('black'))
  }

  checkMoves(index: number, sameColorPieces: Int64, oppositeColorPieces: Int64) {
    const flag = this.getFlag(index)
    const color = this._data._turn
    const piece = this.getPiece(flag)
    if (!this.hasPiece(sameColorPieces, flag)) return ZERO
    let moves = ZERO
    if (piece === 'P') moves = checkPawnMoves(this, flag, color)
    else if (piece === 'N') moves =  checkKnightMoves(this, flag, color)
    else if (piece === 'B') moves =  checkBishopMoves(this, flag, oppositeColorPieces, sameColorPieces)
    else if (piece === 'R') moves =  checkRookMoves(this, flag, oppositeColorPieces, sameColorPieces)
    else if (piece === 'Q') moves =  checkQueenMoves(this, flag, oppositeColorPieces, sameColorPieces)
    else if (piece === 'K') moves = checkKingMoves(this, flag, color)
    moves = this.checkMovesForCheck(moves, color, index, sameColorPieces, oppositeColorPieces)
    return moves
  }

  /**
   * Backpropagate from the king to check if a piece can cause check
   * @param king 
   * @param color 
   * @returns lookup of positions that can cause check for each piece.
   */
  getCheckingMoves(king: Int64, index: number, color: Color, sameColorPieces: Int64, oppositeColorPieces: Int64): Record<Piece, Int64> {
    const bishopMoves = checkBishopMoves(this, king, oppositeColorPieces, sameColorPieces)
    const rookMoves = checkRookMoves(this, king, oppositeColorPieces, sameColorPieces)
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

  checkMovesForCheck(moves: Int64, color: Color, index: number, sameColorPieces: Int64, oppositeColorPieces: Int64) {
    if (moves.isZero()) return moves

    const oppositeColor = this.flipColor(color)
    const king = this._data._bitboards[color]['K']
    let checkingMoves = this.getCheckingMoves(king, index, color, sameColorPieces, oppositeColorPieces)
    if (moves.isFlag()) return this.testMoveForCheck(
      index,
      moves.log2(),
      color,
      oppositeColor,
      moves,
      checkingMoves,
      sameColorPieces,
      oppositeColorPieces
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
          checkingMoves,
          sameColorPieces,
          oppositeColorPieces
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
      checkingMoves: Record<Piece, Int64>,
      sameColorPieces: Int64, 
      oppositeColorPieces: Int64) {
    this.applyMove(index, moveIndex)

    const newKing =  this._data._bitboards[color]['K']
    checkingMoves = this.getCheckingMoves(newKing, index, color, sameColorPieces, oppositeColorPieces)
    const isCheck = this.hasPiece(checkingMoves['P'], this._data._bitboards[oppositeColor]['P']) 
      || this.hasPiece(checkingMoves['N'], this._data._bitboards[oppositeColor]['N'])
      || this.hasPiece(checkingMoves['B'], this._data._bitboards[oppositeColor]['B'])
      || this.hasPiece(checkingMoves['R'], this._data._bitboards[oppositeColor]['R'])
      || this.hasPiece(checkingMoves['Q'], this._data._bitboards[oppositeColor]['Q'])
      || this.hasPiece(checkingMoves['K'], this._data._bitboards[oppositeColor]['K'])

    this.undoMove()

    if (!isCheck) return currentMove
    return ZERO
  }

  getMoveIndexesFromIndex(index: number) {
    const whitePieces = this.getPiecesForColor('white')
    const fromFlag = this.getFlag(index)
    const color: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const pieces = color === 'white' ? whitePieces : this.getPiecesForColor('black')
    const oppositePieces = color === 'white' ? this.getPiecesForColor('black') : whitePieces
    return this.getMoveIndexes(index, pieces, oppositePieces)
  }

  getMoveIndexesWithPieces() {

  }

  getMoveIndexes(index: number, sameColorPieces: Int64, oppositeColorPieces: Int64) {
    const moves = this.checkMoves(index, sameColorPieces, oppositeColorPieces)
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
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].xor(ONE)
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].or(this.getFlag(2))
    } else if (toIndex === 5) {
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].xor(this.getFlag(7))
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].or(this.getFlag(4))
    } else if (toIndex === 57) {
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].xor(this.getFlag(56))
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].or(this.getFlag(58))
    } else if (toIndex === 61) {
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].xor(this.getFlag(63))
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].or(this.getFlag(60))
    }
  }

  updateCastlingRights(from: number) {
    if (this._data._hasWhiteKingSideCastleRight && (from === SQUARE_INDEX.h1 || from === SQUARE_INDEX.e1)) {
      this._data._hasWhiteKingSideCastleRight = false;
    } if (this._data._hasWhiteQueenSideCastleRight && (from === SQUARE_INDEX.e1 || from === SQUARE_INDEX.a1)) {
      this._data._hasWhiteQueenSideCastleRight = false;
    } if (this._data._hasBlackKingSideCastleRight && (from === SQUARE_INDEX.h8 || from === SQUARE_INDEX.e8)) {
      this._data._hasBlackKingSideCastleRight = false;
    } if (this._data._hasBlackQueenSideCastleRight && (from === SQUARE_INDEX.e8 || from === SQUARE_INDEX.a8)) {
      this._data._hasBlackQueenSideCastleRight = false;
    }
  }

  applyEnPassant(to: number, color: Color) {
    if (this._data._enPassantTargetSquare == null) return
    if (color === 'white' && (!this._data._enPassantTargetSquare.shr(8).equals(this.getFlag(to)))) {
      this._data._bitboards['black']['P'] =  this._data._bitboards['black']['P'].xor(this._data._enPassantTargetSquare.shr(8))
    } else {
      this._data._bitboards['white']['P'] =  this._data._bitboards['white']['P'].xor(this._data._enPassantTargetSquare.shl(8))
    }
  }

  checkEnPassant(from: number, to: number, fromPiece: Piece) {
    if (fromPiece === 'P' && Math.abs(from - to) === 16) {
      const enPassantIndex = (from + to) / 2
      const toFlag = this.getFlag(to)
      if (this._data._turn === 'white') {
         const blackPawns = this._data._bitboards['black']['P']
         const blackPawnsThatCouldCapture = toFlag.shr(1).or(toFlag.shl(1))
         if (this.hasPiece(blackPawns, blackPawnsThatCouldCapture)) {
          this._data._enPassantTargetSquare = this.getFlag(enPassantIndex)
         }
      } else {
        const whitePawns = this._data._bitboards['white']['P']
        const whitePawnsThatCouldCapture = toFlag.shr(1).or(toFlag.shl(1))
        if (this.hasPiece(whitePawns, whitePawnsThatCouldCapture)) {
          this._data._enPassantTargetSquare = this.getFlag(enPassantIndex)
        }
      }
    } else {
      this._data._enPassantTargetSquare = null;
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
    this._data._bitboards[fromColor][fromPiece] =  this._data._bitboards[fromColor][fromPiece].xor(fromFlag)
      
    // Set board with new piece on to position
    this._data._bitboards[fromColor][fromPiece] = this._data._bitboards[fromColor][fromPiece].or(toFlag)
    this._data._turn = this.flipColor(this._data._turn)
    
    const oppositeColor = this.flipColor(fromColor)
    const oppositeKing = this._data._bitboards[oppositeColor]['K']
    const isCheck = this.isCheck(oppositeKing, oppositeColor)

    if (this._data._turn === 'black')
      this._data._fullMoveNumber++;

    if (!isCapture && !isPawnMove) {
      this._data._halfMoveClock++
    } else {
      this._data._halfMoveClock = 0
    }

    return {
      isPromotion: this.isPromotion(toFlag, fromColor, fromPiece),
      movedTo: to,
      isCheck: isCheck,
      isCapture: isCapture
    }
  }

  isCheckmate() {
    const blackKing = this._data._bitboards['black']['K']
    if (this.isCheck(blackKing, 'black')) {
      const moves = getAllLegalMoves(this, 'black')
      if (moves.length === 0) return true;
    }
    const whiteKing = this._data._bitboards['white']['K']
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
    this._data._bitboards[toColor][toPiece] = this._data._bitboards[toColor][toPiece].xor(toFlag)
  }

  isPromotion(toFlag: Int64, fromColor: Color, fromPiece: Piece) {
    if (fromPiece !== 'P') return false;
    if (fromColor === 'white') return this.hasPiece(WHITE_PROMOTION_RANK, toFlag)
    return this.hasPiece(BLACK_PROMOTION_RANK, toFlag)
  }

  applyPromotion(position: number, piece: PromotablePiece) {
    const flag = this.getFlag(position)
    const color: Color = this.getColor(flag)
    this._data._bitboards[color]['P'] = this._data._bitboards[color]['P'].xor(flag)
    this._data._bitboards[color][piece] = this._data._bitboards[color][piece].or(flag)

    const oppositeColor = this.flipColor(color)
    const oppositeKing = this._data._bitboards[oppositeColor]['K']
    const isCheck = this.isCheck(oppositeKing, oppositeColor)
    return isCheck
  }

  undoMove() {
    const lastState = this._history.pop()
    if (lastState) {
      this._data = fenParser.parseFEN(lastState)
    }
    return lastState
  }

  flipColor(color: Color) {
    return color === 'white' ? 'black' : 'white'
  }

  getPiece(flag: Int64): Piece | null {
    const whitePieces = this._data._bitboards['white']
    const blackPieces = this._data._bitboards['black']
    if (this.hasPiece(whitePieces['P'], flag) || this.hasPiece(blackPieces['P'], flag)) return 'P'
    if (this.hasPiece(whitePieces['N'], flag) || this.hasPiece(blackPieces['N'], flag)) return 'N'
    if (this.hasPiece(whitePieces['B'], flag) || this.hasPiece(blackPieces['B'], flag)) return 'B'
    if (this.hasPiece(whitePieces['R'], flag) || this.hasPiece(blackPieces['R'], flag)) return 'R'
    if (this.hasPiece(whitePieces['Q'], flag) || this.hasPiece(blackPieces['Q'], flag)) return 'Q'
    if (this.hasPiece(whitePieces['K'], flag) || this.hasPiece(blackPieces['K'], flag)) return 'K'
    return null
  }

  hasPiece(bitboard: Int64, pos: Int64) {
    return !((bitboard.low & pos.low) === 0 && (bitboard.high & pos.high) === 0) // Avoid using Int64 ops that create objs when just checking something bool
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
    isCapture: boolean
  }

 