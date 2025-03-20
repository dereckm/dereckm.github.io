import { useMemo, useState } from 'react'
import styles from './BoardView.module.css'
import ChessBoard, { Color, MoveResult, Piece, PromotablePiece, Square } from './board'
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
board.loadAll('*******p*P****************p*********P***********P*P*************')


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
  const [isPromoting, setIsPromoting] = useState<boolean>(false)
  const [lastMoveResult, setLastMoveResult] = useState<MoveResult | null>(null)
  const isBotEnabled = false
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
    if (index != null && moves.has(newIndex)) {
      setHistory([...history, board.toNotation(index, newIndex)])
      const moveResult = board.applyMove(index, newIndex)
      setLastMoveResult(moveResult)
      if (moveResult.isPromotion) {
        setIsPromoting(true)
        return
      }
      setBoardChanged(prev => !prev)
      if (isBotEnabled) {
        botTurn(board._turn)
      }
      setIndex(null)
    } else {
      setIndex(newIndex)
    }
  }

  const handlePromotion = (piece: PromotablePiece) => {
    if (index != null && lastMoveResult != null) {
      console.log(lastMoveResult)
      board.applyPromotion(lastMoveResult.movedTo, piece)
      board.print()
      setIsPromoting(false)
      setBoardChanged(prev => !prev)
    }
  }

  const view = board.toBoardView()
 
  return (
    <>
      <div className={styles['chess-container']}>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        { isPromoting && (
          <div className={styles['chess-promotion-modal']}>
            <div onClick={() => handlePromotion('N')} className={styles['chess-promotion-choice']}><IconChessKnightFilled /></div>
            <div onClick={() => handlePromotion('B')} className={styles['chess-promotion-choice']}><IconChessBishopFilled /></div>
            <div onClick={() => handlePromotion('R')} className={styles['chess-promotion-choice']}><IconChessRookFilled /></div>
            <div onClick={() => handlePromotion('Q')} className={styles['chess-promotion-choice']}><IconChessQueenFilled /></div>
          </div>
        )
      }
      { !isPromoting && (
          <div className={styles['board-container']}>
            <div className={styles.board}>
              {view.map((row, i) => <BoardRow key={i} row={row} i={i} moves={moves} onClick={handlePieceClick} />)}
              <div className={styles['notation']}>
                <span style={{ alignSelf: 'center', padding: '4px', visibility: 'hidden' }}>{'1'}</span>
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(col => (<div className={styles['notation-col']} key={col}><span>{col}</span></div>))}
              </div>
            </div>
          </div>
        )
      }
        <div className={styles['move-history']}>
          <div className={styles['move-history-content']}>
          {history.map((notation, i) => (<div key={`${notation}+${i}`}>{i}. {notation}</div>))}
          </div>
        </div>
      </div>
      <div className={styles['chessboard-controls']}>
          <button className={styles['chessboard-control']} onClick={() => botTurn(board._turn)}>Next</button>
          <button className={styles['chessboard-control']} onClick={() => {
            navigator.clipboard.writeText(board.save())
          }}>Copy</button>
        </div>
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