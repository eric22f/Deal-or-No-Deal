import { useEffect, useRef, useState } from 'react'
import './App.css'
import GameScreen from './GameScreen.tsx'

interface PlayerScore {
  name: string
  winnings: number
}

function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playerName, setPlayerName] = useState('')
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [nameError, setNameError] = useState('')
  const [isGameActive, setIsGameActive] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState('')
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false)

  useEffect(() => {
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play()
        } catch (error) {
          console.log('Autoplay prevented, waiting for user interaction')
        }
      }
    }
    playAudio()

    const handleInteraction = async () => {
      if (audioRef.current && audioRef.current.paused) {
        try {
          await audioRef.current.play()
        } catch (error) {
          console.log('Could not play audio')
        }
      }
      document.removeEventListener('click', handleInteraction)
    }

    document.addEventListener('click', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
    }
  }, [])

  const handleStartGame = () => {
    const trimmedName = playerName.trim()
    
    const isDuplicate = playerScores.some(
      player => player.name.toLowerCase() === trimmedName.toLowerCase()
    )
    
    if (isDuplicate) {
      setNameError('This player name has already been used. Please choose a different name.')
      return
    }
    
    setNameError('')
    
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    const contestantIntro = new Audio('/contestant-intro.mp3')
    contestantIntro.play().catch(err => console.log('Could not play contestant intro:', err))
    
    contestantIntro.addEventListener('ended', () => {
      const randomPrompt = Math.floor(Math.random() * 4) + 1
      const casePrompt = new Audio(`/pick/case-prompt-0${randomPrompt}.mp3`)
      casePrompt.play().catch(err => console.log('Could not play case prompt:', err))
    })
    
    setCurrentPlayer(trimmedName)
    setIsGameActive(true)
  }

  const handleGameEnd = (winnings: number) => {
    setPlayerScores([...playerScores, { name: currentPlayer, winnings }])
  }

  const handleNameChange = (newName: string) => {
    setCurrentPlayer(newName)
  }

  const handleReset = async () => {
    // Stop all game audio before returning to home screen
    const allAudio = document.querySelectorAll('audio')
    allAudio.forEach(audio => {
      if (audio !== audioRef.current) {
        audio.pause()
        audio.currentTime = 0
      }
    })
    
    setIsGameActive(false)
    setCurrentPlayer('')
    setPlayerName('')
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      try {
        await audioRef.current.play()
      } catch (error) {
        console.log('Could not play audio on reset')
      }
    }
  }

  return (
    <>
      {isGameActive ? (
        <GameScreen 
          playerName={currentPlayer} 
          onReset={handleReset}
          onGameEnd={handleGameEnd}
          onNameChange={handleNameChange}
          playerScores={playerScores}
        />
      ) : (
        <div className="intro-screen">
          <img 
            src="/deal-no-deal-intro.gif" 
            alt="Deal or No Deal" 
            className="intro-gif"
          />
          <div className="intro-controls">
            <input 
              type="text" 
              className="player-name-input" 
              placeholder="Player Name..."
              value={playerName}
              maxLength={18}
              onChange={(e) => {
                setPlayerName(e.target.value)
                setNameError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  handleStartGame()
                }
              }}
            />
            {nameError && <div className="error-message">{nameError}</div>}
            <button 
              className="start-button" 
              onClick={handleStartGame}
              disabled={!playerName.trim()}
            >
              Start New Game
            </button>
          </div>
          {playerScores.length > 0 && (
            <div className="home-leaderboard">
              <h3 className="home-leaderboard-title">Leaderboard</h3>
              <div className={`home-leaderboard-list ${showFullLeaderboard ? 'expanded' : ''}`}>
                {[...playerScores]
                  .sort((a, b) => b.winnings - a.winnings)
                  .slice(0, showFullLeaderboard ? playerScores.length : 3)
                  .map((player, index) => (
                    <div key={index} className="home-leaderboard-item">
                      <span className="home-leaderboard-rank">{index + 1}.</span>
                      <span className="home-leaderboard-name">{player.name}</span>
                      <span className="home-leaderboard-winnings">₱{player.winnings.toLocaleString('en-PH')}</span>
                    </div>
                  ))}
              </div>
              {playerScores.length > 3 && (
                <button 
                  className="home-leaderboard-toggle"
                  onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                >
                  {showFullLeaderboard ? 'Show Less' : `Show All (${playerScores.length})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <audio ref={audioRef} loop>
        <source src="/theme-song.mp3" type="audio/mpeg" />
      </audio>
    </>
  )
}

export default App
