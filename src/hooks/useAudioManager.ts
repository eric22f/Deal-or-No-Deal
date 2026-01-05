import { useState, useCallback, useRef, useEffect } from 'react'
import { THINKING_SOUNDS, PHONE_RING_INTERVAL } from '../constants/gameConfig'

export function useAudioManager() {
  const [thinkingAudio, setThinkingAudio] = useState<HTMLAudioElement | null>(null)
  const [phoneIntervalId, setPhoneIntervalId] = useState<number | null>(null)
  const phoneIntervalRef = useRef<number | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (thinkingAudio) {
        thinkingAudio.pause()
        thinkingAudio.currentTime = 0
      }
      if (phoneIntervalRef.current !== null) {
        clearInterval(phoneIntervalRef.current)
      }
    }
  }, [thinkingAudio])

  const startThinkingSound = useCallback(() => {
    const randomSound = THINKING_SOUNDS[Math.floor(Math.random() * THINKING_SOUNDS.length)]
    const audio = new Audio(`/thinking/${randomSound}`)
    audio.loop = true
    audio.play().catch(err => console.log('Could not play thinking sound:', err))
    setThinkingAudio(audio)
    return audio
  }, [])

  const stopThinkingSound = useCallback(() => {
    if (thinkingAudio) {
      thinkingAudio.pause()
      thinkingAudio.currentTime = 0
      setThinkingAudio(null)
    }
  }, [thinkingAudio])

  const startPhoneRinging = useCallback(() => {
    const playPhoneRing = () => {
      const audio = new Audio('/banker-phone.mp3')
      audio.play().catch(err => console.log('Could not play phone sound:', err))
    }
    
    playPhoneRing()
    const intervalId = window.setInterval(playPhoneRing, PHONE_RING_INTERVAL)
    setPhoneIntervalId(intervalId)
    phoneIntervalRef.current = intervalId
  }, [])

  const stopPhoneRinging = useCallback(() => {
    if (phoneIntervalId !== null) {
      clearInterval(phoneIntervalId)
      setPhoneIntervalId(null)
      phoneIntervalRef.current = null
    }
  }, [phoneIntervalId])

  const stopAllSounds = useCallback(() => {
    stopThinkingSound()
    stopPhoneRinging()
  }, [stopThinkingSound, stopPhoneRinging])

  return {
    startThinkingSound,
    stopThinkingSound,
    startPhoneRinging,
    stopPhoneRinging,
    stopAllSounds
  }
}
