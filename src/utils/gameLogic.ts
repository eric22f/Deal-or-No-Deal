import type { Briefcase } from '../types/game'
import { CASES_TO_OPEN_PER_ROUND } from '../constants/gameConfig'

export function getUnopenedCases(briefcases: Briefcase[]): Briefcase[] {
  return briefcases.filter(b => !b.isOpened && !b.isPlayerCase && b.amount !== null)
}

export function getPlayerCase(briefcases: Briefcase[]): Briefcase | undefined {
  return briefcases.find(b => b.isPlayerCase)
}

export function shouldTransitionToFinalChoice(
  unopenedCount: number,
  currentRound: number
): boolean {
  return unopenedCount === 1 && currentRound === CASES_TO_OPEN_PER_ROUND.length - 1
}

export function getOpenedCaseIds(briefcases: Briefcase[]): number[] {
  return briefcases
    .filter(b => b.isOpened && !b.isPlayerCase)
    .map(b => b.id)
}

export function getThinkingDelay(currentRound: number, delays: {
  round0: { min: number; max: number }
  round1: { min: number; max: number }
  round2: { min: number; max: number }
  default: { min: number; max: number }
}): number {
  const delayConfig = currentRound === 0 ? delays.round0
    : currentRound === 1 ? delays.round1
    : currentRound === 2 ? delays.round2
    : delays.default
  
  const { min, max } = delayConfig
  return Math.random() * (max - min) + min
}

export function isCaseClickable(
  briefcase: Briefcase,
  gamePhase: string,
  casesOpenedThisRound: number,
  currentRound: number
): boolean {
  if (briefcase.amount === null) return false
  
  if (gamePhase === 'SELECT_YOUR_CASE') return true
  
  if (gamePhase === 'OPEN_CASES') {
    return !briefcase.isPlayerCase && 
           !briefcase.isOpened && 
           casesOpenedThisRound < CASES_TO_OPEN_PER_ROUND[currentRound]
  }
  
  if (gamePhase === 'FINAL_CHOICE') {
    return !briefcase.isPlayerCase && !briefcase.isOpened
  }
  
  return false
}
