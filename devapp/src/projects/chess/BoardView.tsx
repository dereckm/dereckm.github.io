import { useState, useEffect } from 'react'
import styles from './BoardView.module.css'
import ChessBoard, { MoveResult } from './board'
import { Piece, PromotablePiece } from './models/Piece'
import { Square } from './models/Square'
import { IconChessBishopFilled, IconChessFilled, IconChessKingFilled, IconChessKnightFilled, IconChessQueenFilled, IconChessRookFilled } from '@tabler/icons-react'
import Engine from './engine'
import { calculateScoreDelta } from './logic/scoring-heuristics/scoring'
import { DEFAULT_BOARD } from './constants/fen'

const checkSound = new Audio('move-check.mp3')

const iconsLookup: Record<Piece, JSX.Element> = {
  'P': <IconChessFilled scale='10x' />,
  'N': <IconChessKnightFilled />,
  'B': <IconChessBishopFilled />,
  'R': <IconChessRookFilled />,
  'Q': <IconChessQueenFilled />,
  'K': <IconChessKingFilled />
}

const engine = new Engine()

export const Board = () => {
  const [board, setBoard] = useState(new ChessBoard(DEFAULT_BOARD))
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [isPromoting, setIsPromoting] = useState<boolean>(false)
  const [lastMoveResult, ] = useState<MoveResult | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<number[]>([])
  const [isBotActive, setIsBotActive] = useState(true)

  const handlePieceClick = (targetIndex: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(targetIndex)
    } else {
      const legalMoves = board.getMoveIndexes(selectedIndex)
      if (legalMoves.includes(targetIndex)) {
        const moveResult = board.applyMove(selectedIndex, targetIndex)
        if (moveResult.isCheck) {
          checkSound.play()
        }
        if (moveResult.isPromotion) {
          setIsPromoting(true)
        }
        const clone = board.clone()
        setBoard(clone)

        if (isBotActive) {
          setTimeout(() => {
            const result = engine.findDeepeningOptimalMove(clone, 'black', 500)
            if (result.move) {
              const moveResult = clone.applyMove(result.move?.from, result.move?.to)
              if (moveResult.isCheck) {
                checkSound.play()
              }
              setBoard(clone.clone())
            }
          }, 100)
        }
      }
      setSelectedIndex(null)
    }
  }

  useEffect(() => {
    if (selectedIndex != null) {
      setPossibleMoves(board.getMoveIndexes(selectedIndex))
    } else {
      setPossibleMoves([])
    }
  }, [board, selectedIndex])

  const handlePromotion = (piece: PromotablePiece) => {
    if (selectedIndex != null && lastMoveResult != null) {
      board.applyPromotion(lastMoveResult.movedTo, piece)
      setBoard(board.clone())
      setIsPromoting(false)
    }
  }

  const handleNextClick = () => {
    const result = engine.findDeepeningOptimalMove(board, board._turn, 500)
    debugger;
    if (result.move) {
      const moveResult = board.applyMove(result.move?.from, result.move?.to)
      if (moveResult.isCheck) {
        checkSound.play()
      }
      setBoard(board.clone())
    }
  }

  const handlePreviousClick = () => {
    console.log('undo!')
    const lastState = board.undoMove()
    if (lastState) {
      setBoard(board.clone())
    }
  }

  const boardView = board.toBoardView()
 
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
          <div key={selectedIndex} className={styles['board-container']}>
            <div className={styles.board}>
              {boardView.map((row, i) => <BoardRow key={i} row={row} i={i} moves={possibleMoves} onClick={handlePieceClick} />)}
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
          <button className={styles['chessboard-control']} onClick={handlePreviousClick}>Previous</button>
          <button className={styles['chessboard-control']} onClick={handleNextClick}>Next</button>
          <button className={styles['chessboard-control']} onClick={() => {
            navigator.clipboard.writeText(board.save())
          }}>Copy</button>
          <button className={isBotActive ? styles['chessboard-control-active'] : styles['chessboard-control']} onClick={() => {
            setIsBotActive(prev => !prev)
          }}>Bot: {isBotActive ? 'On' : 'Off'}</button>
        </div>
      </div>
    </>
  )
}

const BoardRow = ({ row, i, moves, onClick }: { row: Square[], i: number, moves: number[], onClick: (j: number) => void }) => {
  return (
    <div key={i} className={styles.row}>
      <span style={{ alignSelf: 'center', padding: '4px' }}>{8 - i}</span>
      {row.map((square, j) => {
        const pieceStyle = square.color === 'black' ? styles.black : styles.white;
        const squareStyle = `${styles.square} ${((j + i) % 2) === 0 ? styles["square-white"] : styles["square-black"] }`
        let style = `${pieceStyle} ${squareStyle}`
        if (moves.includes(square.index)) {
            style += ` ${styles['candidate-move']}`
        }
        return <div key={`${i}_${j}`} onClick={() => onClick(square.index)} className={style}><span>{square.piece != null ? iconsLookup[square.piece] : ""}</span></div>
      })}
    </div>
  )
}