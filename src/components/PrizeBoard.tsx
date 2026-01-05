import type { ReactElement } from 'react'

interface PrizeBoardProps {
  leftColumn: number[]
  rightColumn: number[]
  openedAmounts: number[]
}

export function PrizeBoard({ leftColumn, rightColumn, openedAmounts }: PrizeBoardProps): ReactElement {
  return (
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
  )
}
