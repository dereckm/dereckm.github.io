import { FLAGS_LOOKUP_INDEX, SQUARE_INDEX } from "../constants/squares";
import { BoardModel } from "../models/BoardModel";
import { Color, Piece } from "../models/Piece";

const NOT_NUMBER = -1;
const TURN_COLORS: Record<string, Color> = { 'w': 'white', 'b': 'black' }
 
export class FENParser {

    _board: BoardModel = new BoardModel()
    _fen: string = ''
    _index = 0

    hasNext() {
        return this._index < this._fen.length
    }

    eat() {
        const next = this._fen[this._index]
        this._index++;
        return next;
    }

    peek() {
        const next = this._fen[this._index]
        return next;
    }

    parseFEN(fen: string) {
        this._board = new BoardModel()
        this._fen = fen
        this._index = 0
        this.parsePieces()
        this.parseTurn()
        this.parseCastlingRights()
        this.parseEnPassantTargetSquare()
        this.parseHalfMoveClock()
        this.parseFullMoveNumber()
        return this._board
    }

    parseFullMoveNumber() {
        this._board._fullMoveNumber = this.parseNumber()
        this.eat() // consume space
    }

    parseNumber() {
        let str = ''
        while(this.peek() !== ' ' && this.hasNext()) {
            str += this.eat()
        }
        return parseInt(str)
    }

    parseHalfMoveClock() {
        this._board._halfMoveClock = this.parseNumber()
        this.eat() // consume space
    }

    parseEnPassantTargetSquare() {
        const char = this.eat()
        if (char === '-') {
            this.eat() // consume space
            return
        }
        const secondChar = this.eat()
        this._board._enPassantTargetSquare = FLAGS_LOOKUP_INDEX[SQUARE_INDEX[char + secondChar]]
        this.eat() // consume space
    }

    parseCastlingRights() {
        let char;
        do {
            char = this.eat()
            switch (char) {
                case 'K': this._board._hasWhiteKingSideCastleRight = true;
                    break;
                case 'Q': this._board._hasWhiteQueenSideCastleRight = true;
                    break;
                case 'k': this._board._hasBlackKingSideCastleRight = true;
                    break;
                case 'q': this._board._hasBlackQueenSideCastleRight = true;
            }
        } while (char !== ' ')
    }

    parseTurn() {
        const turn = this.eat()
        this._board._turn = TURN_COLORS[turn];
        this.eat() // consume next space
    }

    parsePieces() {
        let index = 0
        while(true) {
            const char = this.eat()
            if (char === '/') continue;
            if (char === ' ') return;
            const maybeNumber = this.parseDigit(char)
            if (maybeNumber !== NOT_NUMBER) {
                index += maybeNumber
                continue;
            }
            const color = char >= 'a' && char <= 'z' ? 'black' : 'white'
            const piece = this.charToPiece(char)
            const flag = FLAGS_LOOKUP_INDEX[63 - index]
            this._board._bitboards[color][piece] = this._board._bitboards[color][piece].or(flag)
            index++;
        }
    }

    parseDigit(char: string) {
        switch(char) {
            case '1': return 1;
            case '2': return 2;
            case '3': return 3;
            case '4': return 4;
            case '5': return 5;
            case '6': return 6;
            case '7': return 7;
            case '8': return 8;
            default: return -1;
        }
    }

    charToPiece(char: string): Piece {
        switch(char) {
            case 'p': return 'P';
            case 'n': return 'N';
            case 'b': return 'B'
            case 'r': return 'R'
            case 'q': return 'Q'
            case 'k': return 'K'
            case 'P': return 'P';
            case 'N': return 'N';
            case 'B': return 'B'
            case 'R': return 'R'
            case 'Q': return 'Q'
            case 'K': return 'K'
            default: throw new Error('should not try to convert invalid piece')
        }
    }
}
 