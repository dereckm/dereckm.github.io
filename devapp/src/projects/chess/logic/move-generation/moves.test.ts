import { expect, test, describe, beforeAll, beforeEach } from 'vitest'
import ChessBoard from "../game/board"
import { generateKnightMoves, toIndex, toCoords, generateKingMoves, checkPawnMoves, checkRookMoves, getMoveIndexesFromFlag, getLegalMoveIndicesAtIndex } from "./moves"
import Int64, { ONE } from "../../../../logic/Int64"
import { DEFAULT_BOARD } from "../../constants/fen"
import { SQUARE_FLAGS, SQUARE_INDEX } from "../../constants/squares"

describe("generateKnightMoves", () => {
    let knightMoves: Record<number, Int64>;

    beforeAll(() => {
        knightMoves = generateKnightMoves();
    });

    test("Should generate 8 possible moves for a knight in the center", () => {
        const centerIndex = toIndex(4, 3); // d4
        const expectedMoves = [
            toIndex(5, 5), // c6
            toIndex(3, 5), // e6
            toIndex(2, 4), // f5
            toIndex(2, 2), // f3
            toIndex(3, 1), // e2
            toIndex(5, 1), // c2
            toIndex(6, 2), // b3
            toIndex(6, 4)  // b5
        ];

        for (const move of expectedMoves) {
            expect(knightMoves[centerIndex].and(ONE.shl(move)).isZero()).toBe(false);
        }
    });

    test("Should generate only 2 moves for a knight in the corner (a1)", () => {
        const a1Index = toIndex(7, 0); // a1
        const expectedMoves = [
            toIndex(6, 2), // b3
            toIndex(5, 1)  // c2
        ];

        const bitboard = knightMoves[a1Index];
        let count = 0;
        
        for (let i = 0; i < 64; i++) {
            if (!bitboard.and(ONE.shl(i)).isZero()) {
                count++;
            }
        }

        expect(count).toBe(2);
        expectedMoves.forEach(move => {
            expect(knightMoves[a1Index].and(ONE.shl(move)).isZero()).toBe(false);
        });
    });

    test("Should generate only 4 moves for a knight at the edge (h4)", () => {
        const h4Index = toIndex(0, 3); // h4
        const expectedMoves = [
            toIndex(2, 4), // f5
            toIndex(2, 2), // f3
            toIndex(1, 5), // g6
            toIndex(1, 1)  // g2
        ];

        let count = 0;
        for (let i = 0; i < 64; i++) {
            if (!knightMoves[h4Index].and(ONE.shl(i)).isZero()) {
                count++;
            }
        }

        expect(count).toBe(4);
        expectedMoves.forEach(move => {
            expect(knightMoves[h4Index].and(ONE.shl(move)).isZero()).toBe(false);
        });
    });

    test("Knight's moves do not go out of bounds", () => {
        for (let i = 0; i < 64; i++) {
            const moves = knightMoves[i];
            for (let j = 0; j < 64; j++) {
                if (!moves.and(ONE.shl(j)).isZero()) {
                    const { x, y } = toCoords(i)
                    const { x: x2, y: y2 } = toCoords(j)
                    const dx = Math.abs(x - x2)
                    const dy = Math.abs(y - y2)
                    expect(dx * dy).toBe(2); // Only (1,2) or (2,1) jumps allowed
                }
            }
        }
    });
});

describe("generateKingMoves", () => {
    let kingMoves: Record<number, Int64>;

    beforeAll(() => {
        kingMoves = generateKingMoves();
    });

    test("Should generate 8 possible moves for the king in the center", () => {
        const centerIndex = toIndex(3, 3); // d4
        const expectedMoves = [
            toIndex(3, 4), // d5
            toIndex(4, 4), // e5
            toIndex(4, 3), // e4
            toIndex(4, 2), // e3
            toIndex(3, 2), // d3
            toIndex(2, 2), // c3
            toIndex(2, 3), // c4
            toIndex(2, 4)  // c5
        ];

        for (const move of expectedMoves) {
            expect(kingMoves[centerIndex].and(ONE.shl(move)).isZero()).toBe(false);
        }
    });

    test("Should generate only 3 moves for the king in the bottom-right corner (h1)", () => {
        const h1Index = toIndex(0, 0); // h1
        const expectedMoves = [
            toIndex(0, 1), // h2
            toIndex(1, 1), // g2
            toIndex(1, 0)  // g1
        ];

        let count = 0;
        for (let i = 0; i < 64; i++) {
            if (!kingMoves[h1Index].and(ONE.shl(i)).isZero()) {
                count++;
            }
        }

        expect(count).toBe(3);
        expectedMoves.forEach(move => {
            expect(kingMoves[h1Index].and(ONE.shl(move)).isZero()).toBe(false);
        });
    });

    test("Should generate only 5 moves for the king on the edge (d1)", () => {
        const d1Index = toIndex(3, 0); // e1
        const expectedMoves = [
            toIndex(2, 0), // c1
            toIndex(2, 1), // c2
            toIndex(3, 1), // d2
            toIndex(4, 1), // e2
            toIndex(4, 0)  // e1
        ];

        let count = 0;
        for (let i = 0; i < 64; i++) {
            if (!kingMoves[d1Index].and(ONE.shl(i)).isZero()) {
                count++;
            }
        }

        expect(count).toBe(5);
        expectedMoves.forEach(move => {
            expect(kingMoves[d1Index].and(ONE.shl(move)).isZero()).toBe(false);
        });
    });

    test("King's moves do not go out of bounds", () => {
        for (let i = 0; i < 64; i++) {
            const moves = kingMoves[i];
            for (let j = 0; j < 64; j++) {
                if (!moves.and(ONE.shl(j)).isZero()) {
                    const { x, y } = toCoords(i)
                    const { x: x2, y: y2 } = toCoords(j)
                    const dx = Math.abs(x - x2)
                    const dy = Math.abs(y - y2)
                    expect(dx <= 1 && dy <= 1).toBe(true); // King moves only one square in any direction
                }
            }
        }
    });
});

