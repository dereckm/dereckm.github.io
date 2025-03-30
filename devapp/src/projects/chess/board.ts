import Int64, { ZERO, ONE } from "../../logic/Int64"
import { Color, Piece, PromotablePiece } from './models/Piece'
import { Square } from './models/Square'
import { 
  checkPawnMoves, checkKnightMoves, checkBishopMoves, 
  checkRookMoves, checkQueenMoves, checkKingMoves,
  getAllLegalMoves
 } from './logic/move-generation/moves'
import { FLAGS_LOOKUP_INDEX, INDEX_TO_SQUARE, SQUARE_FLAGS, SQUARE_INDEX } from "./constants/squares"
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

  save(asHash: boolean = false) {
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
    if (asHash) return fen;
    fen += ` ${this._data._halfMoveClock}`;
    fen += ` ${this._data._fullMoveNumber}`

    return fen
  }

  hash() {
    return this.save(true)
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

  checkMoves(fromIndex: number, sameColorPieces: Int64, oppositeColorPieces: Int64) {
    const flag = this.getFlag(fromIndex)
    const color = this._data._turn
    const piece = this.getPiece(flag)
    let moves = ZERO
    switch (piece) {
      case 'P': moves = checkPawnMoves(this, flag, color); break;
      case 'N': moves = checkKnightMoves(this, flag, color); break;
      case 'B': moves = checkBishopMoves(this, flag, oppositeColorPieces, sameColorPieces); break;
      case 'R': moves = checkRookMoves(this, flag, oppositeColorPieces, sameColorPieces); break;
      case 'Q': moves = checkQueenMoves(this, flag, oppositeColorPieces, sameColorPieces); break;
      case 'K': moves = checkKingMoves(this, flag, color); break;
    }
    if (moves.isZero()) return moves;
    moves = this.checkMovesForCheck(moves, color, fromIndex)
    return moves
  }

  /**
   * Backpropagate from the king to check if a piece can cause check
   * @param king 
   * @param color 
   * @returns lookup of positions that can cause check for each piece.
   */
  getCheckingMoves(king: Int64, color: Color, sameColorPieces: Int64, oppositeColorPieces: Int64): Record<Piece, Int64> {
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

  checkMovesForCheck(moves: Int64, color: Color, fromIndex: number) {
    if (moves.isZero()) return moves

    const oppositeColor = this.flipColor(color)
    let legalMoves = new Int64(0, 0)
    for(let moveIndex = 0; moveIndex < 64; moveIndex++) {
      const currentMove = this.getFlag(moveIndex)
      if (!this.hasPiece(moves, currentMove)) continue;
      legalMoves.mutate_or(this.testMoveForCheck(
        fromIndex,
        moveIndex,
        color,
        oppositeColor,
        currentMove,
      ))
    }
    return legalMoves
  }

  testMoveForCheck(
      index: number, 
      toIndex: number, 
      color: Color,
      oppositeColor: Color,
      currentMove: Int64) {
    const moveResult = this.applyMove(index, toIndex)
    const sameColorPieces = this.getPiecesForColor(color)
    const oppositeColorPieces = this.getPiecesForColor(this.flipColor(color))
    const king =  this._data._bitboards[color]['K']
    const checkingMoves = this.getCheckingMoves(king, color, sameColorPieces, oppositeColorPieces)

    const oppositePieces = this._data._bitboards[oppositeColor]
    const isCheck = this.hasPiece(checkingMoves['P'], oppositePieces['P']) 
      || this.hasPiece(checkingMoves['N'], oppositePieces['N'])
      || this.hasPiece(checkingMoves['B'], oppositePieces['B'])
      || this.hasPiece(checkingMoves['R'], oppositePieces['R'])
      || this.hasPiece(checkingMoves['Q'], oppositePieces['Q'])
      || this.hasPiece(checkingMoves['K'], oppositePieces['K'])

    this.undoMove(moveResult)

    if (!isCheck) return currentMove
    return ZERO
  }

  getMoveIndexesFromIndex(index: number) {
    const whitePieces = this.getPiecesForColor('white')
    const fromFlag = this.getFlag(index)
    const color: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    if (color !== this._data._turn) return []
    const pieces = color === 'white' ? whitePieces : this.getPiecesForColor('black')
    const oppositePieces = color === 'white' ? this.getPiecesForColor('black') : whitePieces
    return this.getMoveIndexes(index, pieces, oppositePieces)
  }

  getMoveIndexes(fromIndex: number, sameColorPieces: Int64, oppositeColorPieces: Int64) {
    const moves = this.checkMoves(fromIndex, sameColorPieces, oppositeColorPieces)
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
    if (toIndex === SQUARE_INDEX.g1) {
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].xor(SQUARE_FLAGS.h1)
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].or(SQUARE_FLAGS.f1)
    } else if (toIndex === SQUARE_INDEX.c1) {
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].xor(SQUARE_FLAGS.a1)
      this._data._bitboards['white']['R'] = this._data._bitboards['white']['R'].or(SQUARE_FLAGS.d1)
    } else if (toIndex === SQUARE_INDEX.g8) {
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].xor(SQUARE_FLAGS.h8)
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].or(SQUARE_FLAGS.f8)
    } else if (toIndex === SQUARE_INDEX.c8) {
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].xor(SQUARE_FLAGS.a8)
      this._data._bitboards['black']['R'] = this._data._bitboards['black']['R'].or(SQUARE_FLAGS.d8)
    }
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

  applyEnPassant(to: number, color: Color, fromPiece: Piece) {
    if (this._data._enPassantTargetSquare == null || fromPiece !== 'P') return false
    const toFlag = this.getFlag(to)
    if (this._data._enPassantTargetSquare !== toFlag) return false
    let isEnPassantMove = false;
    if (color === 'white' && toFlag === this._data._enPassantTargetSquare) {
      this._data._bitboards['black']['P'] =  this._data._bitboards['black']['P'].xor(this._data._enPassantTargetSquare.shr(8))
      isEnPassantMove = true
    } else if (color === 'black' && this._data._enPassantTargetSquare.shl(8).equals(this.getFlag(to))) {
      this._data._bitboards['white']['P'] =  this._data._bitboards['white']['P'].xor(this._data._enPassantTargetSquare.shl(8))
      isEnPassantMove = true
    }
    return isEnPassantMove
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
    const whitePieces = this.getPiecesForColor('white')
    const fromFlag = this.getFlag(from)
    const fromColor: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const fromPiece = this.getPiece(fromFlag)
    if (fromPiece == null) {
      debugger;
      throw new Error(`Cannot find the piece to move at index: ${from}`)
    }
    const toFlag = this.getFlag(to)

    const moveChanges: MoveChanges = {
      _halfMoveClock: this._data._halfMoveClock,
      _fullMoveNumber: this._data._fullMoveNumber,
      _hasWhiteKingSideCastleRight: this._data._hasWhiteKingSideCastleRight,
      _hasWhiteQueenSideCastleRight: this._data._hasWhiteQueenSideCastleRight,
      _hasBlackKingSideCastleRight: this._data._hasBlackKingSideCastleRight,
      _hasBlackQueenSideCastleRight: this._data._hasBlackQueenSideCastleRight,
      _enPassantTargetSquare: this._data._enPassantTargetSquare
    }

    const isEnPassantMove = this.applyEnPassant(to, fromColor, fromPiece)
    this.checkEnPassant(from, to, fromPiece)
    
    let isCastling = false
    if (fromPiece === 'K') {
      const diff = from - to
      if (diff === 2 || diff === -2) {
        isCastling = true
        this.applyCastlingMove(to)
      }
    }

    const isPawnMove = fromPiece === 'P'
    const toPiece = this.getPiece(toFlag)
    const isCapture = toPiece != null
    if (isCapture) {
      this.capturePiece(toPiece, toFlag)
    }
    
    this.updateCastlingRights(from, to)

    // Clear from position
    this._data._bitboards[fromColor][fromPiece] =  this._data._bitboards[fromColor][fromPiece].xor(fromFlag)
      
    // Set board with new piece on to position
    this._data._bitboards[fromColor][fromPiece] = this._data._bitboards[fromColor][fromPiece].or(toFlag)
    this._data._turn = this.flipColor(this._data._turn)
    
    const oppositeColor = this.flipColor(fromColor)
    const oppositeKing = this._data._bitboards[oppositeColor]['K']
    const isCheck = false

    if (this._data._turn === 'black')
      this._data._fullMoveNumber++;

    if (!isCapture && !isPawnMove) {
      this._data._halfMoveClock++
    } else {
      this._data._halfMoveClock = 0
    }

    const isPromotion = this.isPromotion(toFlag, fromColor, fromPiece)

    return {
      isPromotion: isPromotion,
      movedFrom: from,
      movedTo: to,
      isCheck: isCheck,
      capturedPiece: toPiece,
      isEnPassantMove: isEnPassantMove,
      isCastlingMove: isCastling,
      movedPiece: fromPiece,
      changes: moveChanges
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

  isStalemate() {
    return false;
    return getAllLegalMoves(this, this._data._turn).length === 0
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
  

  undoMove(move: MoveResult) {
    if (move == null) {
      debugger;
    }

    if (move.isEnPassantMove) {
      this.undoEnPassant(move)
    }
    if (move.capturedPiece != null) {
      this.undoCapture(move)
    }
    if (move.isCastlingMove) {
      this.undoCastlingMove(move)
    }
    this.undoPieceMove(move)
    this.undoChanges(move)
    this._data._turn = this.flipColor(this._data._turn)
  }

  undoCastlingMove(move: MoveResult) {
    if (move.movedTo === SQUARE_INDEX.g1) {
        // Undo white kingside castling (rook from f1 → h1)
        this._data._bitboards['white']['R'] = this._data._bitboards['white']['R']
            .xor(SQUARE_FLAGS.f1) // Remove rook from f1
            .or(SQUARE_FLAGS.h1); // Restore rook to h1
    } else if (move.movedTo === SQUARE_INDEX.c1) {
        // Undo white queenside castling (rook from d1 → a1)
        this._data._bitboards['white']['R'] = this._data._bitboards['white']['R']
            .xor(SQUARE_FLAGS.d1) // Remove rook from d1
            .or(SQUARE_FLAGS.a1); // Restore rook to a1
    } else if (move.movedTo === SQUARE_INDEX.g8) {
        // Undo black kingside castling (rook from f8 → h8)
        this._data._bitboards['black']['R'] = this._data._bitboards['black']['R']
            .xor(SQUARE_FLAGS.f8) // Remove rook from f8
            .or(SQUARE_FLAGS.h8); // Restore rook to h8
    } else if (move.movedTo === SQUARE_INDEX.c8) {
        // Undo black queenside castling (rook from d8 → a8)
        this._data._bitboards['black']['R'] = this._data._bitboards['black']['R']
            .xor(SQUARE_FLAGS.d8) // Remove rook from d8
            .or(SQUARE_FLAGS.a8); // Restore rook to a8
    }
  }


  undoPieceMove(move: MoveResult) {
    const color = this.flipColor(this._data._turn)
    const toFlag = FLAGS_LOOKUP_INDEX[move.movedTo]
    const fromFlag = FLAGS_LOOKUP_INDEX[move.movedFrom]
    this._data._bitboards[color][move.movedPiece] = this._data._bitboards[color][move.movedPiece].xor(toFlag)
    this._data._bitboards[color][move.movedPiece] = this._data._bitboards[color][move.movedPiece].or(fromFlag)
  }

  undoChanges(move: MoveResult) {
    this._data._halfMoveClock = move.changes._halfMoveClock
    this._data._fullMoveNumber = move.changes._fullMoveNumber
    this._data._hasWhiteKingSideCastleRight = move.changes._hasWhiteKingSideCastleRight
    this._data._hasWhiteQueenSideCastleRight = move.changes._hasWhiteQueenSideCastleRight
    this._data._hasBlackKingSideCastleRight = move.changes._hasBlackKingSideCastleRight
    this._data._hasBlackQueenSideCastleRight = move.changes._hasBlackQueenSideCastleRight
    this._data._enPassantTargetSquare = move.changes._enPassantTargetSquare
  }

  undoCapture(move: MoveResult) {
    const opponentColor = this._data._turn
    if (move.capturedPiece == null) return
    const flag = FLAGS_LOOKUP_INDEX[move.movedTo]
    this._data._bitboards[opponentColor][move.capturedPiece] = this._data._bitboards[opponentColor][move.capturedPiece].or(flag)
  }

  undoEnPassant(move: MoveResult) {
    const targetSquare = move.changes._enPassantTargetSquare
    if (targetSquare === null) return
    const moveColor = this.flipColor(this._data._turn)
    if (moveColor === 'white') {
      this._data._bitboards['black']['P'] = this._data._bitboards['black']['P'].or(targetSquare.shr(8))
    } else {
      this._data._bitboards['white']['P'] = this._data._bitboards['white']['P'].or(targetSquare.shl(8))
    }
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
    movedFrom: number
    movedTo: number
    isCheck: boolean
    capturedPiece: Piece | null
    movedPiece: Piece
    isEnPassantMove: boolean
    isCastlingMove: boolean
    changes: MoveChanges
  }

  export type MoveChanges = {
    _halfMoveClock: number
    _fullMoveNumber: number
    _hasBlackKingSideCastleRight: boolean
    _hasBlackQueenSideCastleRight: boolean
    _hasWhiteKingSideCastleRight: boolean
    _hasWhiteQueenSideCastleRight: boolean
    _enPassantTargetSquare: Int64 | null
  }

 