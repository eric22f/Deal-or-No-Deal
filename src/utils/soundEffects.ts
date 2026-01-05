import type { Briefcase } from '../types/game'

export const playCaseOpenSound = (openedAmount: number, briefcases: Briefcase[]) => {
  const unopenedCases = briefcases.filter(b => !b.isOpened && b.amount !== null && !b.isPlayerCase)
  const unopenedAmounts = unopenedCases.map(b => b.amount as number).sort((a, b) => a - b)
  
  const minValue = Math.min(...unopenedAmounts)
  const maxValue = Math.max(...unopenedAmounts)
  
  let soundFile = ''
  
  if (openedAmount === minValue) {
    soundFile = '/cheer/cheer05.wav'
  } else if (openedAmount === maxValue) {
    soundFile = '/aww/aww03.mp3'
  } else {
    const sortedAmounts = [...unopenedAmounts].sort((a, b) => a - b)
    const middleIndex = Math.floor(sortedAmounts.length / 2)
    const median = sortedAmounts.length % 2 === 0
      ? (sortedAmounts[middleIndex - 1] + sortedAmounts[middleIndex]) / 2
      : sortedAmounts[middleIndex]
    
    const position = sortedAmounts.indexOf(openedAmount)
    const percentile = position / sortedAmounts.length
    
    if (openedAmount < median) {
      if (percentile <= 0.1) {
        soundFile = '/cheer/cheer04.wav'
      } else if (percentile <= 0.3) {
        soundFile = '/cheer/cheer03.wav'
      } else if (percentile <= 0.5) {
        soundFile = '/cheer/cheer02.mp3'
      } else {
        soundFile = '/cheer/cheer01.mp3'
      }
    } else {
      if (percentile >= 0.5) {
        soundFile = '/aww/aww02.mp3'
      } else {
        soundFile = '/aww/aww01.mp3'
      }
    }
  }
  
  if (soundFile) {
    const audio = new Audio(soundFile)
    audio.play().catch(err => console.log('Could not play sound:', err))
  }
}

export const playDealAcceptedSound = (bankerOffer: number, playerCaseAmount: number) => {
  let soundFile = ''
  
  if (bankerOffer < 50) {
    soundFile = '/laugh01.mp3'
  } else if (playerCaseAmount > bankerOffer) {
    const difference = playerCaseAmount - bankerOffer
    if (difference <= 200) {
      soundFile = '/aww/aww01.mp3'
    } else if (difference <= 1000) {
      soundFile = '/aww/aww02.mp3'
    } else {
      soundFile = '/aww/aww03.mp3'
    }
  } else {
    const difference = bankerOffer - playerCaseAmount
    if (difference <= 100) {
      soundFile = '/cheer/cheer01.mp3'
    } else if (difference <= 250) {
      soundFile = '/cheer/cheer02.mp3'
    } else if (difference <= 500) {
      soundFile = '/cheer/cheer03.wav'
    } else if (difference <= 1000) {
      soundFile = '/cheer/cheer04.wav'
    } else {
      soundFile = '/cheer/cheer05.wav'
    }
  }
  
  if (soundFile) {
    setTimeout(() => {
      const audio = new Audio(soundFile)
      audio.play().catch(err => console.log('Could not play sound:', err))
    }, 100)
  }
}

export const playBriefcaseRevealSound = (bankerOffer: number, briefcaseAmount: number) => {
  const difference = Math.abs(briefcaseAmount - bankerOffer)
  let soundFile = ''
  
  if (briefcaseAmount > bankerOffer) {
    if (difference <= 200) {
      soundFile = '/aww/aww01.mp3'
    } else if (difference <= 1000) {
      soundFile = '/aww/aww02.mp3'
    } else {
      soundFile = '/aww/aww03.mp3'
    }
  } else {
    if (difference <= 100) {
      soundFile = '/cheer/cheer01.mp3'
    } else if (difference <= 250) {
      soundFile = '/cheer/cheer02.mp3'
    } else if (difference <= 500) {
      soundFile = '/cheer/cheer03.wav'
    } else if (difference <= 1000) {
      soundFile = '/cheer/cheer04.wav'
    } else {
      soundFile = '/cheer/cheer05.wav'
    }
  }
  
  if (soundFile) {
    setTimeout(() => {
      const audio = new Audio(soundFile)
      audio.play().catch(err => console.log('Could not play sound:', err))
    }, 100)
  }
}
