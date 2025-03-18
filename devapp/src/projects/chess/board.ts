import Int64 from "../../logic/Int64"
import { kingMoves, knightMoves } from "./moves"

export type Bitboard = bigint

const ZERO = new Int64(0)
const ONE = new Int64(1)
const SEVEN = 7
const EIGHT = 8
const NINE = 9
const WHITE_PAWN_START = Int64.fromString('0b1111111100000000')
const BLACK_PAWN_START = Int64.fromString("0b0000000011111111000000000000000000000000000000000000000000000000")
const EMPTY_ARRAY: number[] = []

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const positionWeights = 
"00000000" + 
"01111110" + 
"01222210" + 
"01355310" + 
"01355310" + 
"01222210" + 
"01111110" + 
"00000000";

const positionalHeuristics = positionWeights.split('').map(c => parseInt(c))

interface Move {
  from: number
  to: number
  capture: Piece | null
}

export interface CandidateMove {
  from: number,
  to: number
}

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

export default class ChessBoard {
  _history: Move[] = []

  _turn: Color = 'white'
  _isCheck: boolean = false

  _bitboards: Record<Color, Record<Piece, Int64>>
  _material: Record<Color, Record<Piece, number>>
  _positionScore: Record<Color, number>
  _pieces: Record<Color, Int64>

  fromString(white: string, black: string) {
    const board = new ChessBoard()
    board.load(white, 'white')
    board.load(black, 'black')
    return board
  }

  calculatePositionScore(color: Color) {
    const pieces = this.getPieces(color)
    let score = 0
    for(let i = 0; i < 64; i++) {
      const flag = this.getFlag(i)
      if (this.hasPiece(pieces, flag)) {
        score += positionalHeuristics[i]
      }
    }
    return score
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
    return text
  }

