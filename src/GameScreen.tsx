import { useState, useEffect } from 'react'
import './GameScreen.css'
import type { GamePhase, Briefcase, PlayerScore } from './types/game'
import { 
  ALL_VALUES, 
  LEFT_COLUMN_VALUES, 
  RIGHT_COLUMN_VALUES,
  CASES_TO_OPEN_PER_ROUND,
  BANKER_THINKING_DELAYS,
  PHONE_RING_INTERVAL,
  THINKING_SOUNDS
} from './constants/gameConfig'
import { calculateBankerOffer, getBankerRemark } from './utils/bankerCalculations'
import { playCaseOpenSound, playDealAcceptedSound, playBriefcaseRevealSound } from './utils/soundEffects'

interface GameScreenProps {
  playerName: string
  onReset: () => void
  onGameEnd: (winnings: number) => void
  playerScores: PlayerScore[]
}

function GameScreen({ playerName, onReset, onGameEnd, playerScores }: GameScreenProps) {
  const [briefcases, setBriefcases] = useState<Briefcase[]>([])
  const [gamePhase, setGamePhase] = useState<GamePhase>('SELECT_YOUR_CASE')
  const [currentRound, setCurrentRound] = useState(0)
  const [casesOpenedThisRound, setCasesOpenedThisRound] = useState(0)
  const [openedAmounts, setOpenedAmounts] = useState<number[]>([])
  const [casesToRemove, setCasesToRemove] = useState<number[]>([])
  const [finalWinnings, setFinalWinnings] = useState<number>(0)
  const [tookDeal, setTookDeal] = useState<boolean>(false)
  const [briefcaseRevealed, setBriefcaseRevealed] = useState<boolean>(false)
  const [bankerOffer, setBankerOffer] = useState<number>(0)
  const [bankerRemark, setBankerRemark] = useState<string>('')
  const [thinkingAudio, setThinkingAudio] = useState<HTMLAudioElement | null>(null)
  const [phoneIntervalId, setPhoneIntervalId] = useState<number | null>(null)

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
      
      if (casesOpenedThisRound >= CASES_TO_OPEN_PER_ROUND[currentRound]) return

      playCaseOpenSound(clickedCase.amount, briefcases)

      setBriefcases(briefcases.map(c => 
        c.id === caseId ? { ...c, isOpened: true } : c
      ))
      setOpenedAmounts([...openedAmounts, clickedCase.amount])
      
      const newCasesOpened = casesOpenedThisRound + 1
      setCasesOpenedThisRound(newCasesOpened)

      if (newCasesOpened >= CASES_TO_OPEN_PER_ROUND[currentRound]) {
        const unopenedCases = briefcases.filter(b => !b.isOpened && !b.isPlayerCase && b.amount !== null)
        const unopenedCount = unopenedCases.length - 1
        
        if (unopenedCount === 1 && currentRound === CASES_TO_OPEN_PER_ROUND.length - 1) {
          setGamePhase('FINAL_CHOICE')
          return
        }
        
        setGamePhase('BANKER_THINKING')
        
        const randomSound = THINKING_SOUNDS[Math.floor(Math.random() * THINKING_SOUNDS.length)]
        const thinkAudio = new Audio(`/thinking/${randomSound}`)
        thinkAudio.loop = true
        thinkAudio.play().catch(err => console.log('Could not play thinking sound:', err))
        setThinkingAudio(thinkAudio)
        
        const delayConfig = currentRound === 0 ? BANKER_THINKING_DELAYS.round0
          : currentRound === 1 ? BANKER_THINKING_DELAYS.round1
          : currentRound === 2 ? BANKER_THINKING_DELAYS.round2
          : BANKER_THINKING_DELAYS.default
        
        const { min: minDelay, max: maxDelay } = delayConfig
        
        const delay = Math.random() * (maxDelay - minDelay) + minDelay
        
        setTimeout(() => {
          if (thinkAudio) {
            thinkAudio.pause()
            thinkAudio.currentTime = 0
          }
          
          setGamePhase('BANKER_CALLING')
          
          const playPhoneRing = () => {
            const audio = new Audio('/banker-phone.mp3')
            audio.play().catch(err => console.log('Could not play phone sound:', err))
          }
          
          playPhoneRing()
          const intervalId = window.setInterval(playPhoneRing, PHONE_RING_INTERVAL)
          setPhoneIntervalId(intervalId)
        }, delay)
      }
    }
  }


  const handleAnswerCall = () => {
    if (phoneIntervalId !== null) {
      clearInterval(phoneIntervalId)
      setPhoneIntervalId(null)
    }
    
    if (thinkingAudio) {
      thinkingAudio.pause()
      thinkingAudio.currentTime = 0
      setThinkingAudio(null)
    }
    
    const offer = calculateBankerOffer(briefcases)
    setBankerOffer(offer)
    const remark = getBankerRemark(offer, briefcases)
    setBankerRemark(remark)
    setGamePhase('BANKER_OFFER')
  }


  const handleDealOrNoDeal = (isDeal: boolean) => {
    if (isDeal) {
      const playerCase = briefcases.find(b => b.isPlayerCase)
      const playerAmount = playerCase?.amount || 0
      setFinalWinnings(playerAmount)
      setTookDeal(true)
      
      playDealAcceptedSound(bankerOffer, playerAmount)
      
      onGameEnd(bankerOffer)
      setGamePhase('GAME_OVER')
    } else {
      const openedCaseIds = briefcases
        .filter(b => b.isOpened && !b.isPlayerCase)
        .map(b => b.id)
      setCasesToRemove([...casesToRemove, ...openedCaseIds])
      
      const unopenedCases = briefcases.filter(b => !b.isOpened && !b.isPlayerCase && b.amount !== null)
      
      if (unopenedCases.length === 1) {
        setGamePhase('FINAL_CHOICE')
      } else {
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
  }

  const handleFinalChoice = (choosePlayerCase: boolean) => {
    const playerCase = briefcases.find(b => b.isPlayerCase)
    const lastCase = briefcases.find(b => !b.isOpened && !b.isPlayerCase && b.amount !== null)
    
    if (!playerCase || !lastCase) return
    
    const chosenAmount = choosePlayerCase ? playerCase.amount : lastCase.amount
    const otherAmount = choosePlayerCase ? lastCase.amount : playerCase.amount
    
    setFinalWinnings(chosenAmount || 0)
    
    let soundFile = ''
    if (chosenAmount !== null && chosenAmount <= 50) {
      soundFile = '/laugh01.mp3'
    } else if (chosenAmount !== null && otherAmount !== null) {
      if (chosenAmount > otherAmount) {
        soundFile = '/cheer/cheer05.wav'
      } else {
        soundFile = '/aww/aww03.mp3'
      }
    }
    
    if (soundFile) {
      setTimeout(() => {
        const audio = new Audio(soundFile)
        audio.play().catch(err => console.log('Could not play sound:', err))
      }, 100)
    }
    
    onGameEnd(chosenAmount || 0)
    setGamePhase('GAME_OVER')
  }

  const handleRevealBriefcase = () => {
    const playerCase = briefcases.find(b => b.isPlayerCase)
    const briefcaseAmount = playerCase?.amount || 0
    
    playBriefcaseRevealSound(bankerOffer, briefcaseAmount)
    setBriefcaseRevealed(true)
  }

  const getMessage = () => {
    if (gamePhase === 'SELECT_YOUR_CASE') {
      return 'Which briefcase will you choose?'
    } else if (gamePhase === 'OPEN_CASES') {
      const remaining = CASES_TO_OPEN_PER_ROUND[currentRound] - casesOpenedThisRound
      return `Open ${remaining} more case${remaining !== 1 ? 's' : ''}`
    } else if (gamePhase === 'BANKER_THINKING') {
      return 'Banker is Thinking'
    } else if (gamePhase === 'BANKER_CALLING') {
      return 'The Banker is calling...'
    } else if (gamePhase === 'BANKER_OFFER') {
      return bankerRemark
    } else if (gamePhase === 'FINAL_CHOICE') {
      return 'Choose your briefcase or swap for the remaining case?'
    } else if (gamePhase === 'GAME_OVER') {
      if (tookDeal) {
        return `You Win ₱ ${bankerOffer.toLocaleString('en-PH')}`
      } else {
        return `You Win ₱ ${finalWinnings.toLocaleString('en-PH')}`
      }
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

        {briefcases.find(b => b.isPlayerCase) && gamePhase !== 'GAME_OVER' && (
          <div 
            className="player-case-display"
            onClick={() => gamePhase === 'FINAL_CHOICE' && handleFinalChoice(true)}
          >
            <div className="player-case-label">Your Briefcase</div>
            <div className="player-case-container">
              <img 
                src={`/briefcases/briefcase${String(briefcases.find(b => b.isPlayerCase)?.id).padStart(2, '0')}.png`}
                alt="Your Case"
                className={`player-case-image ${gamePhase === 'FINAL_CHOICE' ? 'clickable-pulse' : ''}`}
              />
            </div>
          </div>
        )}

        {gamePhase === 'GAME_OVER' && tookDeal && !briefcaseRevealed && (
          <div 
            className="player-case-display"
            onClick={handleRevealBriefcase}
          >
            <div className="player-case-label">Your Briefcase</div>
            <div className="player-case-container">
              <img 
                src={`/briefcases/briefcase${String(briefcases.find(b => b.isPlayerCase)?.id).padStart(2, '0')}.png`}
                alt="Your Case"
                className="player-case-image clickable-pulse"
              />
            </div>
          </div>
        )}

        {gamePhase === 'GAME_OVER' && (!tookDeal || briefcaseRevealed) && (
          <div className="player-case-display">
            <div className="player-case-label">{tookDeal ? 'Your Briefcase Had' : 'Your Winnings'}</div>
            <div className="player-case-container">
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
          </div>
        )}
      </div>

      <div className="right-panel">
        {gamePhase !== 'BANKER_THINKING' && gamePhase !== 'BANKER_CALLING' && gamePhase !== 'FINAL_CHOICE' && gamePhase !== 'GAME_OVER' && (
          <div className="game-message">
            {getMessage()}
          </div>
        )}

        {gamePhase === 'GAME_OVER' && tookDeal && !briefcaseRevealed && (
          <div className="game-message-with-button">
            <div className="game-message-text">Open your briefcase to see what you could have won.</div>
            <button className="answer-button" onClick={onReset} style={{ visibility: 'hidden' }}>
              Next
            </button>
          </div>
        )}

        {gamePhase === 'GAME_OVER' && (!tookDeal || briefcaseRevealed) && (
          <div className="game-message-with-button">
            <div className="game-message-text">{getMessage()}</div>
            <button className="answer-button" onClick={onReset}>
              Next
            </button>
          </div>
        )}

        {gamePhase === 'GAME_OVER' ? (
          <div className="game-over-container">
            <div className="leaderboard">
              <div className="leaderboard-title">Leaderboard</div>
              <div className="leaderboard-list">
                {(() => {
                  const sortedPlayers = playerScores.sort((a, b) => b.winnings - a.winnings)
                  const playersPerColumn = Math.ceil(sortedPlayers.length / 3)
                  
                  const column1 = sortedPlayers.slice(0, playersPerColumn)
                  const column2 = sortedPlayers.slice(playersPerColumn, playersPerColumn * 2)
                  const column3 = sortedPlayers.slice(playersPerColumn * 2)
                  
                  return (
                    <>
                      <div className="leaderboard-column">
                        {column1.map((player, index) => (
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
                      <div className="leaderboard-column">
                        {column2.map((player, index) => (
                          <div 
                            key={index}
                            className={`leaderboard-item ${player.name === playerName ? 'current-player' : ''}`}
                          >
                            <span className="leaderboard-rank">{playersPerColumn + index + 1}.</span>
                            <span className="leaderboard-name">{player.name}</span>
                            <span className="leaderboard-winnings">₱ {player.winnings.toLocaleString('en-PH')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="leaderboard-column">
                        {column3.map((player, index) => (
                          <div 
                            key={index}
                            className={`leaderboard-item ${player.name === playerName ? 'current-player' : ''}`}
                          >
                            <span className="leaderboard-rank">{playersPerColumn * 2 + index + 1}.</span>
                            <span className="leaderboard-name">{player.name}</span>
                            <span className="leaderboard-winnings">₱ {player.winnings.toLocaleString('en-PH')}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        ) : gamePhase === 'BANKER_THINKING' || gamePhase === 'BANKER_CALLING' ? (
          <>
            <div className="game-message-with-button">
              <div className="game-message-text">
                {getMessage()}
                {gamePhase === 'BANKER_THINKING' && (
                  <span className="thinking-dots">
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                  </span>
                )}
              </div>
              {gamePhase === 'BANKER_CALLING' && (
                <button className="answer-button" onClick={handleAnswerCall}>
                  Answer
                </button>
              )}
            </div>
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
          </>
        ) : gamePhase === 'FINAL_CHOICE' ? (
          <>
            <div className="game-message">
              {getMessage()}
            </div>
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
                    } ${!briefcase.isOpened && !briefcase.isPlayerCase && briefcase.amount !== null ? 'clickable' : ''}`}
                    onClick={() => {
                      if (!briefcase.isOpened && !briefcase.isPlayerCase && briefcase.amount !== null) {
                        handleFinalChoice(false)
                      }
                    }}
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
          </>
        ) : gamePhase === 'BANKER_OFFER' ? (
          <div className="banker-offer-container">
            <div className="banker-offer">
              <div className="offer-title">Banker's Offer</div>
              <div className="offer-amount">₱ {bankerOffer.toLocaleString('en-PH')}</div>
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
