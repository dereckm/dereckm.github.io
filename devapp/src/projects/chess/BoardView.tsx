import { useMemo, useState } from 'react'
import styles from './BoardView.module.css'
import ChessBoard, { Color, Piece, Square } from './board'
import { IconChessBishopFilled, IconChessFilled, IconChessKingFilled, IconChessKnightFilled, IconChessQueenFilled, IconChessRookFilled } from '@tabler/icons-react'
import Engine from './engine'


const iconsLookup: Record<Piece, JSX.Element> = {
  'P': <IconChessFilled scale='10x' />,
  'N': <IconChessKnightFilled />,
  'B': <IconChessBishopFilled />,
  'R': <IconChessRookFilled />,
  'Q': <IconChessQueenFilled />,
  'K': <IconChessKingFilled />
}

const engine = new Engine()
const board = new ChessBoard()
board.loadAll('rbn*knbrpp*ppppp**********p*********P****NqPN***P*P**PPPRB*QK*BR')


const bind = () => {
  const theWindow = (window as unknown as any)
  theWindow.engine = engine
  theWindow.board = board
}
bind()

export const Board = () => {
  const [index, setIndex] = useState<number | null>(null)
  const [boardChanged, setBoardChanged] = useState<boolean>(false)
  const [history, setHistory] = useState<string[]>([])
  const isBotEnabled = true
  const moves = useMemo(() => {
      if (boardChanged) {
        console.log('a')
      }
      if (index === null) return new Set<number>([])
      return new Set<number>(board.getMoveIndexes(index))
    }, [index, boardChanged])

  const botTurn = (color: Color) => {
    const engineMove = engine.findDeepeningOptimalMove(board, color, 500)
    if (engineMove.move == null) {
      console.log('engine lost')
      return
    }
    const from = engineMove.move.from
    const to = engineMove.move.to
    const newMove = board.toNotation(from, to)
    setHistory(prev => [...prev, newMove])
    board.applyMove(engineMove.move.from, engineMove.move.to)
    setBoardChanged(prev => !prev)
  }

  const handlePieceClick = (newIndex: number) => {
    console.log(newIndex)
    if (index != null && moves.has(newIndex)) {
      setHistory([...history, board.toNotation(index, newIndex)])
      board.applyMove(index, newIndex)
      setBoardChanged(prev => !prev)
      if (isBotEnabled) {
        botTurn(board._turn)
      }
      setIndex(null)
    } else {
      setIndex(newIndex)
    }
  }

  const view = board.toBoardView()
 
  return (
    <>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div className={styles['board-container']}>
          <div className={styles.board}>
            {view.map((row, i) => <BoardRow key={i} row={row} i={i} moves={moves} onClick={handlePieceClick} />)}
            <div className={styles['notation']}>
              <span style={{ alignSelf: 'center', padding: '4px', visibility: 'hidden' }}>{'1'}</span>
              {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(col => (<div className={styles['notation-col']} key={col}><span>{col}</span></div>))}
            </div>
          </div>
        </div>
        <div 
        style={{
          padding: '32px',
          backgroundColor: 'lightgrey',
          overflowY: 'scroll',
          font: 'menu',
          fontSize: '1em',
          fontWeight: '500',
          maxHeight: '500px'
        }}>
          {history.map((notation, i) => (<div key={`${notation}+${i}`}>{i}. {notation}</div>))}
        </div>
      </div>
      <div>
        <button onClick={() => botTurn(board._turn)}>Next</button>
        <button onClick={() => {
          navigator.clipboard.writeText(board.save())
        }}>Copy</button>
      </div>
    </>

  )
}

const BoardRow = ({ row, i, moves, onClick }: { row: Square[], i: number, moves: Set<number>, onClick: (j: number) => void }) => {
  return (
    <div key={i} className={styles.row}>
      <span style={{ alignSelf: 'center', padding: '4px' }}>{8 - i}</span>
      {row.map((square, j) => {
        const pieceStyle = square.color === 'black' ? styles.black : styles.white;
        const squareStyle = `${styles.square} ${((j + i) % 2) === 0 ? styles["square-white"] : styles["square-black"] }`
        let style = `${pieceStyle} ${squareStyle}`
        if (moves.has(square.index)) {
            style += ` ${styles['candidate-move']}`
        }
        return <div key={`${i}_${j}`} onClick={() => onClick(square.index)} className={style}><span>{square.piece != null ? iconsLookup[square.piece] : ""}</span></div>
      })}
    </div>
  )
}