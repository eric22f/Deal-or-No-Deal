import { useEffect, useState, useRef } from 'react'
import './GameScreen.css'
import './styles/animations.css'
import type { PlayerScore } from './types/game'
import { LEFT_COLUMN_VALUES, RIGHT_COLUMN_VALUES, LEFT_COLUMN_VALUES_CHILDREN, RIGHT_COLUMN_VALUES_CHILDREN, BANKER_THINKING_DELAYS } from './constants/gameConfig'
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
  onNameChange: (newName: string) => void
  playerScores: PlayerScore[]
  kidsMode: boolean
}

function GameScreen({ playerName, onReset, onGameEnd, onNameChange, playerScores, kidsMode }: GameScreenProps) {
  const [state, dispatch] = useGameState()
  const audio = useAudioManager()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(playerName)
  const [nameError, setNameError] = useState('')
  const [buttonsDisabled, setButtonsDisabled] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const offerAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_GAME', kidsMode })
  }, [dispatch, kidsMode])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  useEffect(() => {
    if (state.gamePhase === 'FINAL_CHOICE') {
      const finalChoiceAudio = new Audio('/offer/offer03.mp3')
      finalChoiceAudio.loop = true
      offerAudioRef.current = finalChoiceAudio
      finalChoiceAudio.play().catch(err => console.log('Could not play final choice audio:', err))
    }
    
    // Cleanup function to stop looping audio when component unmounts
    return () => {
      if (offerAudioRef.current) {
        offerAudioRef.current.pause()
        offerAudioRef.current = null
      }
    }
  }, [state.gamePhase])

  const handleNameClick = () => {
    if (state.gamePhase !== 'GAME_OVER') {
      setIsEditingName(true)
      setEditedName(playerName)
      setNameError('')
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value)
    setNameError('')
  }

  const handleNameSubmit = () => {
    const trimmedName = editedName.trim()
    
    if (!trimmedName) {
      setNameError('Name cannot be empty')
      return
    }

    if (trimmedName.length > 18) {
      setNameError('Name too long (max 18 characters)')
      return
    }

    const isDuplicate = playerScores.some(
      player => player.name.toLowerCase() === trimmedName.toLowerCase() && player.name !== playerName
    )

    if (isDuplicate) {
      setNameError('Name already used')
      return
    }

    onNameChange(trimmedName)
    setIsEditingName(false)
    setNameError('')
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
      setEditedName(playerName)
      setNameError('')
    }
  }

  const handleNameBlur = () => {
    if (editedName.trim() === playerName) {
      setIsEditingName(false)
      setNameError('')
    } else {
      handleNameSubmit()
    }
  }

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
    setButtonsDisabled(true)
    
    const offer = calculateBankerOffer(state.briefcases)
    const remark = getBankerRemark(offer)
    dispatch({ type: 'SET_BANKER_OFFER', offer, remark })
    
    setTimeout(() => {
      setButtonsDisabled(false)
    }, 3500)
    
    setTimeout(() => {
      const randomDealOrNo = Math.floor(Math.random() * 3) + 1
      const dealOrNoAudio = new Audio(`/deal/deal-or-no-0${randomDealOrNo}.mp3`)
      dealOrNoAudio.play().catch(err => console.log('Could not play deal-or-no audio:', err))
      
      dealOrNoAudio.addEventListener('ended', () => {
        let offerFile = 'offer03.mp3'
        if (offer < 500) {
          offerFile = 'offer01.mp3'
        } else if (offer < 1000) {
          offerFile = 'offer02.mp3'
        }
        
        const offerAudio = new Audio(`/offer/${offerFile}`)
        offerAudio.loop = true
        offerAudioRef.current = offerAudio
        offerAudio.play().catch(err => console.log('Could not play offer audio:', err))
      })
    }, 500)
  }

  const handleDealOrNoDeal = (isDeal: boolean) => {
    if (offerAudioRef.current) {
      offerAudioRef.current.pause()
      offerAudioRef.current = null
    }
    
    if (isDeal) {
      const playerCase = getPlayerCase(state.briefcases)
      const playerAmount = playerCase?.amount || 0
      
      playDealAcceptedSound(state.bankerOffer, playerAmount)
      dispatch({ type: 'ACCEPT_DEAL', bankerOffer: state.bankerOffer })
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
    if (offerAudioRef.current) {
      offerAudioRef.current.pause()
      offerAudioRef.current = null
    }
    
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
    const playerCase = getPlayerCase(state.briefcases)
    const briefcaseAmount = playerCase?.amount || 0
    playBriefcaseRevealSound(state.bankerOffer, briefcaseAmount)
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

  // Use playerScores directly - parent App already adds current player via onGameEnd
  const displayScores = playerScores

  return (
    <div className="game-screen">
      <div className="left-panel">
        <div className="player-info">
          {isEditingName ? (
            <div className="player-name-edit-container">
              <input
                ref={nameInputRef}
                type="text"
                className="player-name-input"
                value={editedName}
                maxLength={18}
                onChange={handleNameChange}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameBlur}
              />
              {nameError && <div className="name-error">{nameError}</div>}
            </div>
          ) : (
            <div 
              className={`player-name ${state.gamePhase !== 'GAME_OVER' ? 'editable' : ''}`}
              onClick={handleNameClick}
            >
              {playerName}
            </div>
          )}
        </div>
        
        <div className="logo-container">
          <img 
            src="/deal-or-no-deal-logo.png" 
            alt="Deal or No Deal" 
            className="game-logo"
          />
        </div>

        <PrizeBoard
          leftColumn={kidsMode ? LEFT_COLUMN_VALUES_CHILDREN : LEFT_COLUMN_VALUES}
          rightColumn={kidsMode ? RIGHT_COLUMN_VALUES_CHILDREN : RIGHT_COLUMN_VALUES}
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
                {state.previousBankerOffer > 0 && (
                  <div className="previous-offer">
                    Previous Offer: ₱ {state.previousBankerOffer.toLocaleString('en-PH')}
                    {state.bankerOffer > state.previousBankerOffer && <span className="offer-arrow-up"> ▲</span>}
                    {state.bankerOffer < state.previousBankerOffer && <span className="offer-arrow-down"> ▼</span>}
                  </div>
                )}
                <div className="offer-title">Banker's Offer</div>
                <div className="offer-amount">₱ {state.bankerOffer.toLocaleString('en-PH')}</div>
                <div className="offer-buttons">
                  <button className="deal-button" onClick={() => handleDealOrNoDeal(true)} disabled={buttonsDisabled}>
                    DEAL
                  </button>
                  <button className="no-deal-button" onClick={() => handleDealOrNoDeal(false)} disabled={buttonsDisabled}>
                    NO DEAL
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {shouldShowLeaderboard(state.gamePhase) && (
          <div className="game-over-container">
            <div className="game-message-gold-border">
              <div className="game-message-text">{message}</div>
              {(!state.tookDeal || state.briefcaseRevealed) && (
                <button className="answer-button" onClick={onReset}>
                  Next
                </button>
              )}
            </div>
            {shouldShowRevealMessage(state.gamePhase, state.tookDeal, state.briefcaseRevealed) && (
              <div className="game-message reveal-message-banner">
                Open your briefcase to see what you could have won.
              </div>
            )}
            <Leaderboard playerScores={displayScores} currentPlayerName={playerName} />
          </div>
        )}

        {state.gamePhase !== 'GAME_OVER' && (
          <div className={`briefcase-grid-container ${state.gamePhase === 'BANKER_OFFER' ? 'fade-out' : ''}`}>
            <BriefcaseGrid
              briefcases={state.briefcases}
              gamePhase={state.gamePhase}
              casesToRemove={state.casesToRemove}
              onCaseClick={handleCaseClick}
              onFinalChoice={handleFinalChoice}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default GameScreen
