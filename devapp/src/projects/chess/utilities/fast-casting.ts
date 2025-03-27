import { Piece } from "../models/Piece";

export function getInteger(char: string) {
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

export function charToPiece(char: string): Piece {
    switch(char) {
        case 'p': return 'P';
        case 'n': return 'N';
        case 'b': return 'B'
        case 'r': return 'R'
        case 'q': return 'Q'
        case 'k': return 'K'
        default: throw new Error('should not try to convert invalid piece')
    }
}