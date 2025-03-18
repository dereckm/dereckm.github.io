import { } from 'jest'
import Int64 from './Int64'

test('basic', () => {
    const number = Int64.fromString('0b1000000010000000100000001000000010000000100000001000000010000000')
    expect(number.toString(2)).toBe('1000000010000000100000001000000010000000100000001000000010000000')
})


test('left shift', () => {
    const bigint = BigInt('0b1000000010000000100000001000000010000000100000001000000010000000')
    const int64 = Int64.fromString('0b1000000010000000100000001000000010000000100000001000000010000000')
    for(let i = 0; i < 65; i++) {
        const expectedStr = (bigint << BigInt(i)).toString(2).slice(-64)
        const expected = BigInt(`0b${expectedStr}`).toString(2)
        expect(int64.shl(i).toString(2)).toBe(expected)
    } 
})

test('left shift flag', () => {
    const bigint = BigInt(1)
    const int64 = new Int64(1)
    for(let i = 0; i < 64; i++) {
        const expectedStr = (bigint << BigInt(i)).toString(2)
        expect(int64.shl(i).toString(2)).toBe(expectedStr)
    }
})

test('right shift', () => {
    const bigint = BigInt('0b1000000010000000100000001000000010000000100000001000000010000000')
    const int64 = Int64.fromString('0b1000000010000000100000001000000010000000100000001000000010000000')
    for(let i = 0; i < 3; i++) {
        const expected = (bigint >> BigInt(i)).toString(2)
        expect(int64.shr(i).toString(2)).toBe(expected)
    } 
})

test('and operator', () => {
    const bigint = BigInt('0b1000000010000000100000001000000010000000100000001000000010000000')
    const int64 = Int64.fromString('0b1000000010000000100000001000000010000000100000001000000010000000')

    for(let i = 0; i < 15; i += 1000) {
        const expected = (bigint & BigInt(i)).toString(2);
        expect(int64.and(new Int64(i)).toString(2)).toBe(expected)
    }
})

test('and check bit', () => {
    const bigint = BigInt('0b1000000010000000100000001000000010000000100000001000000010000000')
    const int64 = Int64.fromString('0b1000000010000000100000001000000010000000100000001000000010000000')

    const one = new Int64(1)
    for(let i = 0; i < 64; i++) {
        const expected = (bigint & (BigInt(1) << BigInt(i))) === BigInt(0)
        const shift = one.shl(i)
        const flag = int64.and(shift)
        expect(flag.isZero()).toBe(expected)
    }
})

test('xor', () => {
    const bigint = BigInt('0b1000000010000000100000001000000010000000100000001000000010000000')
    const int64 = Int64.fromString('0b1000000010000000100000001000000010000000100000001000000010000000')
    const one = new Int64(1)
    for(let i = 0; i < 64; i++) {
        const expected = (bigint ^ (BigInt(1) << BigInt(i))).toString(2)
        expect(int64.xor(one.shl(i)).toString(2)).toBe(expected)
    }
})

test('from string', () => {
    const int64 = Int64.fromString('0b0000000000000000000000000000000000000000000000001111111100000000')
    expect(int64.high).toBe(0)
    expect(int64.low).toBe(65280)
    expect(int64.toString(2)).toBe('1111111100000000')
})

test('log2', () => {
    const one = new Int64(1)
    for(let i = 0; i < 64; i++) {
        expect(one.shl(i).log2()).toBe(i)
    }
})