import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playerName, setPlayerName] = useState('')

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play()
    }
  }, [])

  const handleStartGame = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    console.log('Starting game...')
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
          onChange={(e) => setPlayerName(e.target.value)}
        />
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
