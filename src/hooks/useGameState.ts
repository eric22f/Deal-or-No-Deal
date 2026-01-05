import { useReducer, type Dispatch } from 'react'
import type { GamePhase, Briefcase } from '../types/game'
import { ALL_VALUES } from '../constants/gameConfig'

export interface GameState {
  briefcases: Briefcase[]
  gamePhase: GamePhase
  currentRound: number
  casesOpenedThisRound: number
  openedAmounts: number[]
  casesToRemove: number[]
  finalWinnings: number
  tookDeal: boolean
  briefcaseRevealed: boolean
  bankerOffer: number
  bankerRemark: string
}

type GameAction =
  | { type: 'INITIALIZE_GAME' }
  | { type: 'SELECT_PLAYER_CASE'; caseId: number }
  | { type: 'OPEN_CASE'; caseId: number; amount: number }
  | { type: 'START_BANKER_THINKING' }
  | { type: 'START_BANKER_CALLING' }
  | { type: 'SET_BANKER_OFFER'; offer: number; remark: string }
  | { type: 'ACCEPT_DEAL'; bankerOffer: number }
  | { type: 'REJECT_DEAL'; casesToRemove: number[] }
  | { type: 'START_NEXT_ROUND' }
  | { type: 'START_FINAL_CHOICE' }
  | { type: 'FINAL_CHOICE'; winnings: number }
  | { type: 'REVEAL_BRIEFCASE' }

const initializeBriefcases = (): Briefcase[] => {
  const shuffledAmounts = [...ALL_VALUES].sort(() => Math.random() - 0.5)
  const cases: Briefcase[] = []
  
  for (let i = 1; i <= 24; i++) {
    if (i === 23 || i === 24) {
      cases.push({ id: i, amount: null, isPlayerCase: false, isOpened: false })
    } else {
      cases.push({ 
        id: i, 
        amount: shuffledAmounts[i - 1], 
        isPlayerCase: false, 
        isOpened: false 
      })
    }
  }
  
  return cases
}

const initialState: GameState = {
  briefcases: [],
  gamePhase: 'SELECT_YOUR_CASE',
  currentRound: 0,
  casesOpenedThisRound: 0,
  openedAmounts: [],
  casesToRemove: [],
  finalWinnings: 0,
  tookDeal: false,
  briefcaseRevealed: false,
  bankerOffer: 0,
  bankerRemark: ''
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...initialState,
        briefcases: initializeBriefcases()
      }
    
    case 'SELECT_PLAYER_CASE':
      return {
        ...state,
        briefcases: state.briefcases.map(c => 
          c.id === action.caseId ? { ...c, isPlayerCase: true, isOpened: true } : c
        ),
        gamePhase: 'OPEN_CASES'
      }
    
    case 'OPEN_CASE':
      return {
        ...state,
        briefcases: state.briefcases.map(c => 
          c.id === action.caseId ? { ...c, isOpened: true } : c
        ),
        openedAmounts: [...state.openedAmounts, action.amount],
        casesOpenedThisRound: state.casesOpenedThisRound + 1
      }
    
    case 'START_BANKER_THINKING':
      return {
        ...state,
        gamePhase: 'BANKER_THINKING'
      }
    
    case 'START_BANKER_CALLING':
      return {
        ...state,
        gamePhase: 'BANKER_CALLING'
      }
    
    case 'SET_BANKER_OFFER':
      return {
        ...state,
        bankerOffer: action.offer,
        bankerRemark: action.remark,
        gamePhase: 'BANKER_OFFER'
      }
    
    case 'ACCEPT_DEAL':
      return {
        ...state,
        finalWinnings: action.bankerOffer,
        tookDeal: true,
        gamePhase: 'GAME_OVER'
      }
    
    case 'REJECT_DEAL':
      return {
        ...state,
        casesToRemove: [...state.casesToRemove, ...action.casesToRemove]
      }
    
    case 'START_NEXT_ROUND':
      return {
        ...state,
        currentRound: state.currentRound + 1,
        casesOpenedThisRound: 0,
        gamePhase: 'OPEN_CASES'
      }
    
    case 'START_FINAL_CHOICE':
      return {
        ...state,
        gamePhase: 'FINAL_CHOICE'
      }
    
    case 'FINAL_CHOICE':
      return {
        ...state,
        finalWinnings: action.winnings,
        gamePhase: 'GAME_OVER'
      }
    
    case 'REVEAL_BRIEFCASE':
      return {
        ...state,
        briefcaseRevealed: true
      }
    
    default:
      return state
  }
}

export function useGameState(): [GameState, Dispatch<GameAction>] {
  return useReducer(gameReducer, initialState)
}
