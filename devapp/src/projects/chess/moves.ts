import Int64 from '../../logic/Int64';

const ZERO = new Int64(0)
const ONE = new Int64(1)

export const knightMoves = generateKnightMoves()
export const kingMoves = generateKingMoves()

type Coords = [x: number, y: number]

function generateKingMoves() {
    const lookup: Record<number, Int64> = {}
    for(let i = 0; i < 64; i++) {
        const { x, y } = toCoords(i)
        let moves = ZERO
        let candidateMoves: Coords[] = [
            [x, y + 1],
            [x + 1, y + 1],
            [x + 1, y],
            [x + 1, y - 1],
            [x, y - 1],
            [x - 1, y - 1],
            [x - 1, y],
            [x - 1, y + 1],
        ]
        candidateMoves = candidateMoves.filter(isInBounds)
        for(const move of candidateMoves) {
            const [x, y] = move
            const index = toIndex(x, y)
            moves = moves.or(ONE.shl(index))
        }
        lookup[i] = moves
    }
    return lookup
}

function isInBounds(move: Coords) {
    const [x, y] = move
    return x >= 0 && x <= 7 && y >= 0 && y <= 7
}

function generateKnightMoves() {
    const lookup: Record<number, Int64> = {}
    for(let i = 0; i < 64; i++) {
        const { x, y } = toCoords(i)
        let moves = ZERO
        let candidateMoves: Coords[] = [
            [x - 1, y + 2],
            [x + 1, y + 2],
            [x + 2, y + 1],
            [x + 2, y - 1],
            [x + 1, y - 2],
            [x - 1, y - 2],
            [x - 2, y - 1],
            [x - 2, y + 1]
        ]
        candidateMoves = candidateMoves.filter(isInBounds)
        for(const move of candidateMoves) {
            const [x, y] = move
            const index = toIndex(x, y)
            moves = moves.or(ONE.shl(index))
        }
        lookup[i] = moves
    }
    return lookup
}

function toIndex(x: number, y: number) {
    return y * 8 + (7 - x)
}

function toCoords(index: number) {
    const x = 7 - (index % 8)
    const y = Math.floor(index / 8)
    return { x, y }
}