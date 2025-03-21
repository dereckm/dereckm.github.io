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

export interface CandidateMove {
  from: number,
  to: number,
  isCapture: boolean
}

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

  save() {
    const view = this.toBoardView()
    let text = ''
    for(let i = 0; i < view.length; i++) {
      text += view[i].map(sq => {
        if (sq.piece == null) return '*'
        if (sq.color === 'black') return sq.piece.toLowerCase()
        return sq.piece
      }).join('')
    }
    text += this._turn === 'white' ? '1' : '0'
    return text
  }

  loadAll(state: string) {
    let white = ''
    let black = ''
    this._turn = state[64] === '1' ? 'white' : 'black'
    for(let i = 0; i < 64; i++) {
      const c = state[i]
      if (c === '0') {
        white += '0'
        black += '0'
      }
      else if (c.toUpperCase() === c) {
        white += c
        black += '0'
      } else {
        white += '0'
        black += c.toUpperCase()
      }
    }
    this.load(white, 'white')
    this.load(black, 'black')
  }

  load(string: string, color: Color) {
    this._bitboards[color] = {} as Record<Piece, Int64>
    this._bitboards[color]['P'] = Int64.fromString(this.toBinaryString(string, 'P'))
    this._bitboards[color]['N'] = Int64.fromString(this.toBinaryString(string, 'N'))
    this._bitboards[color]['B'] = Int64.fromString(this.toBinaryString(string, 'B'))
    this._bitboards[color]['R'] = Int64.fromString(this.toBinaryString(string, 'R'))
    this._bitboards[color]['Q'] = Int64.fromString(this.toBinaryString(string, 'Q'))
    this._bitboards[color]['K'] = Int64.fromString(this.toBinaryString(string, 'K'))
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

  getAllLegalMoves(color: Color): CandidateMove[] {
    const pieces = this.getPiecesForColor(color)
    const oppositePieces = this.getPiecesForColor(this.flipColor(color))
    const moves = []
    for(let i = 0; i < 64; i++) {
        const flag = this.getFlag(i)
        if (this.hasPiece(pieces, flag)) {
            const piece = this.getPiece(flag)
            if (piece != null) {
              const toIndexes = this.getMoveIndexes(i)
              for(const toIndex of toIndexes) {
                const toFlag = this.getFlag(toIndex)
                const isCapture = this.hasPiece(oppositePieces, toFlag)
                moves.push({ from: i, to: toIndex, isCapture: isCapture })
              }
            }
        }
    }
    return moves.toSorted((a, b) =>  {
      if (a.isCapture && !b.isCapture) {
        return 1
      } else if (!a.isCapture && b.isCapture) {
        return -1
      }
      return 0
    })
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

  applyMove(from: number, to: number): MoveResult {

    this._history.push(this.save())

    const whitePieces = this.getPiecesForColor('white')
    const fromFlag = this.getFlag(from)
    const fromColor: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const fromPiece = this.getPiece(fromFlag)
    if (fromPiece == null) throw new Error('Cannot find the piece to move')
    const toFlag = this.getFlag(to)
    
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

 