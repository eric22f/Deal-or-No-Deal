import type { ReactElement } from 'react'
import type { PlayerScore } from '../types/game'

interface LeaderboardProps {
  playerScores: PlayerScore[]
  currentPlayerName?: string
}

export function Leaderboard({ playerScores, currentPlayerName }: LeaderboardProps): ReactElement {
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
      <div className="leaderboard-title">Leader Board</div>
      <div className="leaderboard-list">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="leaderboard-column">
            {column.map((player, index) => {
              const rank = colIndex * itemsPerColumn + index + 1
              return (
                <div 
                  key={rank} 
                  className={`leaderboard-item ${player.name === currentPlayerName ? 'current-player' : ''}`}
                >
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
    </div>
  )
}
