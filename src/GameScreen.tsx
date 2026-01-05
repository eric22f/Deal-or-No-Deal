import { useEffect } from 'react'
import './GameScreen.css'
import type { PlayerScore } from './types/game'
import { LEFT_COLUMN_VALUES, RIGHT_COLUMN_VALUES, BANKER_THINKING_DELAYS } from './constants/gameConfig'
import { calculateBankerOffer, getBankerRemark } from './utils/bankerCalculations'
import { playCaseOpenSound, playDealAcceptedSound, playBriefcaseRevealSound } from './utils/soundEffects'
import { useGameState } from './hooks/useGameState'
import { useAudioManager } from './hooks/useAudioManager'
import { PrizeBoard } from './components/PrizeBoard'
import { PlayerBriefcase } from './components/PlayerBriefcase'
import { BriefcaseGrid } from './components/BriefcaseGrid'
import { Leaderboard } from './components/Leaderboard'
import { 
  getUnopenedCases, 
  getPlayerCase, 
  shouldTransitionToFinalChoice,
  getOpenedCaseIds,
  getThinkingDelay
} from './utils/gameLogic'
import { 
  getGameMessage, 
  shouldShowMessage, 
  shouldShowAnswerButton,
  shouldShowBankerOffer,
  shouldShowLeaderboard,
  shouldShowRevealMessage
} from './utils/messageHelpers'

interface GameScreenProps {
  playerName: string
  onReset: () => void
  onGameEnd: (winnings: number) => void
  playerScores: PlayerScore[]
}

