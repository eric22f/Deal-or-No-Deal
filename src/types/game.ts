export type GamePhase = 
  | 'SELECT_YOUR_CASE' 
  | 'OPEN_CASES' 
  | 'BANKER_THINKING' 
  | 'BANKER_CALLING' 
  | 'BANKER_OFFER' 
  | 'FINAL_CHOICE' 
  | 'GAME_OVER'

export interface Briefcase {
  id: number
  amount: number | null
  isPlayerCase: boolean
  isOpened: boolean
}

export interface PlayerScore {
  name: string
  winnings: number
}