describe('checkPawnMoves', () => {
    let board: ChessBoard;
  
    beforeEach(() => {
      board = new ChessBoard(DEFAULT_BOARD);
    });
  
    test('White pawn moves one square forward', () => {
      const flag = SQUARE_FLAGS.e2; // Pawn on e2
      board = new ChessBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 2')
      const moves = checkPawnMoves(board, flag, 'white');
      expect(moves.isBitSet(SQUARE_FLAGS.e3.log2())).toBe(true); // Expect move to e3
    });
  
    test('White pawn moves two squares from start', () => {
      const flag = SQUARE_FLAGS.e2; // Pawn on e2
      board = new ChessBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 2')
      const moves = checkPawnMoves(board, flag, 'white');
      expect(moves.isBitSet(SQUARE_FLAGS.e4.log2())).toBe(true); // e4 (if not blocked)
    });
  
    test('White pawn is blocked and cannot move', () => {
      const flag = SQUARE_FLAGS.e2; // Pawn on e2
      board = new ChessBoard('rnbqkbnr/pppppppp/8/8/8/4p3/PPPPPPPP/RNBQKBNR w KQkq e6 0 2')
      const moves = checkPawnMoves(board, flag, 'white');
      expect(moves.isZero()).toBe(true);
    });
  
    test('White pawn captures diagonally', () => {
      const flag = SQUARE_FLAGS.e2; // Pawn on e2
      board = new ChessBoard('rnbqkbnr/pppppppp/8/8/8/3p1p2/PPPPPPPP/RNBQKBNR w KQkq e6 0 2')
      const moves = checkPawnMoves(board, flag, 'white');
      expect(moves.isBitSet(SQUARE_FLAGS.f3.log2())).toBe(true); // Capture f3
      expect(moves.isBitSet(SQUARE_FLAGS.d3.log2())).toBe(true); // Capture d3
    });
  
    test('Black pawn moves one square forward', () => {
      const flag = SQUARE_FLAGS.e7; // Pawn on e7
      board = new ChessBoard(DEFAULT_BOARD)
      const moves = checkPawnMoves(board, flag, 'black');
      expect(moves.isBitSet(SQUARE_FLAGS.e6.log2())).toBe(true); // e6
    });
  
    test('Black pawn moves two squares from start', () => {
      const flag = SQUARE_FLAGS.e7; // Pawn on e7
      board = new ChessBoard(DEFAULT_BOARD)
      const moves = checkPawnMoves(board, flag, 'black');
      expect(moves.isBitSet(SQUARE_FLAGS.e6.log2())).toBe(true); // e6
      expect(moves.isBitSet(SQUARE_FLAGS.e5.log2())).toBe(true); // e5 (if not blocked)
    });
  
    test('Black pawn is blocked and cannot move', () => {
      const flag = SQUARE_FLAGS.e7; // Pawn on e7
      board = new ChessBoard('rnbqkbnr/pppppppp/4P3/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 2')
      const moves = checkPawnMoves(board, flag, 'black');
      expect(moves.isZero()).toBe(true);
    });
  
    test('Black pawn captures diagonally', () => {
      const flag = SQUARE_FLAGS.e7; // Pawn on e7
      board = new ChessBoard('rnbqkbnr/pppppppp/3P1P2/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 2')
      const moves = checkPawnMoves(board, flag, 'black');
      expect(moves.isBitSet(SQUARE_FLAGS.d6.log2())).toBe(true); // Capture d6
      expect(moves.isBitSet(SQUARE_FLAGS.f6.log2())).toBe(true); // Capture f6
    });
  
    test('Pawn does not capture empty diagonal squares', () => {
      const flag = SQUARE_FLAGS.e2; // Pawn on e2
      board = new ChessBoard(DEFAULT_BOARD)
      const moves = checkPawnMoves(board, flag, 'white');
      expect(moves.isBitSet(SQUARE_FLAGS.f3.log2())).toBe(false); // No piece to capture on f3
      expect(moves.isBitSet(SQUARE_FLAGS.d3.log2())).toBe(false); // No piece to capture on d3
    });
  });

  test('should allow capturing bishop', () => {
    const board = new ChessBoard('rnbqkb1R/ppppp2p/8/8/8/8/PPQP1PPP/RNB1KBNR w KQkq - 0 6')
    const moves = getLegalMoveIndicesAtIndex(board, SQUARE_INDEX.h8)
    expect(moves.length).toBe(3)
    expect(moves).toContain(SQUARE_INDEX.f8)
  })