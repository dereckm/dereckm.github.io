import { Move } from "../game/move"

export function prioritizeMoves(moves: Move[]) {
    return moves.toSorted((a, b) => {
        if (a.isCapture && !b.isCapture) {
            return -1
        } else if (!a.isCapture && b.isCapture) {
            return 1
        }
        return 0
    })
}