import { useState, useEffect } from 'react'
import styles from './BoardView.module.css'
import ChessBoard from './logic/game/board'
import { Color, Piece, PromotablePiece } from './models/Piece'
import { Square } from './models/Square'
import { IconChessBishopFilled, IconChessFilled, IconChessKingFilled, IconChessKnightFilled, IconChessQueenFilled, IconChessRookFilled } from '@tabler/icons-react'
import Engine from './engine'
import { DEFAULT_BOARD } from './constants/fen'
import { getLegalMoveIndicesAtIndex, getLegalMovesAtIndex, getMove } from './logic/move-generation/moves'
import { Move } from './logic/game/move'

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

type GameState = {
  isOver: boolean
  winner: Color | null
}

export const Board = () => {
  const [board, setBoard] = useState<ChessBoard>(new ChessBoard(DEFAULT_BOARD))
  const [playerColor, setPlayerColor] = useState<Color>('white')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [isPromoting, setIsPromoting] = useState<boolean>(false)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<number[]>([])
  const [isBotActive, setIsBotActive] = useState(true)
  const [gameState, setGameState] = useState<GameState>({ isOver: false, winner: null })
  const [isGameStarted, setIsGameStarted] = useState(true)

  const handleMove = (board: ChessBoard, move: Move) => {
    const color = board._data._turn
    move.apply(board)
    if (board.isCheckState()) {
      checkSound.play()
    } 
    if (board.isCheckmateState()) {
      setGameState({ isOver: true, winner: color })
    }
    if (board.isStalemate()) {
      setGameState({ isOver: true, winner: null })
    }
    if (board.isAwaitingPromotionState()) {
      setIsPromoting(true)
    }
  }

  useEffect(() => {
    if (isBotActive && playerColor === 'black' && !isGameStarted) {
      const result = engine.findDeepeningOptimalMove(board, board.flipColor(playerColor))
      if (result.move) {
        result.move.apply(board)
        if (board.isCheckState()) {
          checkSound.play()
        }
        setBoard(board.clone())
        if (board.isCheckmateState()) {
          setGameState({ isOver: true, winner: 'black' })
        } else if (board.isStalemate()) {
          setGameState({ isOver: true, winner: null })
        }
      }
    }
  }, [isBotActive, playerColor, isGameStarted])

  const handlePieceClick = (targetIndex: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(targetIndex)
    } else {
      const legalMoves = getLegalMoveIndicesAtIndex(board, selectedIndex)
      if (legalMoves.includes(targetIndex)) {
        const move = getMove(board, selectedIndex, targetIndex)
        handleMove(board, move)
        setLastMove(move)
        const clone = board.clone()
        setBoard(clone)
        setPossibleMoves([])
        setSelectedIndex(null)

        if (isBotActive) {
          // setTimeout to avoid state changes bundling without splitting into useEffect chains
          setTimeout(() => {
            const result = engine.findDeepeningOptimalMove(clone, board.flipColor(playerColor))
            const move = result.move
            if (move == null) throw new Error('Should be able to find a move here!')
            handleMove(clone, move) 
            setBoard(clone.clone())
          }, 0)
        }
      }
    }
  }

  useEffect(() => {
    if (selectedIndex != null) {
      setPossibleMoves(getLegalMoveIndicesAtIndex(board, selectedIndex))
    } else {
      setPossibleMoves([])
    }
  }, [board, selectedIndex])

  const handlePromotion = (piece: PromotablePiece) => {
    if (lastMove != null) {
      board.applyPromotion(lastMove.to, piece)
      setBoard(board.clone())
      setIsPromoting(false)
    }
  }

  const handleNextClick = () => {
    const result = engine.findDeepeningOptimalMove(board, board._data._turn)
    const move = result.move
    if (move) {
      handleMove(board, move)
      setBoard(move?.result.board.clone())
    }
  }

  const handlePreviousClick = () => {
    if (lastMove != null) {
      lastMove.undo()
      setBoard(lastMove.result.board.clone())
    }
  }

  const handleRestartClick = () => {
    setGameState({ isOver: false, winner: null })
    setSelectedIndex(null)
    setHistory([])
    setBoard(new ChessBoard(DEFAULT_BOARD))
    setIsGameStarted(false)
  }

  const boardView = board.toBoardView()

  return (
    <>
      <div className={styles['chess-container']}>
        <div className={styles['chess-modal-container']}>
          {isPromoting && (
            <div className={styles['chess-modal']}>
              <div onClick={() => handlePromotion('N')} className={styles[`chess-promotion-choice-${board.flipColor(board._data._turn)}`]}><IconChessKnightFilled /></div>
              <div onClick={() => handlePromotion('B')} className={styles[`chess-promotion-choice-${board.flipColor(board._data._turn)}`]}><IconChessBishopFilled /></div>
              <div onClick={() => handlePromotion('R')} className={styles[`chess-promotion-choice-${board.flipColor(board._data._turn)}`]}><IconChessRookFilled /></div>
              <div onClick={() => handlePromotion('Q')} className={styles[`chess-promotion-choice-${board.flipColor(board._data._turn)}`]}><IconChessQueenFilled /></div>
            </div>
          )
          }
          {
            gameState.isOver && (
              <div className={styles['chess-modal']}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div>
                    <p>
                      Game over.
                      <br />
                      {gameState.winner === null ? 'Stalemate.' : `${gameState.winner} won.`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button className={styles['chessboard-control']} onClick={handleRestartClick}>Restart</button>
                  </div>
                </div>
              </div>
            )
          }
          <div className={styles['chessboard-controls']}>
            <button className={isBotActive ? styles['chessboard-control-active'] : styles['chessboard-control']} onClick={() => {
              setIsBotActive(prev => !prev)
            }}>Bot: {isBotActive ? 'On' : 'Off'}
            </button>
            <button className={playerColor === 'black' ? styles['chessboard-control-active'] : styles['chessboard-control']} onClick={() => {
              setPlayerColor(prev => board.flipColor(prev))
            }}>Color: {playerColor}</button>
          </div>
          <div key={selectedIndex} className={styles['board-container']}>
            <div className={styles.board}>
              {boardView.map((row, i) => <BoardRow key={i} row={row} i={i} moves={possibleMoves} onClick={handlePieceClick} />)}
              <div className={styles['notation']}>
                <span style={{ alignSelf: 'center', padding: '4px', visibility: 'hidden' }}>{'1'}</span>
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(col => (<div className={styles['notation-col']} key={col}><span>{col}</span></div>))}
              </div>
            </div>
          </div>
          <div className={styles['chessboard-controls']}>
            <button className={styles['chessboard-control']} onClick={handlePreviousClick}>Undo</button>
            <button className={styles['chessboard-control']} onClick={handleNextClick}>Next</button>
            <button className={styles['chessboard-control']} onClick={() => {
              navigator.clipboard.writeText(board.save())
            }}>Copy</button>
          </div>
        </div>
      </div>
    </>
  )
}

const BoardRow = ({ row, i, moves, onClick }: { row: Square[], i: number, moves: number[], onClick: (j: number) => void }) => {
  return (
    <div key={i} className={styles.row}>
      <span style={{ alignSelf: 'center', padding: '4px', color: '#FFF' }}>{8 - i}</span>
      {row.map((square, j) => {
        const pieceStyle = square.color === 'black' ? styles.black : styles.white;
        const squareStyle = `${styles.square} ${((j + i) % 2) === 0 ? styles["square-white"] : styles["square-black"]}`
        let style = `${pieceStyle} ${squareStyle}`
        if (moves.includes(square.index)) {
          style += ` ${styles['candidate-move']}`
        }
        return (
          <div key={`${i}_${j}`} onClick={() => onClick(square.index)} className={style}>
            <span style={{ padding: '8px' }}>{square.piece != null ? iconsLookup[square.piece] : <EmptySquare />}</span>
          </div>
        )
      })}
    </div>
  )
}

const EmptySquare = () => {
  return (
    <div style={{ width: '24px', height: '24px' }} />
  )
}