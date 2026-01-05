import type { GamePhase } from '../types/game'
import { CASES_TO_OPEN_PER_ROUND } from '../constants/gameConfig'

export function getGameMessage(
  gamePhase: GamePhase,
  currentRound: number,
  casesOpenedThisRound: number,
  bankerRemark: string,
  tookDeal: boolean,
  finalWinnings: number,
  bankerOffer: number
): string {
  switch (gamePhase) {
    case 'SELECT_YOUR_CASE':
      return 'Which briefcase will you choose?'
    
    case 'OPEN_CASES': {
      const remaining = CASES_TO_OPEN_PER_ROUND[currentRound] - casesOpenedThisRound
      return `Open ${remaining} more case${remaining !== 1 ? 's' : ''}`
    }
    
    case 'BANKER_THINKING':
      return 'Banker is Thinking'
    
    case 'BANKER_CALLING':
      return 'The Banker is calling...'
    
    case 'BANKER_OFFER':
      return bankerRemark
    
    case 'FINAL_CHOICE':
      return 'Choose your briefcase or swap for the remaining case?'
    
    case 'GAME_OVER':
      if (tookDeal) {
        return `You Win ₱ ${bankerOffer.toLocaleString('en-PH')}`
      }
      return `You Win ₱ ${finalWinnings.toLocaleString('en-PH')}`
    
    default:
      return ''
  }
}

export function shouldShowMessage(gamePhase: GamePhase): boolean {
  return ['SELECT_YOUR_CASE', 'OPEN_CASES', 'BANKER_THINKING', 'FINAL_CHOICE'].includes(gamePhase)
}

export function shouldShowAnswerButton(gamePhase: GamePhase): boolean {
  return gamePhase === 'BANKER_CALLING'
}

export function shouldShowDealButtons(gamePhase: GamePhase): boolean {
  return gamePhase === 'BANKER_OFFER'
}

export function shouldShowBankerOffer(gamePhase: GamePhase): boolean {
  return gamePhase === 'BANKER_OFFER'
}

export function shouldShowLeaderboard(gamePhase: GamePhase): boolean {
  return gamePhase === 'GAME_OVER'
}

export function shouldShowRevealMessage(
  gamePhase: GamePhase,
  tookDeal: boolean,
  briefcaseRevealed: boolean
): boolean {
  return gamePhase === 'GAME_OVER' && tookDeal && !briefcaseRevealed
}
