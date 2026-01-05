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

type GamePhase = 'SELECT_YOUR_CASE' | 'OPEN_CASES' | 'BANKER_THINKING' | 'BANKER_CALLING' | 'BANKER_OFFER' | 'FINAL_CHOICE' | 'GAME_OVER'

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

  const playSoundEffect = (openedAmount: number) => {
    const unopenedCases = briefcases.filter(b => !b.isOpened && b.amount !== null && !b.isPlayerCase)
    const unopenedAmounts = unopenedCases.map(b => b.amount as number).sort((a, b) => a - b)
    
    const minValue = Math.min(...unopenedAmounts)
    const maxValue = Math.max(...unopenedAmounts)
    
    let soundFile = ''
    
    if (openedAmount === minValue) {
      soundFile = '/cheer/cheer05.wav'
    } else if (openedAmount === maxValue) {
      soundFile = '/aww/aww03.mp3'
    } else {
      const sortedAmounts = [...unopenedAmounts].sort((a, b) => a - b)
      const middleIndex = Math.floor(sortedAmounts.length / 2)
      const median = sortedAmounts.length % 2 === 0
        ? (sortedAmounts[middleIndex - 1] + sortedAmounts[middleIndex]) / 2
        : sortedAmounts[middleIndex]
      
      const position = sortedAmounts.indexOf(openedAmount)
      const percentile = position / sortedAmounts.length
      
      if (openedAmount < median) {
        if (percentile <= 0.1) {
          soundFile = '/cheer/cheer04.wav'
        } else if (percentile <= 0.3) {
          soundFile = '/cheer/cheer03.wav'
        } else if (percentile <= 0.5) {
          soundFile = '/cheer/cheer02.mp3'
        } else {
          soundFile = '/cheer/cheer01.mp3'
        }
      } else {
        if (percentile >= 0.5) {
          soundFile = '/aww/aww02.mp3'
        } else {
          soundFile = '/aww/aww01.mp3'
        }
      }
    }
    
    if (soundFile) {
      const audio = new Audio(soundFile)
      audio.play().catch(err => console.log('Could not play sound:', err))
    }
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

      playSoundEffect(clickedCase.amount)

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
        
        const thinkingSounds = ['thinking01.mp3', 'thinking02.mp3', 'thinking03.mp3']
        const randomSound = thinkingSounds[Math.floor(Math.random() * thinkingSounds.length)]
        const thinkAudio = new Audio(`/thinking/${randomSound}`)
        thinkAudio.loop = true
        thinkAudio.play().catch(err => console.log('Could not play thinking sound:', err))
        setThinkingAudio(thinkAudio)
        
        let minDelay, maxDelay
        if (currentRound === 0) {
          minDelay = 10000
          maxDelay = 20000
        } else if (currentRound === 1) {
          minDelay = 7500
          maxDelay = 15000
        } else if (currentRound === 2) {
          minDelay = 5000
          maxDelay = 15000
        } else {
          minDelay = 2500
          maxDelay = 12500
        }
        
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
          const intervalId = window.setInterval(playPhoneRing, 5000)
          setPhoneIntervalId(intervalId)
        }, delay)
      }
    }
  }

  const getBankerRemark = (offer: number): string => {
    const unopenedCases = briefcases.filter(b => !b.isOpened && b.amount !== null && !b.isPlayerCase)
    const unopenedAmounts = unopenedCases.map(b => b.amount as number)
    const avgRemaining = unopenedAmounts.reduce((a, b) => a + b, 0) / unopenedAmounts.length
    
    const offerQuality = offer / avgRemaining
    
    const remarks = {
      terrible: [
        "Is that a joke? My piggy bank has more than that!",
        "The banker must be laughing all the way to the bank with that offer!",
        "That's not an offer, that's an insult wrapped in pesos!",
        "I've seen better offers at a garage sale!",
        "The banker thinks you were born yesterday with that lowball!"
      ],
      poor: [
        "Hmm, the banker is being a bit stingy today...",
        "That's barely enough for a nice dinner, let alone life-changing money!",
        "The banker is clearly hoping you'll panic!",
        "You could probably find more money in your couch cushions!",
        "That offer is weaker than my morning coffee!"
      ],
      fair: [
        "Now we're talking! A respectable offer on the table.",
        "The banker is playing it safe with this one.",
        "Not bad, not bad at all... but is it enough?",
        "A solid offer, but there could be more in your case!",
        "The banker is being reasonable... suspiciously reasonable!"
      ],
      good: [
        "WOW! The banker is getting nervous!",
        "That's a serious offer! Someone's sweating in that bank!",
        "The banker must really want you to take this deal!",
        "Now THAT'S what I call an offer! The banker sees something!",
        "Holy pesos! The banker is practically begging you to stop!"
      ],
      excellent: [
        "JACKPOT ALERT! The banker is in full panic mode!",
        "That's an INSANE offer! The banker knows you've got the goods!",
        "The banker just threw the kitchen sink at you!",
        "I can hear the banker crying from here with that offer!",
        "That's 'retire early' money right there! The banker is DESPERATE!"
      ]
    }
    
    let remarkCategory: keyof typeof remarks
    if (offerQuality < 0.3) {
      remarkCategory = 'terrible'
    } else if (offerQuality < 0.6) {
      remarkCategory = 'poor'
    } else if (offerQuality < 0.9) {
      remarkCategory = 'fair'
    } else if (offerQuality < 1.2) {
      remarkCategory = 'good'
    } else {
      remarkCategory = 'excellent'
    }
    
    const categoryRemarks = remarks[remarkCategory]
    return categoryRemarks[Math.floor(Math.random() * categoryRemarks.length)]
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
    
    const offer = calculateBankerOffer()
    setBankerOffer(offer)
    const remark = getBankerRemark(offer)
    setBankerRemark(remark)
    setGamePhase('BANKER_OFFER')
  }

  const calculateBankerOffer = (): number => {
    const unopenedCases = briefcases.filter(b => !b.isOpened && b.amount !== null)
    const unopenedAmounts = unopenedCases.map(b => b.amount as number)
    
    const sortedAmounts = [...unopenedAmounts].sort((a, b) => a - b)
    const middleIndex = Math.floor(sortedAmounts.length / 2)
    const median = sortedAmounts.length % 2 === 0
      ? (sortedAmounts[middleIndex - 1] + sortedAmounts[middleIndex]) / 2
      : sortedAmounts[middleIndex]
    
    let variancePercent: number
    if (median < 500) {
      variancePercent = 0.15
    } else if (median < 1000) {
      variancePercent = 0.10
    } else {
      variancePercent = 0.05
    }
    
    const randomVariance = (Math.random() * 2 - 1) * variancePercent
    let offer = median * (1 + randomVariance)
    
    if (offer < 10) {
      offer = Math.ceil(offer)
    } else if (offer < 100) {
      offer = Math.ceil(offer / 5) * 5
    } else {
      offer = Math.ceil(offer / 50) * 50
    }
    
    return offer
  }

  const handleDealOrNoDeal = (isDeal: boolean) => {
    if (isDeal) {
      const playerCase = briefcases.find(b => b.isPlayerCase)
      setFinalWinnings(playerCase?.amount || 0)
      setTookDeal(true)
      
      let soundFile = ''
      if (bankerOffer < 50) {
        soundFile = '/laugh01.mp3'
      } else if (playerCase && playerCase.amount !== null) {
        if (bankerOffer > playerCase.amount) {
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
    if (chosenAmount !== null && chosenAmount < 50) {
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
          <div className="player-case-display">
            <button className="open-briefcase-button" onClick={handleRevealBriefcase}>
              Open
            </button>
            <div className="player-case-container">
              <img 
                src={`/briefcases/briefcase${String(briefcases.find(b => b.isPlayerCase)?.id).padStart(2, '0')}.png`}
                alt="Your Case"
                className="player-case-image"
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
        {gamePhase !== 'BANKER_THINKING' && gamePhase !== 'BANKER_CALLING' && gamePhase !== 'FINAL_CHOICE' && (
          <div className="game-message">
            {getMessage()}
          </div>
        )}

        {gamePhase === 'GAME_OVER' ? (
          <div className="game-over-container">
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

            {(!tookDeal || briefcaseRevealed) && (
              <button className="next-button" onClick={onReset}>
                Next
              </button>
            )}
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
