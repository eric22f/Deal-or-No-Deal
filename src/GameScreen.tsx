import './GameScreen.css'

interface GameScreenProps {
  playerName: string
  onReset: () => void
}

const PESO_VALUES = [
  0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750,
  1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000,
  300000, 400000, 500000, 1000000, 4000000
]

function GameScreen({ playerName, onReset }: GameScreenProps) {
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
            {PESO_VALUES.map((value, index) => (
              <div key={index} className="scoreboard-item">
                <span className="peso-symbol">₱</span>
                <span className="amount-value">{value.toLocaleString('en-PH')}</span>
              </div>
            ))}
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
