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
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>(() => {
    // Load leaderboard from cookies on initial mount
    const savedScores = document.cookie
      .split('; ')
      .find(row => row.startsWith('dealOrNoDealLeaderboard='))
    
    if (savedScores) {
      try {
        const decoded = decodeURIComponent(savedScores.split('=')[1])
        return JSON.parse(decoded)
      } catch (error) {
        console.log('Could not parse saved leaderboard:', error)
        return []
      }
    }
    return []
  })
  const [nameError, setNameError] = useState('')
  const [isGameActive, setIsGameActive] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState('')
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false)
  const [kidsMode, setKidsMode] = useState(false)

  // Save leaderboard to cookies whenever it changes
  useEffect(() => {
    if (playerScores.length > 0) {
      const encoded = encodeURIComponent(JSON.stringify(playerScores))
      // Set cookie to expire in 1 year
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      document.cookie = `dealOrNoDealLeaderboard=${encoded}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`
    }
  }, [playerScores])

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

  const handleKidsModeToggle = () => {
    setKidsMode(!kidsMode)
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
    setKidsMode(false)
    
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
          kidsMode={kidsMode}
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
          <label className="home-kids-mode-toggle">
            <input
              type="checkbox"
              checked={kidsMode}
              onChange={handleKidsModeToggle}
            />
            <span className="toggle-label">KIDS MODE</span>
          </label>
          {playerScores.length > 0 && (
            <div className="home-leaderboard">
              <h3 className="home-leaderboard-title">Leaderboard</h3>
              <div className={`home-leaderboard-list ${showFullLeaderboard ? 'expanded' : ''}`}>
                {[...playerScores]
                  .sort((a, b) => b.winnings - a.winnings)
                  .slice(0, showFullLeaderboard ? playerScores.length : 3)
                  .map((player, index) => {
                    const getTierClass = (winnings: number): string => {
                      if (winnings >= 4000) return 'home-tier-jackpot'
                      if (winnings >= 3000) return 'home-tier-high'
                      if (winnings >= 2000) return 'home-tier-medium'
                      if (winnings >= 1000) return 'home-tier-low'
                      if (winnings >= 500) return 'home-tier-minimal'
                      return ''
                    }
                    const tierClass = getTierClass(player.winnings)
                    return (
                      <div key={index} className={`home-leaderboard-item ${tierClass}`}>
                        <span className="home-leaderboard-rank">{index + 1}.</span>
                        <span className="home-leaderboard-name">
                          {player.name}
                        </span>
                        <span className="home-leaderboard-winnings">₱{player.winnings.toLocaleString('en-PH')}</span>
                      </div>
                    )
                  })}
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
