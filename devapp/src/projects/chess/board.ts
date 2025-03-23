import Int64, { ZERO, ONE } from "../../logic/Int64"
import { Color, Piece, PromotablePiece } from './models/Piece'
import { Square } from './models/Square'
import { 
  checkPawnMoves, checkKnightMoves, checkBishopMoves, 
  checkRookMoves, checkQueenMoves, checkKingMoves
 } from './logic/move-generation/moves'

const SEVEN = 7
const NINE = 9

const WHITE_PROMOTION_RANK = Int64.fromString("0b1111111100000000000000000000000000000000000000000000000000000000")
const BLACK_PROMOTION_RANK = Int64.fromString("0b0000000000000000000000000000000000000000000000000000000011111111")

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export default class ChessBoard {
  _history: string[] = []

  _turn: Color;
  _isCheck: boolean = false

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

  save() {
    let fen = ''
    let count = 0;
    for(let i = 63; i >= 0; i--) {
      const flag = this.getFlag(i)
      const piece = this.getPiece(flag)
      const color = this.getColor(flag)
      if (piece != null) {
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
    return fen
  }

  loadAll(fen: string) {
    const chunks = fen.split(' ')
    const pieces = chunks[0]
    this._bitboards['white'] = { P: ZERO, N: ZERO, B: ZERO, R: ZERO, Q: ZERO, K: ZERO } as Record<Piece, Int64>
    this._bitboards['black'] = { P: ZERO, N: ZERO, B: ZERO, R: ZERO, Q: ZERO, K: ZERO } as Record<Piece, Int64>
    let index = 0;
    for (let i = 0; i < pieces.length; i++) {
      const char = pieces[i]
      const number = parseInt(char)
      if (char === '/') {
        // ignore
      } else if (!isNaN(number)) {
        index += number;
      } else if (char === char.toLowerCase()) {
        const piece: Piece = char.toUpperCase() as Piece
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
    if (chunks[2] == null) {
      console.log(fen)
    }
    this._hasWhiteKingSideCastleRight = chunks[2].includes('K')
    this._hasWhiteQueenSideCastleRight = chunks[2].includes('Q')
    this._hasBlackKingSideCastleRight = chunks[2].includes('k')
    this._hasBlackQueenSideCastleRight = chunks[2].includes('q')
  }

  toBinaryString(input: string, char: string) {
    let binaryString = '0b'
    for(const c of input) {
      binaryString += (c === char ? '1' : '0')
    }
    return binaryString
  }
  
  getFlag(index: number) {
    return ONE.shl(index)
  }

  getIndex(i: number, j: number) {
    return 63 - ((i * 8) + j)
  }

  isCheck(kingPos: Int64, color: Color) {
    var oppositeColor: Color = this.flipColor(color)
    const pawnAttacks: Int64 = color === 'white' 
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

  

  checkMoves(index: number) {
    const flag = this.getFlag(index)
    const color = this._turn
    const piece = this.getPiece(flag)
    if (!this.hasPiece(this.getPiecesForColor(color), flag)) return ZERO
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

  getMoveIndexes(index: number) {
    const moves = this.checkMoves(index)
    const indexes = []
    for (let i = 0; i < 64; i++) {
      const toFlag = this.getFlag(i)
      if (this.hasPiece(moves, toFlag)) {
        indexes.push(i)
      }
    }
    return indexes
  }

  print() {
    const view = this.toBoardView()
    let text = ''
    for(let i = 0; i < view.length; i++) {
      text += view[i].map(sq => {
        if (sq.piece == null) return '*'
        if (sq.color === 'black') return sq.piece?.toLowerCase()
        return sq.piece
      }).join('')
      text += '\n'
    }
    console.log(text)
  }

  printBitboard(board: Int64) {
    const binary = board.toString(2).padStart(64, '0')
    let text = ''
    for(let i = 0; i < 8; i++) {
      const row = binary.substring(i * 8, i * 8 + 8)
      text += `${row}\n`
    }
    console.log(text)
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

  applyMove(from: number, to: number): MoveResult {

    this._history.push(this.save())

    const whitePieces = this.getPiecesForColor('white')
    const fromFlag = this.getFlag(from)
    const fromColor: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const fromPiece = this.getPiece(fromFlag)
    if (fromPiece == null) throw new Error('Cannot find the piece to move')
    const toFlag = this.getFlag(to)

    if (fromPiece === 'K') {
      const diff = from - to
      if (diff === 2 || diff === -2) {
        this.applyCastlingMove(to)
      }
    }

    if (this._hasWhiteKingSideCastleRight && (from === 0 || from === 3)) {
      this._hasWhiteKingSideCastleRight = false;
    } if (this._hasWhiteQueenSideCastleRight && (from === 3 || from === 7)) {
      this._hasWhiteQueenSideCastleRight = false;
    } if (this._hasBlackKingSideCastleRight && (from === 56 || from === 59)) {
      this._hasBlackKingSideCastleRight = false;
    } if (this._hasBlackQueenSideCastleRight && (from === 59 || from === 63)) {
      this._hasBlackQueenSideCastleRight = false;
    }
    
    const toPiece = this.getPiece(toFlag)
    if (toPiece != null) {
      this.capturePiece(toPiece, toFlag, to)
    }

    // Clear from position
    this._bitboards[fromColor][fromPiece] =  this._bitboards[fromColor][fromPiece].xor(fromFlag)
    // Capture piece at to position (if any)
    
      
    // Set board with new piece on to position
    this._bitboards[fromColor][fromPiece] = this._bitboards[fromColor][fromPiece].or(toFlag)
    this._turn = this.flipColor(this._turn)
    
    const oppositeColor = this.flipColor(fromColor)
    const oppositeKing = this._bitboards[oppositeColor]['K']
    const isCheck = this.isCheck(oppositeKing, oppositeColor)

    // let isCheckmate = false
    // if (isCheck) {
    //   const legalMoves = this.getAllLegalMoves(oppositeColor)
    //   if (legalMoves.length === 0) {
    //     isCheckmate = true
    //   }
    // }

    return {
      isPromotion: this.isPromotion(toFlag, fromColor, fromPiece),
      movedTo: to,
      isCheck: isCheck,
      isCheckmate: false,
      state: this.save()
    }
  }

  getColor(flag: Int64) {
    return this.hasPiece(this.getPiecesForColor('white'), flag) ? 'white' : 'black'
  }

  capturePiece(toPiece: Piece, toFlag: Int64, to: number) {
    const toColor: Color = this.getColor(toFlag)
    this._bitboards[toColor][toPiece] = this._bitboards[toColor][toPiece].xor(toFlag)
  }

  isPromotion(toFlag: Int64, fromColor: Color, fromPiece: Piece) {
    if (fromPiece !== 'P') return false;
    if (fromColor === 'white') return !toFlag.and(WHITE_PROMOTION_RANK).isZero()
    return !toFlag.and(BLACK_PROMOTION_RANK).isZero()
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
    if (this.hasPiece(this._bitboards['white']['P'].or(this._bitboards['black']['P']), flag)) return 'P'
    if (this.hasPiece(this._bitboards['white']['N'].or(this._bitboards['black']['N']), flag)) return 'N'
    if (this.hasPiece(this._bitboards['white']['B'].or(this._bitboards['black']['B']), flag)) return 'B'
    if (this.hasPiece(this._bitboards['white']['R'].or(this._bitboards['black']['R']), flag)) return 'R'
    if (this.hasPiece(this._bitboards['white']['Q'].or(this._bitboards['black']['Q']), flag)) return 'Q'
    if (this.hasPiece(this._bitboards['white']['K'].or(this._bitboards['black']['K']), flag)) return 'K'
    return null
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
    isCheckmate: boolean
    state: string
  }

 