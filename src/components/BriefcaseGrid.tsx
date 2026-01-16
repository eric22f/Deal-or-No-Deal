import type { ReactElement } from 'react'
import type { Briefcase, GamePhase } from '../types/game'
import './BriefcaseGrid.css'
import '../styles/animations.css'

interface BriefcaseGridProps {
  briefcases: Briefcase[]
  gamePhase: GamePhase
  casesToRemove: number[]
  onCaseClick: (caseId: number) => void
  onFinalChoice: (choosePlayerCase: boolean) => void
  spinningBriefcaseId?: number | null
}

export function BriefcaseGrid({
  briefcases,
  gamePhase,
  casesToRemove,
  onCaseClick,
  onFinalChoice,
  spinningBriefcaseId
}: BriefcaseGridProps): ReactElement {
  return (
    <div className="briefcases-grid">
      {briefcases.map((briefcase) => {
        if (briefcase.amount === null) return null
        
        const shouldRemove = casesToRemove.includes(briefcase.id)
        const isClickable = 
          (gamePhase === 'SELECT_YOUR_CASE' || 
           (gamePhase === 'OPEN_CASES' && !briefcase.isPlayerCase && !briefcase.isOpened) ||
           (gamePhase === 'FINAL_CHOICE' && !briefcase.isPlayerCase && !briefcase.isOpened))
        
        const shouldPulse = gamePhase === 'FINAL_CHOICE' && !briefcase.isPlayerCase && !briefcase.isOpened
        const isSpinning = spinningBriefcaseId === briefcase.id
        
        return (
          <div
            key={briefcase.id}
            className={`briefcase ${briefcase.isPlayerCase ? 'player-case' : ''} ${briefcase.isOpened ? 'opened' : ''} ${shouldRemove ? 'removed' : ''} ${isClickable && !shouldPulse ? 'clickable' : ''} ${shouldPulse ? 'clickable-pulse' : ''} ${isSpinning ? 'spinning' : ''}`}
            onClick={() => {
              if (gamePhase === 'FINAL_CHOICE' && !briefcase.isPlayerCase && !briefcase.isOpened) {
                onFinalChoice(false)
              } else if (isClickable) {
                onCaseClick(briefcase.id)
              }
            }}
          >
            {!briefcase.isOpened ? (
              <img 
                src={`/briefcases/briefcase${String(briefcase.id).padStart(2, '0')}.png`}
                alt={`Case ${briefcase.id}`}
                className="briefcase-image"
              />
            ) : null}
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
  )
}
