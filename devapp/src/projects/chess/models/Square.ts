import { Piece, Color } from './Piece'


export interface Square {
    piece: Piece | null
    color: Color
    index: number
  }