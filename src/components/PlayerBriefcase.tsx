import type { ReactElement } from 'react'
import type { Briefcase, GamePhase } from '../types/game'

interface PlayerBriefcaseProps {
  briefcase: Briefcase | undefined
  gamePhase: GamePhase
  tookDeal: boolean
  briefcaseRevealed: boolean
  finalWinnings: number
  onFinalChoice: () => void
  onRevealBriefcase: () => void
}

export function PlayerBriefcase({
  briefcase,
  gamePhase,
  tookDeal,
  briefcaseRevealed,
  finalWinnings,
  onFinalChoice,
  onRevealBriefcase
}: PlayerBriefcaseProps): ReactElement | null {
  if (!briefcase) return null

  // Game over - deal taken, briefcase not revealed
  if (gamePhase === 'GAME_OVER' && tookDeal && !briefcaseRevealed) {
    return (
      <div 
        className="player-case-display"
        onClick={onRevealBriefcase}
      >
        <div className="player-case-label">Your Briefcase</div>
        <div className="player-case-container">
          <img 
            src={`/briefcases/briefcase${String(briefcase.id).padStart(2, '0')}.png`}
            alt="Your Case"
            className="player-case-image clickable-pulse"
          />
        </div>
      </div>
    )
  }

  // Game over - show revealed briefcase
  if (gamePhase === 'GAME_OVER' && (!tookDeal || briefcaseRevealed)) {
    return (
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
    )
  }

  // Normal gameplay
  return (
    <div 
      className="player-case-display"
      onClick={() => gamePhase === 'FINAL_CHOICE' && onFinalChoice()}
    >
      <div className="player-case-label">Your Briefcase</div>
      <div className="player-case-container">
        <img 
          src={`/briefcases/briefcase${String(briefcase.id).padStart(2, '0')}.png`}
          alt="Your Case"
          className={`player-case-image ${gamePhase === 'FINAL_CHOICE' ? 'clickable-pulse' : ''}`}
        />
      </div>
    </div>
  )
}