  loadAll(string: string) {
    let white = ''
    let black = ''
    for(const c of string) {
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
    this._material[color]['P'] = 0
    this._material[color]['N'] = 0
    this._material[color]['B'] = 0
    this._material[color]['R'] = 0
    this._material[color]['Q'] = 0
    this._material[color]['K'] = 0
    this._bitboards[color]['P'] = Int64.fromString(this.toBinaryString(string, 'P'))
    this._bitboards[color]['N'] = Int64.fromString(this.toBinaryString(string, 'N'))
    this._bitboards[color]['B'] = Int64.fromString(this.toBinaryString(string, 'B'))
    this._bitboards[color]['R'] = Int64.fromString(this.toBinaryString(string, 'R'))
    this._bitboards[color]['Q'] = Int64.fromString(this.toBinaryString(string, 'Q'))
    this._bitboards[color]['K'] = Int64.fromString(this.toBinaryString(string, 'K'))
    this._pieces[color] = this.getPieces(color)
    this._positionScore[color] = this.calculatePositionScore(color)
  }

  toBinaryString(input: string, char: string) {
    let binaryString = '0b'
    for(const c of input) {
      binaryString += (c === char ? '1' : '0')
    }
    return binaryString
  }

  constructor () {

    this._bitboards = {
      white: {
        P: Int64.fromString("0b0000000000000000000000000000000000000000000000001111111100000000"),
        N: Int64.fromString("0b0000000000000000000000000000000000000000000000000000000000100100"),
        B: Int64.fromString("0b0000000000000000000000000000000000000000000000000000000001000010"),
        R: Int64.fromString("0b0000000000000000000000000000000000000000000000000000000010000001"),
        Q: Int64.fromString("0b0000000000000000000000000000000000000000000000000000000000010000"),
        K: Int64.fromString("0b0000000000000000000000000000000000000000000000000000000000001000")
      },
      black: {
        P: Int64.fromString("0b0000000011111111000000000000000000000000000000000000000000000000"),
        N: Int64.fromString("0b0010010000000000000000000000000000000000000000000000000000000000"),
        B: Int64.fromString("0b0100001000000000000000000000000000000000000000000000000000000000"),
        R: Int64.fromString("0b1000000100000000000000000000000000000000000000000000000000000000"),
        Q: Int64.fromString("0b0001000000000000000000000000000000000000000000000000000000000000"),
        K: Int64.fromString("0b0000100000000000000000000000000000000000000000000000000000000000")
      }
    }

    this._material = {
      white: {
        P: 8,
        N: 2,
        B: 2,
        R: 2,
        Q: 1,
        K: 1
      },
      black: {
        P: 8,
        N: 2,
        B: 2,
        R: 2,
        Q: 1,
        K: 1
      }
    }

    this._positionScore = {
      white: 6,
      black: 6
    }
    this._pieces = {
      white: this.getPieces('white'),
      black: this.getPieces('black')
    }
  }

  getPieces(color: Color) {
    return this._bitboards[color]['P']
    .or(this._bitboards[color]['N'])
    .or(this._bitboards[color]['B'])
    .or(this._bitboards[color]['R'])
    .or(this._bitboards[color]['Q'])
    .or(this._bitboards[color]['K'])
  }

  getAllPieces() {
    return this._pieces['white'].or(this._pieces['black']) 
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
    const bishopMoves = this.checkBishopMoves(kingPos, color)
    const rookMoves = this.checkRookMoves(kingPos, color)
    return this.hasPiece(pawnAttacks, this._bitboards[oppositeColor]['P'])
    || this.hasPiece(this.checkKnightMoves(kingPos, color), this._bitboards[oppositeColor]['N'])
    || this.hasPiece(bishopMoves, this._bitboards[oppositeColor]['B'])
    || this.hasPiece(rookMoves, this._bitboards[oppositeColor]['R'])
    || this.hasPiece(bishopMoves.or(rookMoves), this._bitboards[oppositeColor]['Q'])
  }

  getAllLegalMoves(color: Color): CandidateMove[] {
    const pieces = this._pieces[color]
    const groupedLegalMoves: Record<Piece, CandidateMove[]> = { 'P': [], 'N': [], 'B': [], 'R': [], 'Q': [], 'K': [] }
    for(let i = 0; i < 64; i++) {
        const flag = this.getFlag(i)
        if (this.hasPiece(pieces, flag)) {
            const piece = this.getPiece(flag)
            if (piece != null) {
              const toIndexes = this.getMoveIndexes(i)
              groupedLegalMoves[piece].push(...toIndexes.map(toIndex => ({ from: i, to: toIndex })))
            }
        }
    }
    return [
      ...groupedLegalMoves['Q'],
      ...groupedLegalMoves['R'],
      ...groupedLegalMoves['B'],
      ...groupedLegalMoves['N'],
      ...groupedLegalMoves['K'],
      ...groupedLegalMoves['P'],
    ]
  }

  checkMoves(index: number) {
    const flag = this.getFlag(index)
    const color = this._turn
    const piece = this.getPiece(flag)
    if (!this.hasPiece(this._pieces[color], flag)) return ZERO
    let moves = ZERO
    if (piece === 'P') moves = this.checkPawnMoves(flag, color)
    else if (piece === 'N') moves =  this.checkKnightMoves(flag, color)
    else if (piece === 'B') moves =  this.checkBishopMoves(flag, color)
    else if (piece === 'R') moves =  this.checkRookMoves(flag, color)
    else if (piece === 'Q') moves =  this.checkQueenMoves(flag, color)
    else if (piece === 'K') moves = this.checkKingMoves(flag, color)
    moves = this.checkMovesForCheck(moves, color, index)
    return moves
  }

  /**
   * Backpropagate from the king to check if a piece can cause check
   * @param king 
   * @param color 
   * @returns lookup of positions that can cause check for each piece.
   */
  getCheckingMoves(king: Int64, color: Color): Record<Piece, Int64> {
    const bishopMoves = this.checkBishopMoves(king, color)
    const rookMoves = this.checkRookMoves(king, color)
    return {
      'P': color === 'white' 
        ? king.shl(SEVEN).or(king.shl(NINE)) 
        : king.shr(SEVEN).or(king.shr(NINE)),
      'N': this.checkKnightMoves(king, color),
      'B': bishopMoves,
      'R': rookMoves,
      'Q': bishopMoves.or(rookMoves),
      'K': ZERO
    }
  }

  checkMovesForCheck(moves: Int64, color: Color, index: number) {
    if (moves.isZero()) return moves

    const oppositeColor = this.flipColor(color)
    const flag = this.getFlag(index)
    const king = this._bitboards[color]['K']
    let checkingMoves = this.getCheckingMoves(king, color)
    if (moves.isFlag()) return this.testMoveForCheck(
      index,
      moves.log2(),
      color,
      oppositeColor,
      moves,
      flag,
      king,
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
          flag,
          king,
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
      flag: Int64,
      king: Int64,
      checkingMoves: Record<Piece, Int64>) {
    this.applyMove(index, moveIndex)
    let legalMoves = ZERO
    const newKing =  this._bitboards[color]['K']
    checkingMoves = this.getCheckingMoves(newKing, color)
    const isCheck = this.hasPiece(checkingMoves['P'], this._bitboards[oppositeColor]['P']) 
      || this.hasPiece(checkingMoves['N'], this._bitboards[oppositeColor]['N'])
      || this.hasPiece(checkingMoves['B'], this._bitboards[oppositeColor]['B'])
      || this.hasPiece(checkingMoves['R'], this._bitboards[oppositeColor]['R'])
      || this.hasPiece(checkingMoves['Q'], this._bitboards[oppositeColor]['Q'])
    if (!isCheck) {
      legalMoves = legalMoves.or(currentMove)
    }
    this.undoMove()
    return legalMoves
  }

  getMoveIndexes(index: number) {
    const moveFlag = this.checkMoves(index)
    if (moveFlag.isZero()) return EMPTY_ARRAY
    if (moveFlag.isFlag()) return [moveFlag.log2()]
    let indexes = []
    for(let i = 0; i < 64; i++) {
        if (!(moveFlag.and(ONE.shl(i)).isZero())) {
          indexes.push(i)
        }
    }
    return indexes;
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

  applyMove(from: number, to: number): void {
    const whitePieces = this._pieces['white']
    const fromFlag = this.getFlag(from)
    const fromColor: Color = this.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const fromPiece = this.getPiece(fromFlag)
    if (fromPiece == null) return
    const toFlag = this.getFlag(to)
    const toColor: Color = this.hasPiece(whitePieces, toFlag) ? 'white' : 'black'
    const toPiece = this.getPiece(toFlag)

    // Clear from position
    this._bitboards[fromColor][fromPiece] =  this._bitboards[fromColor][fromPiece].xor(fromFlag)
    // Capture piece at to position (if any)
    let oppositeColorChanged = false
    if (toPiece != null) {
      this._bitboards[toColor][toPiece] = this._bitboards[toColor][toPiece].xor(toFlag)
      this._material[toColor][toPiece]--
      this._positionScore[toColor] -= positionalHeuristics[to]
      oppositeColorChanged = true
    }
      
    // Set board with new piece on to position
    this._bitboards[fromColor][fromPiece] = this._bitboards[fromColor][fromPiece].or(toFlag)
    this._turn = this.flipColor(this._turn)

    this._history.push({ from: from, to: to, capture: toPiece })
    this._positionScore[fromColor] += (positionalHeuristics[to] - positionalHeuristics[from])
    this._pieces[fromColor] = this.getPieces(fromColor)
    if (oppositeColorChanged) {
      const oppositeColor = this.flipColor(fromColor)
      this._pieces[oppositeColor] = this.getPieces(oppositeColor)
    }
    
    const realScore = this.calculatePositionScore(fromColor)
    if (this.calculatePositionScore(fromColor) !== this._positionScore[fromColor]) {
      console.log(`scored shifted: real=${realScore}, tracked=${this._positionScore[fromColor]}`)
    }
  }

  undoMove() {
    const move = this._history.pop()
    if (move == null) return
    const fromFlag = this.getFlag(move.from)
    const toFlag = this.getFlag(move.to)
    const piece = this.getPiece(toFlag)
    const color = this.hasPiece(this._pieces['white'], toFlag) ? 'white' : 'black'

    if (piece == null) return
    this._bitboards[color][piece] = this._bitboards[color][piece].or(fromFlag) // place piece back to original position
    this._bitboards[color][piece] = this._bitboards[color][piece].xor(toFlag) // remove piece from current position

    const oppositeColor = this.flipColor(color)
    let oppositeColorChanged = false
    if (move.capture != null) {
      this._bitboards[oppositeColor][move.capture] = this._bitboards[oppositeColor][move.capture].or(toFlag) // place back captured piece
      this._material[oppositeColor][move.capture]++ // reset material counter
      this._positionScore[oppositeColor] += positionalHeuristics[move.to]
      oppositeColorChanged = true
    }
    this._positionScore[color] -= (positionalHeuristics[move.to] - positionalHeuristics[move.from])
    this._turn = this.flipColor(this._turn) // reset turn

    this._pieces[color] = this.getPieces(color)
    if (oppositeColorChanged) {
      this._pieces[oppositeColor] = this.getPieces(oppositeColor)
    }
    
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

  checkKingMoves(flag: Int64, color: Color) {
    const index = flag.log2()
    const moves = kingMoves[index]
    const stepOvers = this._pieces[color]
    return moves.and(stepOvers.not())
  }

  checkRangeMoves(flag: Int64, color: Color, edges: Int64[], directions: ((i: number) => Int64)[]) {
    let moves = ZERO
    const skips: boolean[] = []
    skips.fill(false, 0, directions.length - 1)
    const sameColorPieces = this._pieces[color]
    const oppositeColor = this.flipColor(color)
    const oppositePieces = this._pieces[oppositeColor]
    for(let direction = 0; direction < directions.length; direction++) {
      const edge = edges[direction]
      if (this.hasPiece(edge, flag))
        continue
      for(let i = 1; i <= 7; i++) {
        const pos = directions[direction](i)
        if (this.hasPiece(sameColorPieces, pos)) {
          break
        }
        if (this.hasPiece(edge, pos) || this.hasPiece(oppositePieces, pos)) {
          moves = moves.or(pos)
          break
        }
        moves = moves.or(pos)
      }
    }
    return moves
  }

  checkQueenMoves(flag: Int64, color: Color) {
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
     return this.checkRangeMoves(flag, color, queenEdges, directions)
  }

  checkRookMoves(flag: Int64, color: Color) {
    const directions = [
      (i: number) => flag.shl(i * 8),
      (i: number) => flag.shr(i * 1),
      (i: number) => flag.shr(i * 8),
      (i: number) => flag.shl(i * 1)
     ]
     return this.checkRangeMoves(flag, color, rookEdges, directions)
  }

  checkBishopMoves(flag: Int64, color: Color) {
    const directions = [
      (i: number) => flag.shl(i * 9),
      (i: number) => flag.shl(i * 7),
      (i: number) => flag.shr(i * 7),
      (i: number) => flag.shr(i * 9)
     ]

     return this.checkRangeMoves(flag, color, bishopEdges, directions)
  }

  checkKnightMoves(flag: Int64, color: Color) {
    if (flag.isZero()) return ZERO
    const index = flag.log2()
    const moves = knightMoves[index]
    const stepOvers = this._pieces[color]
    return moves.and(stepOvers.not())
  }

  checkPawnMoves(flag: Int64, color: Color) {
    let validMoves: Int64 = new Int64(0)
    // TODO : check en passant
    // TODO : check edge of board (promotion)
    if (color === 'white') {
        const forwardOne = flag.shl(EIGHT)
        if (!this.hasPiece(this.getAllPieces(), forwardOne)) {
            validMoves = validMoves.or(forwardOne)
            const forwardTwo = flag.shl(16)
            if (this.hasPiece(WHITE_PAWN_START, flag) && !this.hasPiece(this.getAllPieces(), forwardTwo)) {
                validMoves = validMoves.or(forwardTwo)
            }
        }
        const blackPieces = this._pieces['black']
        const diag1 = flag.shl(7)
        const diag2 = flag.shl(9)
        const captures = (diag1.or(diag2)).and(blackPieces)
        validMoves = validMoves.or(captures)
    } else if (color === 'black') {
        const forwardOne = flag.shr(8)
        if (!this.hasPiece(this.getAllPieces(), forwardOne)) {
            validMoves = validMoves.or(forwardOne)
            const forwardTwo = flag.shr(16)
            if (this.hasPiece(BLACK_PAWN_START, flag) && !this.hasPiece(this.getAllPieces(), forwardTwo)) {
                validMoves = validMoves.or(forwardTwo)
            }
        }
        
        const whitePieces = this._pieces['white']
        const diag1 = flag.shr(7)
        const diag2 = flag.shr(9)
        const captures = (diag1.or(diag2)).and(whitePieces)
        validMoves = validMoves.or(captures)
    }
    return validMoves
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
        const color = this.hasPiece(this._pieces['white'], flag) ? 'white' : 'black'
        row.push({ piece, color, index })
      }
      boardView.push(row)
    }
    return boardView
  }
}

  export type Piece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
  export type Color = 'black' | 'white'

  export interface Square {
    piece: Piece | null
    color: Color
    index: number
  }