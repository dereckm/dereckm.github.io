function generateFlagIndexLookup(): Record<number, number> {
  const lookup: Record<number, number> = {};
  for (let i = 0; i < 32; i++) {
    lookup[(1 << i) >>> 0] = i;
  }
  return lookup;
}

export const INDEX_LOOKUP_FROM_FLAG = generateFlagIndexLookup()

export default class Int64 {
    low: number
    high: number
    constructor(low: number, high: number = 0) {
      this.low = low;
      this.high = high;
    }
  
    // Bitwise left shift
    shl(bits: number) {
      if (bits === 0) return this
      if (bits >= 64) return new Int64(0, 0)
      if (bits < 32) {
        return new Int64(
          (this.low << bits) >>> 0,
          ((this.high << bits) | (this.low >>> (32 - bits))) >>> 0
        )
      } else {
        return new Int64(
          0,
          (this.low << (bits - 32)) >>> 0
        );
      }
    }
  
    isZero() {
      return (this.low === 0 && this.high === 0)
    }
  
    // Bitwise right shift
    shr(bits: number) {
      if (bits === 0) return this;
      if (bits >= 64) return new Int64(0, 0); // Shifting everything out
  
      bits &= 63; // Ensure bits in range [0, 63]
  
      if (bits < 32) {
          return new Int64(
              (this.low >>> bits) | ((this.high << (32 - bits)) >>> 0),  // Shift low & carry from high
              (this.high >>> bits) >>> 0  // Ensure unsigned shift
          );
      } else {
          return new Int64(
              (this.high >>> (bits - 32)) >>> 0,  // Shift high into low
              0
          );
      }
    }
  
    // Bitwise AND
    and(other: Int64) {
      return new Int64((this.low & other.low) >>> 0, (this.high & other.high) >>> 0);
    }

    set(low: number, high: number) {
      this.low = low;
      this.high = high;
    }
  
    // Bitwise OR
    or(other: Int64) {
      return new Int64((this.low | other.low) >>> 0, (this.high | other.high) >>> 0);
    }
  
    // Bitwise XOR
    xor(other: Int64) {
      return new Int64((this.low ^ other.low) >>> 0, (this.high ^ other.high) >>> 0);
    }
  
    // Bitwise NOT
    not() {
      return new Int64((~this.low) >>> 0, (~this.high) >>> 0);
    }
  
    isFlag() {
      return this.and(new Int64(this.low - 1, this.high)).isZero()
    }
  
    log2() {
      if (this.low === 0) {
        return INDEX_LOOKUP_FROM_FLAG[this.high] + 32
      }
      return INDEX_LOOKUP_FROM_FLAG[this.low]

      return this.low === 0 
        ? Math.log2(this.high) + 32
        : Math.log2(this.low)
    }

    isBitSet(index: number) {
      return !this.and(ONE.shl(index)).isZero()
    }
  
    equals(other: Int64) {
      return this.low === other.low && this.high === other.high
    }
  
    // Utility method to convert the 64-bit number to a string in hexadecimal format
    toString(base: number) {
      if (base === 2) {
        if (this.high === 0) return this.low.toString(2)
        const high = this.high.toString(2)
        let low = this.low.toString(2)
        if (this.high > 0) {
          low = low.padStart(32, '0')
        }
        return  high + low
      }
      return this.high.toString(16).padStart(8, '0') + this.low.toString(16).padStart(8, '0');
    }
  
    static fromString(str: string) {
        const prefix = str[1]
        const data = str.slice(2).padStart(64, '0')
        if (prefix === 'b') {
            return new Int64(
                parseInt(data.slice(32), 2),
                parseInt(data.slice(0, 32), 2)
            )
        } else if (prefix === 'x') {
            return new Int64(
                parseInt(data.slice(0, 8), 16),
                parseInt(data.slice(8), 16)
            )
        } else {
            throw new Error('Invalid format. Use 0b or 0x prefix.')
        }
    }
  }

export const ZERO = new Int64(0)
export const ONE = new Int64(1)