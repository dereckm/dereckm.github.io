import Int64, { ZERO } from "../../../../logic/Int64"
import { Color, Piece, PromotablePiece } from '../../models/Piece'
import { Square } from '../../models/Square'
import { 
  getAllLegalMoves,
  getCheckingMoves
 } from '../move-generation/moves'
import { FLAGS_LOOKUP_INDEX, SQUARE_INDEX } from "../../constants/squares"
import { FENParser } from "../../utilities/parse-fen"
import { BoardModel } from "../../models/BoardModel"
import { FenWriter } from "../../utilities/fen-writer"

const fenParser = new FENParser()
const fenWriter = new FenWriter()

const SEVEN = 7
const NINE = 9

const WHITE_PROMOTION_RANK = Int64.fromString("0b1111111100000000000000000000000000000000000000000000000000000000")
const BLACK_PROMOTION_RANK = Int64.fromString("0b0000000000000000000000000000000000000000000000000000000011111111")
const PROMOTIONS_RANKS: Record<Color, Int64> = {
  'white': WHITE_PROMOTION_RANK,
  'black': BLACK_PROMOTION_RANK
}

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']


export default class ChessBoard {
  _history: string[] = []
  _data: BoardModel
  _isCheck: boolean = false

  constructor(state: string) {
    this._data = fenParser.parseFEN(state)
  }

  clone() {
    const b = new ChessBoard(fenWriter.write(this))
    b._history = [...this._history]
    return b
  }

  save() {
    return fenWriter.write(this)
  }

  hash() {
    return fenWriter.writeWithoutMoveCounters(this)
  }
  
  getFlag(index: number) {
    return FLAGS_LOOKUP_INDEX[index]
  }

  getIndex(i: number, j: number) {
    return 63 - ((i * 8) + j)
  }

  isOpponentInCheckState() {
    this._data._turn = this.flipColor(this._data._turn)
    const isCheck = this.isCheckState()
    this._data._turn  = this.flipColor(this._data._turn)
    return isCheck
  }

  /**
   * Checks whether the current player is in check.
   * @returns true if current player in check, otherwise false.
   */
  isCheckState() {
    const color: Color = this._data._turn
    const opponentColor = this.flipColor(color)
    const king = this._data._bitboards[color]['K']
    const sameColorPieces = this.getPiecesForColor(color)
    const opponentPieces = this.getPiecesForColor(opponentColor)
    const checkingMoves = getCheckingMoves(this, king, color, sameColorPieces, opponentPieces)

    const oppositePieces: Record<string, Int64> = this._data._bitboards[opponentColor]
    const isCheck = this.hasPiece(checkingMoves['P'], oppositePieces['P'])
        || this.hasPiece(checkingMoves['N'], oppositePieces['N'])
        || this.hasPiece(checkingMoves['B'], oppositePieces['B'])
        || this.hasPiece(checkingMoves['R'], oppositePieces['R'])
        || this.hasPiece(checkingMoves['Q'], oppositePieces['Q'])
        || this.hasPiece(checkingMoves['K'], oppositePieces['K'])
      return isCheck;
  }

  getPiecesForColor(color: Color) {
    const flag = this._data._bitboards[color]['P']
    const inPlaceFlag = new Int64(flag.low, flag.high)
      .mutate_or(this._data._bitboards[color]['N'])
      .mutate_or(this._data._bitboards[color]['B'])
      .mutate_or(this._data._bitboards[color]['R'])
      .mutate_or(this._data._bitboards[color]['Q'])
      .mutate_or(this._data._bitboards[color]['K'])
    return inPlaceFlag
  }

  getAllPieces() {
    return this.getPiecesForColor('white').or(this.getPiecesForColor('black'))
  }

  checkPawnCapturesForCheck(king: Int64, color: Color) {
    const index = king.log2()
    const x = index % 8
    const y = Math.floor(index / 8)
    let moves = ZERO
    if (color === 'white') {
      if (x > 0 && y > 1) moves = moves.or(king.shl(SEVEN))
      if (x < 7 && y > 1) moves = moves.or(king.shl(NINE))
    } else {
      if (x > 0 && y < 6) moves = moves.or(king.shr(NINE))
      if (x < 7 && y < 6) moves = moves.or(king.shr(SEVEN))
    }
    return moves
  }

  updateCastlingRights(from: number, to: number) {
    if (this._data._hasWhiteKingSideCastleRight && (from === SQUARE_INDEX.h1 || from === SQUARE_INDEX.e1 || to === SQUARE_INDEX.h1)) {
      this._data._hasWhiteKingSideCastleRight = false;
    } 
    if (this._data._hasWhiteQueenSideCastleRight && (from === SQUARE_INDEX.e1 || from === SQUARE_INDEX.a1 || to === SQUARE_INDEX.a1)) {
      this._data._hasWhiteQueenSideCastleRight = false;
    } 
    if (this._data._hasBlackKingSideCastleRight && (from === SQUARE_INDEX.h8 || from === SQUARE_INDEX.e8 || to === SQUARE_INDEX.h8)) {
      this._data._hasBlackKingSideCastleRight = false;
    } 
    if (this._data._hasBlackQueenSideCastleRight && (from === SQUARE_INDEX.e8 || from === SQUARE_INDEX.a8 || to === SQUARE_INDEX.a8)) {
      this._data._hasBlackQueenSideCastleRight = false;
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

  isAwaitingPromotionState() {
    const color = this.flipColor(this._data._turn) // moving the pawn already changed turn
    const pawns = this._data._bitboards[color]['P']
    return this.hasPiece(PROMOTIONS_RANKS[color], pawns)
  }

  isCheckmateState() {
    if (!this.isCheckState()) return false

    const playerColor = this._data._turn
    const moves = getAllLegalMoves(this, playerColor)
    return moves.length === 0
  }

  isStalemate() {
    if (this.isCheckState()) return false

  }

  getColor(flag: Int64) {
    return this.hasPiece(this.getPiecesForColor('white'), flag) ? 'white' : 'black'
  }

  capturePiece(toPiece: Piece, toFlag: Int64) {
    const toColor: Color = this.getColor(toFlag)
    this._data._bitboards[toColor][toPiece] = this._data._bitboards[toColor][toPiece].xor(toFlag)
  }

  applyPromotion(position: number, piece: PromotablePiece) {
    const flag = this.getFlag(position)
    const color: Color = this.getColor(flag)
    this._data._bitboards[color]['P'] = this._data._bitboards[color]['P'].xor(flag)
    this._data._bitboards[color][piece] = this._data._bitboards[color][piece].or(flag)
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
