import { useState, useEffect } from 'react'
import './GameScreen.css'

interface GameScreenProps {
  playerName: string
  onReset: () => void
  onGameEnd: (winnings: number) => void
  playerScores: { name: string; winnings: number }[]
}

const LEFT_COLUMN_VALUES = [0.05, 1, 5, 10, 20, 50, 100, 125, 150, 200, 250]
const RIGHT_COLUMN_VALUES = [300, 350, 400, 450, 500, 600, 700, 800, 1000, 2500, 5000]
const ALL_VALUES = [...LEFT_COLUMN_VALUES, ...RIGHT_COLUMN_VALUES]

type GamePhase = 'SELECT_YOUR_CASE' | 'OPEN_CASES' | 'BANKER_OFFER' | 'GAME_OVER'

interface Briefcase {
  id: number
  amount: number | null
  isPlayerCase: boolean
  isOpened: boolean
}

const CASES_TO_OPEN_PER_ROUND = [6, 5, 4, 3, 2, 1]

function GameScreen({ playerName, onReset, onGameEnd, playerScores }: GameScreenProps) {
  const [briefcases, setBriefcases] = useState<Briefcase[]>([])
  const [gamePhase, setGamePhase] = useState<GamePhase>('SELECT_YOUR_CASE')
  const [currentRound, setCurrentRound] = useState(0)
  const [casesOpenedThisRound, setCasesOpenedThisRound] = useState(0)
  const [openedAmounts, setOpenedAmounts] = useState<number[]>([])
  const [casesToRemove, setCasesToRemove] = useState<number[]>([])
  const [finalWinnings, setFinalWinnings] = useState<number>(0)

  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = () => {
    const shuffledAmounts = [...ALL_VALUES].sort(() => Math.random() - 0.5)
    const cases: Briefcase[] = []
    
    for (let i = 1; i <= 24; i++) {
      if (i === 23 || i === 24) {
        cases.push({ id: i, amount: null, isPlayerCase: false, isOpened: false })
      } else {
        cases.push({ 
          id: i, 
          amount: shuffledAmounts[i - 1], 
          isPlayerCase: false, 
          isOpened: false 
        })
      }
    }
    
    setBriefcases(cases)
    setGamePhase('SELECT_YOUR_CASE')
    setCurrentRound(0)
    setCasesOpenedThisRound(0)
    setOpenedAmounts([])
  }

  const handleCaseClick = (caseId: number) => {
    const clickedCase = briefcases.find(c => c.id === caseId)
    if (!clickedCase || clickedCase.amount === null) return

    if (gamePhase === 'SELECT_YOUR_CASE') {
      setBriefcases(briefcases.map(c => 
        c.id === caseId ? { ...c, isPlayerCase: true, isOpened: true } : c
      ))
      setGamePhase('OPEN_CASES')
    } else if (gamePhase === 'OPEN_CASES') {
      if (clickedCase.isPlayerCase || clickedCase.isOpened) return

      setBriefcases(briefcases.map(c => 
        c.id === caseId ? { ...c, isOpened: true } : c
      ))
      setOpenedAmounts([...openedAmounts, clickedCase.amount])
      
      const newCasesOpened = casesOpenedThisRound + 1
      setCasesOpenedThisRound(newCasesOpened)

      if (newCasesOpened >= CASES_TO_OPEN_PER_ROUND[currentRound]) {
        setGamePhase('BANKER_OFFER')
      }
    }
  }

  const handleDealOrNoDeal = (isDeal: boolean) => {
    if (isDeal) {
      const bankerOffer = 2500
      setFinalWinnings(bankerOffer)
      onGameEnd(bankerOffer)
      setGamePhase('GAME_OVER')
    } else {
      const openedCaseIds = briefcases
        .filter(b => b.isOpened && !b.isPlayerCase)
        .map(b => b.id)
      setCasesToRemove([...casesToRemove, ...openedCaseIds])
      
      const nextRound = currentRound + 1
      if (nextRound >= CASES_TO_OPEN_PER_ROUND.length) {
        const playerCase = briefcases.find(b => b.isPlayerCase)
        const winnings = playerCase?.amount || 0
        setFinalWinnings(winnings)
        onGameEnd(winnings)
        setGamePhase('GAME_OVER')
      } else {
        setCurrentRound(nextRound)
        setCasesOpenedThisRound(0)
        setGamePhase('OPEN_CASES')
      }
    }
  }

  const getMessage = () => {
    if (gamePhase === 'SELECT_YOUR_CASE') {
      return 'Which briefcase will you choose?'
    } else if (gamePhase === 'OPEN_CASES') {
      const remaining = CASES_TO_OPEN_PER_ROUND[currentRound] - casesOpenedThisRound
      return `Open ${remaining} more case${remaining !== 1 ? 's' : ''}`
    } else if (gamePhase === 'BANKER_OFFER') {
      return 'The banker is calling...'
    } else if (gamePhase === 'GAME_OVER') {
      return `You Win ₱ ${finalWinnings.toLocaleString('en-PH')}`
    }
    return ''
  }

  const leftColumn = LEFT_COLUMN_VALUES
  const rightColumn = RIGHT_COLUMN_VALUES

  return (
    <div className="game-screen">
      <div className="left-panel">
        <div className="player-info">
          <div className="player-name">{playerName}</div>
        </div>
        
        <div className="logo-container">
          <img 
            src="/deal-or-no-deal-logo.png" 
            alt="Deal or No Deal" 
            className="game-logo"
          />
        </div>

        <div className="scoreboard">
          <div className="scoreboard-title">Prize Board</div>
          <div className="scoreboard-values">
            <div className="scoreboard-column">
              {leftColumn.map((value, index) => (
                <div 
                  key={`left-${index}`} 
                  className={`scoreboard-item ${openedAmounts.includes(value) ? 'disabled' : ''}`}
                >
                  <span className="peso-symbol">₱ </span>
                  <span className="amount-value">{value.toLocaleString('en-PH')}</span>
                </div>
              ))}
            </div>
            <div className="scoreboard-column">
              {rightColumn.map((value, index) => (
                <div 
                  key={`right-${index}`} 
                  className={`scoreboard-item ${openedAmounts.includes(value) ? 'disabled' : ''}`}
                >
                  <span className="peso-symbol">₱ </span>
                  <span className="amount-value">{value.toLocaleString('en-PH')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {briefcases.find(b => b.isPlayerCase) && (
          <div className="player-case-display">
            <div className="player-case-label">Your Briefcase</div>
            <div className="player-case-container">
              <img 
                src={`/briefcases/briefcase${String(briefcases.find(b => b.isPlayerCase)?.id).padStart(2, '0')}.png`}
                alt="Your Case"
                className="player-case-image"
              />
            </div>
          </div>
        )}
      </div>

      <div className="right-panel">
        <div className="game-message">
          {getMessage()}
        </div>

        {gamePhase === 'GAME_OVER' ? (
          <div className="game-over-container">
            <div className="player-final-case">
              <div className="opened-briefcase">
                <img 
                  src="/briefcases/briefcase-open.png"
                  alt="Your Final Case"
                  className="briefcase-open-image"
                />
                <div className="briefcase-amount">
                  ₱ {finalWinnings.toLocaleString('en-PH')}
                </div>
              </div>
            </div>

            <div className="leaderboard">
              <div className="leaderboard-title">Leaderboard</div>
              <div className="leaderboard-list">
                {playerScores
                  .sort((a, b) => b.winnings - a.winnings)
                  .map((player, index) => (
                    <div 
                      key={index}
                      className={`leaderboard-item ${player.name === playerName ? 'current-player' : ''}`}
                    >
                      <span className="leaderboard-rank">{index + 1}.</span>
                      <span className="leaderboard-name">{player.name}</span>
                      <span className="leaderboard-winnings">₱ {player.winnings.toLocaleString('en-PH')}</span>
                    </div>
                  ))}
              </div>
            </div>

            <button className="next-button" onClick={onReset}>
              Next
            </button>
          </div>
        ) : gamePhase === 'BANKER_OFFER' ? (
          <div className="banker-offer-container">
            <div className="banker-offer">
              <div className="offer-title">Banker's Offer</div>
              <div className="offer-amount">₱2,500</div>
              <div className="offer-buttons">
                <button className="deal-button" onClick={() => handleDealOrNoDeal(true)}>
                  DEAL
                </button>
                <button className="no-deal-button" onClick={() => handleDealOrNoDeal(false)}>
                  NO DEAL
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="briefcases-grid">
            {briefcases.map((briefcase) => {
              const shouldRemove = casesToRemove.includes(briefcase.id)
              return (
                <div
                  key={briefcase.id}
                  className={`briefcase ${briefcase.amount === null ? 'empty' : ''} ${
                    briefcase.isPlayerCase ? 'player-case' : ''
                  } ${briefcase.isOpened && !shouldRemove ? 'opened' : ''} ${
                    shouldRemove ? 'removed' : ''
                  }`}
                  onClick={() => handleCaseClick(briefcase.id)}
                >
                  {briefcase.amount !== null && !briefcase.isOpened && !shouldRemove && (
                    <img 
                      src={`/briefcases/briefcase${String(briefcase.id).padStart(2, '0')}.png`}
                      alt={`Case ${briefcase.id}`}
                      className="briefcase-image"
                    />
                  )}
                  {briefcase.isOpened && !briefcase.isPlayerCase && !shouldRemove && (
                    <div className="opened-briefcase">
                      <img 
                        src="/briefcases/briefcase-open.png"
                        alt="Opened Case"
                        className="briefcase-open-image"
                      />
                      <div className="briefcase-amount">
                        ₱ {briefcase.amount?.toLocaleString('en-PH')}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameScreen
