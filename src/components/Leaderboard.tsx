import type { ReactElement } from 'react'
import type { PlayerScore } from '../types/game'

interface LeaderboardProps {
  playerScores: PlayerScore[]
  onNext: () => void
}

export function Leaderboard({ playerScores, onNext }: LeaderboardProps): ReactElement {
  const sortedScores = [...playerScores].sort((a, b) => b.winnings - a.winnings)
  
  // Split into 3 columns
  const itemsPerColumn = Math.ceil(sortedScores.length / 3)
  const columns = [
    sortedScores.slice(0, itemsPerColumn),
    sortedScores.slice(itemsPerColumn, itemsPerColumn * 2),
    sortedScores.slice(itemsPerColumn * 2)
  ]

  return (
    <div className="leaderboard">
      <div className="leaderboard-list">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="leaderboard-column">
            {column.map((player, index) => {
              const rank = colIndex * itemsPerColumn + index + 1
              return (
                <div key={rank} className="leaderboard-item">
                  <span className="leaderboard-rank">{rank}.</span>
                  <span className="leaderboard-name">{player.name}</span>
                  <span className="leaderboard-winnings">
                    ₱{player.winnings.toLocaleString('en-PH')}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <button className="next-button" onClick={onNext}>
        Next
      </button>
    </div>
  )
}
