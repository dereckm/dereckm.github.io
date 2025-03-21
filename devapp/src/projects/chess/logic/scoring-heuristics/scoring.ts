import ChessBoard from "../../board"
import { Color } from '../../models/Piece'

export function calculatePiecesScore(board: ChessBoard, color: Color) {
    let score = 0
    for(let i = 0; i < 63; i++) {
        const flag = board.getFlag(i)
        if (board.hasPiece(board._bitboards[color]['P'], flag)) score += 1;
        else if (board.hasPiece(board._bitboards[color]['N'], flag)) score += 3;
        else if (board.hasPiece(board._bitboards[color]['B'], flag)) score += 3;
        else if (board.hasPiece(board._bitboards[color]['R'], flag)) score += 5;
        else if (board.hasPiece(board._bitboards[color]['Q'], flag)) score += 9;
    }
    return score
}
export function calculatePositionalScore(board: ChessBoard, color: Color) {
    const pieces = board.getPiecesForColor(color)
    const squareTable = color === 'white' ? whitePiecesSquareTable : blackPiecesSquareTable
    let positionalScore = 0;
    for(let i = 0; i < 64; i++) {
        const flag = board.getFlag(i)
        if (board.hasPiece(pieces, flag)) {
            const piece = board.getPiece(flag) 
            if (piece == null) throw new Error('piece should never be null here')
            const score = squareTable[piece][63 - i]
            positionalScore += (score / 100.0);
        }
    }
    return positionalScore
}

export function calculateScoreOfColor(board: ChessBoard, color: Color) {
    let scoreOfColor = calculatePiecesScore(board, color)
    scoreOfColor += calculatePositionalScore(board, color)
    return scoreOfColor
}

export function calculateScoreDelta(board: ChessBoard) {
    return calculateScoreOfColor(board, 'white') - calculateScoreOfColor(board, 'black')
}


const whitePiecesSquareTable: { [key: string] : number[] } = {
    'P': [
            0, 0, 0, 0, 0, 0, 0, 0,
            50, 50, 50, 50, 50, 50, 50, 50,
            10, 10, 20, 30, 30, 20, 10, 10,
            5, 5, 10, 25, 25, 10, 5, 5,
            0, 0, 0, 20, 20, 0, 0, 0,
            5, -5, -10, 0, 0, -10, -5, 5,
            5, 10, 10, -20, -20, 10, 10, 5,
            0, 0, 0, 0, 0, 0, 0, 0
    ],
    'N':  [
            -50, -40, -30, -30, -30, -30, -40, -50,
            -40, -20, 0, 0, 0, 0, -20, -40,
            -30, 0, 10, 15, 15, 10, 0, -30,
            -30, 5, 15, 20, 20, 15, 5, -30,
            -30, 0, 15, 20, 20, 15, 0, -30,
            -30, 5, 10, 15, 15, 10, 5, -30,
            -40, -20, 0, 5, 5, 0, -20, -40,
            -50, -40, -30, -30, -30, -30, -40, -50
    ],
    'B': [
            -20, -10, -10, -10, -10, -10, -10, -20,
            -10, 0, 0, 0, 0, 0, 0, -10,
            -10, 0, 5, 10, 10, 5, 0, -10,
            -10, 5, 5, 10, 10, 5, 5, -10,
            -10, 0, 10, 10, 10, 10, 0, -10,
            -10, 10, 10, 10, 10, 10, 10, -10,
            -10, 5, 0, 0, 0, 0, 5, -10,
            -20, -10, -10, -10, -10, -10, -10, -20
    ],
    'R': [
            0, 0, 0, 5, 5, 0, 0, 0,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            5, 10, 10, 10, 10, 10, 10, 5,
            0, 0, 0, 0, 0, 0, 0, 0
    ],
    'Q': [
            -20, -10, -10, -5, -5, -10, -10, -20,
            -10, 0, 0, 0, 0, 0, 0, -10,
            -10, 5, 5, 5, 5, 5, 0, -10,
            0, 0, 5, 5, 5, 5, 0, -5,
            -5, 0, 5, 5, 5, 5, 0, -5,
            -10, 0, 5, 5, 5, 5, 0, -10,
            -10, 0, 0, 0, 0, 0, 0, -10,
            -20, -10, -10, -5, -5, -10, -10, -20
    ],
    'K': [
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -20, -30, -30, -40, -40, -30, -30, -20,
            -10, -20, -20, -20, -20, -20, -20, -10,
            20, 20, 0, 0, 0, 0, 20, 20,
            20, 30, 10, 0, 0, 10, 30, 20
    ], 'K_endgame': [ // King (Endgame)
        -50, -30, -30, -30, -30, -30, -30, -50,
        -30, -30, 0, 0, 0, 0, -30, -30,
        -30, -10, 20, 30, 30, 20, -10, -30,
        -30, -10, 30, 40, 40, 30, -10, -30,
        -30, -10, 30, 40, 40, 30, -10, -30,
        -30, -10, 20, 30, 30, 20, -10, -30,
        -30, -20, -10, 0, 0, -10, -20, -30,
        -50, -40, -30, -20, -20, -30, -40, -50
    ]
};

const blackPiecesSquareTable = {
    'P': whitePiecesSquareTable['P'].toReversed(),
    'N': whitePiecesSquareTable['N'].toReversed(),
    'B': whitePiecesSquareTable['B'].toReversed(),
    'R': whitePiecesSquareTable['R'].toReversed(),
    'Q': whitePiecesSquareTable['Q'].toReversed(),
    'K': whitePiecesSquareTable['K'].toReversed(),
    'K_endgame': whitePiecesSquareTable['K_endgame'].toReversed()
}