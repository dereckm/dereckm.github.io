import Int64, { ZERO } from "../../../logic/Int64";
import { Color, Piece } from "./Piece";

export class BoardModel {
     _turn: Color = 'white';
     _isCheck: boolean = false
    _enPassantTargetSquare: Int64 | null = null
    _halfMoveClock: number = 0
    _fullMoveNumber: number = 0
    _bitboards: Record<Color, Record<Piece, Int64>> = {
        'white': { P: ZERO, N: ZERO, B: ZERO, R: ZERO, Q: ZERO, K: ZERO },
        'black': { P: ZERO, N: ZERO, B: ZERO, R: ZERO, Q: ZERO, K: ZERO }
    }
    _hasBlackKingSideCastleRight = false;
    _hasBlackQueenSideCastleRight = false;
  
    _hasWhiteKingSideCastleRight = false;
    _hasWhiteQueenSideCastleRight = false;
}