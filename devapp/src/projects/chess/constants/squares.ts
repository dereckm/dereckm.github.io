import Int64, { ONE } from "../../../logic/Int64";


export const SQUARE_FLAGS = {
    h1: ONE,
    h2: ONE.shl(8),
    h3: ONE.shl(16),
    h4: ONE.shl(24),
    h5: ONE.shl(32),
    h6: ONE.shl(40),
    h7: ONE.shl(48),
    h8: ONE.shl(56),

    g1: ONE.shl(1 + 0),
    g2: ONE.shl(1 + 8),
    g3: ONE.shl(1 + 16),
    g4: ONE.shl(1 + 24),
    g5: ONE.shl(1 + 32),
    g6: ONE.shl(1 + 40),
    g7: ONE.shl(1 + 48),
    g8: ONE.shl(1 + 56),

    f1: ONE.shl(2 + 0),
    f2: ONE.shl(2 + 8),
    f3: ONE.shl(2 + 16),
    f4: ONE.shl(2 + 24),
    f5: ONE.shl(2 + 32),
    f6: ONE.shl(2 + 40),
    f7: ONE.shl(2 + 48),
    f8: ONE.shl(2 + 56),

    e1: ONE.shl(3 + 0),
    e2: ONE.shl(3 + 8),
    e3: ONE.shl(3 + 16),
    e4: ONE.shl(3 + 24),
    e5: ONE.shl(3 + 32),
    e6: ONE.shl(3 + 40),
    e7: ONE.shl(3 + 48),
    e8: ONE.shl(3 + 56),

    d1: ONE.shl(4 + 0),
    d2: ONE.shl(4 + 8),
    d3: ONE.shl(4 + 16),
    d4: ONE.shl(4 + 24),
    d5: ONE.shl(4 + 32),
    d6: ONE.shl(4 + 40),
    d7: ONE.shl(4 + 48),
    d8: ONE.shl(4 + 56),

    c1: ONE.shl(5 + 0),
    c2: ONE.shl(5 + 8),
    c3: ONE.shl(5 + 16),
    c4: ONE.shl(5 + 24),
    c5: ONE.shl(5 + 32),
    c6: ONE.shl(5 + 40),
    c7: ONE.shl(5 + 48),
    c8: ONE.shl(5 + 56),

    b1: ONE.shl(6 + 0),
    b2: ONE.shl(6 + 8),
    b3: ONE.shl(6 + 16),
    b4: ONE.shl(6 + 24),
    b5: ONE.shl(6 + 32),
    b6: ONE.shl(6 + 40),
    b7: ONE.shl(6 + 48),
    b8: ONE.shl(6 + 56),

    a1: ONE.shl(7 + 0),
    a2: ONE.shl(7 + 8),
    a3: ONE.shl(7 + 16),
    a4: ONE.shl(7 + 24),
    a5: ONE.shl(7 + 32),
    a6: ONE.shl(7 + 40),
    a7: ONE.shl(7 + 48),
    a8: ONE.shl(7 + 56),
}

const generateFlagsLookupByIndex = () => {
    const lookup: Record<number, Int64> = {}
    for(let i = 0; i < 64; i++) {
        lookup[i] = ONE.shl(i)
    }
    return lookup
}
export const FLAGS_LOOKUP_INDEX: Record<number, Int64> = generateFlagsLookupByIndex()

export const SQUARE_INDEX = {
    h1: 0,
    g1: 1,
    f1: 2,
    e1: 3,
    d1: 4,
    c1: 5,
    b1: 6,
    a1: 7,

    h2: 8,
    g2: 9,
    f2: 10,
    e2: 11,
    d2: 12,
    c2: 13,
    b2: 14,
    a2: 15,

    h3: 16,
    g3: 17,
    f3: 18,
    e3: 19,
    d3: 20,
    c3: 21,
    b3: 22,
    a3: 23,

    h4: 24,
    g4: 25,
    f4: 26,
    e4: 27,
    d4: 28,
    c4: 29,
    b4: 30,
    a4: 31,

    h5: 32,
    g5: 33,
    f5: 34,
    e5: 35,
    d5: 36,
    c5: 37,
    b5: 38,
    a5: 39,

    h6: 40,
    g6: 41,
    f6: 42,
    e6: 43,
    d6: 44,
    c6: 45,
    b6: 46,
    a6: 47,

    h7: 48,
    g7: 49,
    f7: 50,
    e7: 51,
    d7: 52,
    c7: 53,
    b7: 54,
    a7: 55,

    h8: 56,
    g8: 57,
    f8: 58,
    e8: 59,
    d8: 60,
    c8: 61,
    b8: 62,
    a8: 63,
}