function GameScreen({ playerName, onReset, onGameEnd, playerScores }: GameScreenProps) {
  const [state, dispatch] = useGameState()
  const audio = useAudioManager()

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_GAME' })
  }, [dispatch])

  const handleCaseClick = (caseId: number) => {
    const clickedCase = state.briefcases.find(c => c.id === caseId)
    if (!clickedCase || clickedCase.amount === null) return

    if (state.gamePhase === 'SELECT_YOUR_CASE') {
      dispatch({ type: 'SELECT_PLAYER_CASE', caseId })
    } else if (state.gamePhase === 'OPEN_CASES') {
      if (clickedCase.isPlayerCase || clickedCase.isOpened) return

      playCaseOpenSound(clickedCase.amount, state.briefcases)
      dispatch({ type: 'OPEN_CASE', caseId, amount: clickedCase.amount })

      // Check if this completes the round (need to account for the case we just opened)
      const newCasesOpened = state.casesOpenedThisRound + 1
      const casesToOpenThisRound = [6, 5, 4, 3, 2, 1][state.currentRound]

      if (newCasesOpened >= casesToOpenThisRound) {
        // Round complete - check if we should go to final choice
        const unopenedCases = getUnopenedCases(state.briefcases.map(c => 
          c.id === caseId ? { ...c, isOpened: true } : c
        ))
        
        if (shouldTransitionToFinalChoice(unopenedCases.length, state.currentRound)) {
          dispatch({ type: 'START_FINAL_CHOICE' })
          return
        }

        // Start banker sequence
        dispatch({ type: 'START_BANKER_THINKING' })
        
        const thinkAudio = audio.startThinkingSound()
        const delay = getThinkingDelay(state.currentRound, BANKER_THINKING_DELAYS)
        
        setTimeout(() => {
          if (thinkAudio) {
            thinkAudio.pause()
            thinkAudio.currentTime = 0
          }
          
          dispatch({ type: 'START_BANKER_CALLING' })
          audio.startPhoneRinging()
        }, delay)
      }
    }
  }

  const handleAnswerCall = () => {
    audio.stopAllSounds()
    
    const offer = calculateBankerOffer(state.briefcases)
    const remark = getBankerRemark(offer, state.briefcases)
    dispatch({ type: 'SET_BANKER_OFFER', offer, remark })
  }

  const handleDealOrNoDeal = (isDeal: boolean) => {
    if (isDeal) {
      const playerCase = getPlayerCase(state.briefcases)
      const playerAmount = playerCase?.amount || 0
      
      playDealAcceptedSound(state.bankerOffer, playerAmount)
      dispatch({ type: 'ACCEPT_DEAL', playerAmount })
      onGameEnd(state.bankerOffer)
    } else {
      const openedCaseIds = getOpenedCaseIds(state.briefcases)
      dispatch({ type: 'REJECT_DEAL', casesToRemove: openedCaseIds })
      
      const unopenedCases = getUnopenedCases(state.briefcases)
      
      if (unopenedCases.length === 1) {
        dispatch({ type: 'START_FINAL_CHOICE' })
      } else {
        dispatch({ type: 'START_NEXT_ROUND' })
      }
    }
  }

  const handleFinalChoice = (choosePlayerCase: boolean) => {
    const playerCase = getPlayerCase(state.briefcases)
    const lastCase = state.briefcases.find(b => !b.isOpened && !b.isPlayerCase && b.amount !== null)
    
    if (!playerCase || !lastCase) return
    
    const chosenAmount = choosePlayerCase ? playerCase.amount : lastCase.amount
    const otherAmount = choosePlayerCase ? lastCase.amount : playerCase.amount
    
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
    
    dispatch({ type: 'FINAL_CHOICE', winnings: chosenAmount || 0 })
    onGameEnd(chosenAmount || 0)
  }

  const handleRevealBriefcase = () => {
    playBriefcaseRevealSound(state.bankerOffer, state.finalWinnings)
    dispatch({ type: 'REVEAL_BRIEFCASE' })
  }

  const playerBriefcase = getPlayerCase(state.briefcases)
  const message = getGameMessage(
    state.gamePhase,
    state.currentRound,
    state.casesOpenedThisRound,
    state.bankerRemark,
    state.tookDeal,
    state.finalWinnings,
    state.bankerOffer
  )

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

        <PrizeBoard
          leftColumn={LEFT_COLUMN_VALUES}
          rightColumn={RIGHT_COLUMN_VALUES}
          openedAmounts={state.openedAmounts}
        />

        {playerBriefcase && state.gamePhase !== 'GAME_OVER' && (
          <PlayerBriefcase
            briefcase={playerBriefcase}
            gamePhase={state.gamePhase}
            tookDeal={state.tookDeal}
            briefcaseRevealed={state.briefcaseRevealed}
            finalWinnings={state.finalWinnings}
            onFinalChoice={() => handleFinalChoice(true)}
            onRevealBriefcase={handleRevealBriefcase}
          />
        )}

        {state.gamePhase === 'GAME_OVER' && (
          <PlayerBriefcase
            briefcase={playerBriefcase}
            gamePhase={state.gamePhase}
            tookDeal={state.tookDeal}
            briefcaseRevealed={state.briefcaseRevealed}
            finalWinnings={state.finalWinnings}
            onFinalChoice={() => handleFinalChoice(true)}
            onRevealBriefcase={handleRevealBriefcase}
          />
        )}
      </div>

      <div className="right-panel">
        {shouldShowMessage(state.gamePhase) && (
          <div className="game-message">
            {message}
            {state.gamePhase === 'BANKER_THINKING' && (
              <span className="thinking-dots">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </span>
            )}
          </div>
        )}

        {shouldShowAnswerButton(state.gamePhase) && (
          <div className="game-message-with-button">
            <div className="game-message-text">{message}</div>
            <button className="answer-button" onClick={handleAnswerCall}>
              Answer
            </button>
          </div>
        )}

        {shouldShowBankerOffer(state.gamePhase) && (
          <>
            <div className="game-message banker-remark-fade-in">{message}</div>
            <div className="banker-offer-container">
              <div className="banker-offer">
                <div className="offer-title">Banker's Offer</div>
                <div className="offer-amount">₱ {state.bankerOffer.toLocaleString('en-PH')}</div>
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
          </>
        )}

        {shouldShowLeaderboard(state.gamePhase) && (
          <div className="game-over-container">
            <div className="game-message-with-button">
              <div className="game-message-text">{message}</div>
              {(!state.tookDeal || state.briefcaseRevealed) && (
                <button className="answer-button" onClick={onReset}>
                  Next
                </button>
              )}
            </div>
            <Leaderboard playerScores={playerScores} currentPlayerName={playerName} />
          </div>
        )}

        {shouldShowRevealMessage(state.gamePhase, state.tookDeal, state.briefcaseRevealed) && (
          <div className="reveal-message">
            Open your briefcase to see what you could have won.
          </div>
        )}

        <div className={`briefcase-grid-container ${state.gamePhase === 'BANKER_OFFER' || (state.gamePhase === 'GAME_OVER' && state.tookDeal) ? 'fade-out' : ''}`}>
          <BriefcaseGrid
            briefcases={state.briefcases}
            gamePhase={state.gamePhase}
            casesToRemove={state.casesToRemove}
            onCaseClick={handleCaseClick}
            onFinalChoice={handleFinalChoice}
          />
        </div>
      </div>
    </div>
  )
}

export default GameScreen
