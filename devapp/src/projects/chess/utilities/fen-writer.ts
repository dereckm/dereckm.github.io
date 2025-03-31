import ChessBoard from "../logic/game/board";
import { INDEX_TO_SQUARE } from "../constants/squares";

export class FenWriter {

    write(board: ChessBoard) {
        const pieces = this.writePieces(board)
        const turn = this.writeTurn(board)
        const castlingRights = this.writeCastlingRights(board)
        const enPassantTargetSquare = this.writeEnPassantTargetSquare(board)
        const moveCounters = this.writeMoveCounters(board)
        const fen = `${pieces} ${turn} ${castlingRights} ${enPassantTargetSquare} ${moveCounters}`
        return fen
    }

    writeWithoutMoveCounters(board: ChessBoard) {
        const pieces = this.writePieces(board)
        const turn = this.writeTurn(board)
        const castlingRights = this.writeCastlingRights(board)
        const enPassantTargetSquare = this.writeEnPassantTargetSquare(board)
        const fen = `${pieces} ${turn} ${castlingRights} ${enPassantTargetSquare}`
        return fen
    }

    writeMoveCounters(board: ChessBoard) {
        return `${board._data._halfMoveClock} ${board._data._fullMoveNumber}`
    }

    writeEnPassantTargetSquare(board: ChessBoard) {
        let enPassantTargetSquare = '-'
        if (board._data._enPassantTargetSquare != null) {
            enPassantTargetSquare = ` ${INDEX_TO_SQUARE[board._data._enPassantTargetSquare.log2()]}`
        }
        return enPassantTargetSquare
    }

    writeCastlingRights(board: ChessBoard) {
        let castlingRights = ''
        if (board._data._hasWhiteKingSideCastleRight) castlingRights += 'K'
        if (board._data._hasWhiteQueenSideCastleRight) castlingRights += 'Q'
        if (board._data._hasBlackKingSideCastleRight) castlingRights += 'k'
        if (board._data._hasBlackQueenSideCastleRight) castlingRights += 'q'
        if (castlingRights === '') castlingRights = '-'
        return castlingRights
    }

    writeTurn(board: ChessBoard) {
        return board._data._turn === 'white' ? 'w' : 'b'
    }

    writePieces(board: ChessBoard) {
        let piecesString = ''
        let count = 0;
        const whitePieces = board.getPiecesForColor('white')
        for(let i = 63; i >= 0; i--) {
            const flag = board.getFlag(i)
            const piece = board.getPiece(flag)
            
            if (piece != null) {
            const color = board.hasPiece(whitePieces, flag) ? 'white' : 'black'
            if (count !== 0) piecesString += count;
            piecesString += color === 'white' ? piece : piece.toLowerCase()
            count = 0;
            } else {
            count++;
            }
            if (i % 8 === 0 && i !== 0) {
                if(count !== 0) piecesString += count;
                piecesString += '/'
                count = 0;
            }
        }
        if (count > 0 ) piecesString += count // flush
        return piecesString
    }
}