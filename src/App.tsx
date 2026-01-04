import { useEffect, useRef, useState } from 'react'
import './App.css'
import GameScreen from './GameScreen'

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
    
    setCurrentPlayer(trimmedName)
    setIsGameActive(true)
  }

  const handleReset = () => {
    setIsGameActive(false)
    setCurrentPlayer('')
    setPlayerName('')
    
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  if (isGameActive) {
    return <GameScreen playerName={currentPlayer} onReset={handleReset} />
  }

  return (
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
          onChange={(e) => {
            setPlayerName(e.target.value)
            setNameError('')
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
      <audio ref={audioRef} loop>
        <source src="/theme-song.mp3" type="audio/mpeg" />
      </audio>
    </div>
  )
}

export default App
