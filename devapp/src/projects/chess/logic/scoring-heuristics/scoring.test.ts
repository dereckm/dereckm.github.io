import { expect, test } from 'vitest'

import ChessBoard from "../../board"
import { DEFAULT_BOARD } from "../../constants/fen"
import { calculateOverallScoreDelta, calculatePiecesScore, calculateScoreDelta } from "./scoring"

test('should calculate white pieces score correctly', () => {
    const board = new ChessBoard(DEFAULT_BOARD)
    const score = calculatePiecesScore(board, 'white')
    expect(score).toBe(39)
})

test('should calculate black pieces score correctly', () => {
    const board = new ChessBoard(DEFAULT_BOARD)
    const score = calculatePiecesScore(board, 'white')
    expect(score).toBe(39)
})

test('should find no delta when same pieces in same position', () => {
    const board = new ChessBoard(DEFAULT_BOARD)
    const score = calculateOverallScoreDelta(board)
    expect(score).toBe(0)
})