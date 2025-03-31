import Int64 from "../../../../logic/Int64";
import { FLAGS_LOOKUP_INDEX, SQUARE_FLAGS, SQUARE_INDEX } from "../../constants/squares";
import { Color, Piece } from "../../models/Piece";
import ChessBoard from "./board";

export type MoveResult = {
  board: ChessBoard
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

export class Move {

  from: number
  to: number
  isCapture: boolean
  promotingTo: Piece | null
  result!: MoveResult

  constructor(from: number, to: number, isCapture: boolean, promotingTo: Piece | null) {
    this.from = from;
    this.to = to;
    this.isCapture = isCapture;
    this.promotingTo = promotingTo;
  }

  apply(board: ChessBoard) {
    const whitePieces = board.getPiecesForColor('white')
    const fromFlag = board.getFlag(this.from)
    const fromColor: Color = board.hasPiece(whitePieces, fromFlag) ? 'white' : 'black'
    const fromPiece = board.getPiece(fromFlag)
    if (fromPiece == null) {
      debugger;
      throw new Error(`Cannot find the piece to move at index: ${this.from}`)
    }
    const toFlag = board.getFlag(this.to)

    const moveChanges: MoveChanges = {
      _halfMoveClock: board._data._halfMoveClock,
      _fullMoveNumber: board._data._fullMoveNumber,
      _hasWhiteKingSideCastleRight: board._data._hasWhiteKingSideCastleRight,
      _hasWhiteQueenSideCastleRight: board._data._hasWhiteQueenSideCastleRight,
      _hasBlackKingSideCastleRight: board._data._hasBlackKingSideCastleRight,
      _hasBlackQueenSideCastleRight: board._data._hasBlackQueenSideCastleRight,
      _enPassantTargetSquare: board._data._enPassantTargetSquare
    }

    const isEnPassantMove = this.applyEnPassant(board, this.to, fromColor, fromPiece)
    board.checkEnPassant(this.from, this.to, fromPiece)

    let isCastling = false
    if (fromPiece === 'K') {
      const diff = this.from - this.to
      if (diff === 2 || diff === -2) {
        isCastling = true
        this.applyCastlingMove(board, this.to)
      }
    }

    const isPawnMove = fromPiece === 'P'
    const toPiece = board.getPiece(toFlag)
    const isCapture = toPiece != null
    if (isCapture) {
      board.capturePiece(toPiece, toFlag)
    }

    board.updateCastlingRights(this.from, this.to)

    // Clear from position
    board._data._bitboards[fromColor][fromPiece] = board._data._bitboards[fromColor][fromPiece].xor(fromFlag)

    // Set board with new piece on to position
    board._data._bitboards[fromColor][fromPiece] = board._data._bitboards[fromColor][fromPiece].or(toFlag)
    board._data._turn = board.flipColor(board._data._turn)

    if (board._data._turn === 'black')
      board._data._fullMoveNumber++;

    if (!isCapture && !isPawnMove) {
      board._data._halfMoveClock++
    } else {
      board._data._halfMoveClock = 0
    }

    this.result = {
      board: board,
      capturedPiece: toPiece,
      isEnPassantMove: isEnPassantMove,
      isCastlingMove: isCastling,
      movedPiece: fromPiece,
      changes: moveChanges
    }
  }

  applyEnPassant(board: ChessBoard, to: number, color: Color, fromPiece: Piece) {
    if (board._data._enPassantTargetSquare == null || fromPiece !== 'P') return false
    const toFlag = board.getFlag(to)
    if (board._data._enPassantTargetSquare !== toFlag) return false
    let isEnPassantMove = false;
    if (color === 'white' && toFlag === board._data._enPassantTargetSquare) {
      board._data._bitboards['black']['P'] = board._data._bitboards['black']['P'].xor(board._data._enPassantTargetSquare.shr(8))
      isEnPassantMove = true
    } else if (color === 'black' && board._data._enPassantTargetSquare.shl(8).equals(board.getFlag(to))) {
      board._data._bitboards['white']['P'] = board._data._bitboards['white']['P'].xor(board._data._enPassantTargetSquare.shl(8))
      isEnPassantMove = true
    }
    return isEnPassantMove
  }

  applyCastlingMove(board: ChessBoard, toIndex: number) {
    if (toIndex === SQUARE_INDEX.g1) {
      board._data._bitboards['white']['R'] = board._data._bitboards['white']['R'].xor(SQUARE_FLAGS.h1)
      board._data._bitboards['white']['R'] = board._data._bitboards['white']['R'].or(SQUARE_FLAGS.f1)
    } else if (toIndex === SQUARE_INDEX.c1) {
      board._data._bitboards['white']['R'] = board._data._bitboards['white']['R'].xor(SQUARE_FLAGS.a1)
      board._data._bitboards['white']['R'] = board._data._bitboards['white']['R'].or(SQUARE_FLAGS.d1)
    } else if (toIndex === SQUARE_INDEX.g8) {
      board._data._bitboards['black']['R'] = board._data._bitboards['black']['R'].xor(SQUARE_FLAGS.h8)
      board._data._bitboards['black']['R'] = board._data._bitboards['black']['R'].or(SQUARE_FLAGS.f8)
    } else if (toIndex === SQUARE_INDEX.c8) {
      board._data._bitboards['black']['R'] = board._data._bitboards['black']['R'].xor(SQUARE_FLAGS.a8)
      board._data._bitboards['black']['R'] = board._data._bitboards['black']['R'].or(SQUARE_FLAGS.d8)
    }
  }

  undo() {

    const move = this.result
    if (move == null) {
      throw new Error('Un-doing is an illegal operation when move was not applied')
    }
    const board = move.board
    if (move.isEnPassantMove) {
      this.undoEnPassant(board, move)
    }
    if (move.capturedPiece != null) {
      this.undoCapture(board, move)
    }
    if (move.isCastlingMove) {
      this.undoCastlingMove(board, move)
    }
    this.undoPieceMove(board, move)
    this.undoChanges(board, move)
    board._data._turn = board.flipColor(board._data._turn)
  }

  undoCastlingMove(board: ChessBoard, move: MoveResult) {
    if (this.to === SQUARE_INDEX.g1) {
      // Undo white kingside castling (rook from f1 → h1)
      board._data._bitboards['white']['R'] = board._data._bitboards['white']['R']
        .xor(SQUARE_FLAGS.f1) // Remove rook from f1
        .or(SQUARE_FLAGS.h1); // Restore rook to h1
    } else if (this.to === SQUARE_INDEX.c1) {
      // Undo white queenside castling (rook from d1 → a1)
      board._data._bitboards['white']['R'] = board._data._bitboards['white']['R']
        .xor(SQUARE_FLAGS.d1) // Remove rook from d1
        .or(SQUARE_FLAGS.a1); // Restore rook to a1
    } else if (this.to === SQUARE_INDEX.g8) {
      // Undo black kingside castling (rook from f8 → h8)
      board._data._bitboards['black']['R'] = board._data._bitboards['black']['R']
        .xor(SQUARE_FLAGS.f8) // Remove rook from f8
        .or(SQUARE_FLAGS.h8); // Restore rook to h8
    } else if (this.to === SQUARE_INDEX.c8) {
      // Undo black queenside castling (rook from d8 → a8)
      board._data._bitboards['black']['R'] = board._data._bitboards['black']['R']
        .xor(SQUARE_FLAGS.d8) // Remove rook from d8
        .or(SQUARE_FLAGS.a8); // Restore rook to a8
    }
  }


  undoPieceMove(board: ChessBoard, move: MoveResult) {
    const color = board.flipColor(board._data._turn)
    const toFlag = FLAGS_LOOKUP_INDEX[this.to]
    const fromFlag = FLAGS_LOOKUP_INDEX[this.from]
    board._data._bitboards[color][move.movedPiece] = board._data._bitboards[color][move.movedPiece].xor(toFlag)
    board._data._bitboards[color][move.movedPiece] = board._data._bitboards[color][move.movedPiece].or(fromFlag)
  }

  undoChanges(board: ChessBoard, move: MoveResult) {
    board._data._halfMoveClock = move.changes._halfMoveClock
    board._data._fullMoveNumber = move.changes._fullMoveNumber
    board._data._hasWhiteKingSideCastleRight = move.changes._hasWhiteKingSideCastleRight
    board._data._hasWhiteQueenSideCastleRight = move.changes._hasWhiteQueenSideCastleRight
    board._data._hasBlackKingSideCastleRight = move.changes._hasBlackKingSideCastleRight
    board._data._hasBlackQueenSideCastleRight = move.changes._hasBlackQueenSideCastleRight
    board._data._enPassantTargetSquare = move.changes._enPassantTargetSquare
  }

  undoCapture(board: ChessBoard, move: MoveResult) {
    const opponentColor = board._data._turn
    if (move.capturedPiece == null) return
    const flag = FLAGS_LOOKUP_INDEX[this.to]
    board._data._bitboards[opponentColor][move.capturedPiece] = board._data._bitboards[opponentColor][move.capturedPiece].or(flag)
  }

  undoEnPassant(board: ChessBoard, move: MoveResult) {
    const targetSquare = move.changes._enPassantTargetSquare
    if (targetSquare === null) return
    const moveColor = board.flipColor(board._data._turn)
    if (moveColor === 'white') {
      board._data._bitboards['black']['P'] = board._data._bitboards['black']['P'].or(targetSquare.shr(8))
    } else {
      board._data._bitboards['white']['P'] = board._data._bitboards['white']['P'].or(targetSquare.shl(8))
    }
  }
}