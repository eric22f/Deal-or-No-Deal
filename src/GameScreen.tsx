import './GameScreen.css'

interface GameScreenProps {
  playerName: string
  onReset: () => void
}

const LEFT_COLUMN_VALUES = [0.05, 1, 5, 10, 20, 50, 100, 150, 200, 250, 300, 350]
const RIGHT_COLUMN_VALUES = [400, 450, 500, 600, 700, 800, 900, 1000, 1200, 1400, 2000, 5000]

function GameScreen({ playerName, onReset }: GameScreenProps) {
  const leftColumn = LEFT_COLUMN_VALUES
  const rightColumn = RIGHT_COLUMN_VALUES

  return (
    <div className="game-screen">
      <div className="left-panel">
        <div className="player-info">
          <div className="player-label">Player</div>
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
                <div key={`left-${index}`} className="scoreboard-item">
                  <span className="peso-symbol">₱</span>
                  <span className="amount-value">{value.toLocaleString('en-PH')}</span>
                </div>
              ))}
            </div>
            <div className="scoreboard-column">
              {rightColumn.map((value, index) => (
                <div key={`right-${index}`} className="scoreboard-item">
                  <span className="peso-symbol">₱</span>
                  <span className="amount-value">{value.toLocaleString('en-PH')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <button className="reset-button" onClick={onReset}>
          Reset Game
        </button>
      </div>
    </div>
  )
}

export default GameScreen
