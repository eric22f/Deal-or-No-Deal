import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playerName, setPlayerName] = useState('')
  const [isMuted, setIsMuted] = useState(false)

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
    if (audioRef.current) {
      audioRef.current.pause()
    }
    console.log('Starting game...')
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="intro-screen">
      <button className="mute-button" onClick={toggleMute}>
        {isMuted ? '🔇' : '🔊'}
      </button>
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
