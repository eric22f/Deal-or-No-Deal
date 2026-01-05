import type { Briefcase } from '../types/game'
import { BANKER_REMARKS, type RemarkCategory } from '../constants/gameConfig'

export const calculateBankerOffer = (briefcases: Briefcase[]): number => {
  const unopenedCases = briefcases.filter(b => !b.isOpened && b.amount !== null)
  const playerCase = briefcases.find(b => b.isPlayerCase)
  
  const allRemainingAmounts = [...unopenedCases.map(b => b.amount as number)]
  if (playerCase && playerCase.amount !== null) {
    allRemainingAmounts.push(playerCase.amount)
  }
  
  const sortedAmounts = [...allRemainingAmounts].sort((a, b) => a - b)
  
  let baseValue: number
  
  if (sortedAmounts.length === 2) {
    baseValue = (sortedAmounts[0] + sortedAmounts[1]) / 2
    const difference = sortedAmounts[1] - sortedAmounts[0]
    const variance = (difference > 900) ? 150 : (difference > 450) ? 75 : 50
    const randomVariance = (Math.random() * 2 - 1) * variance
    const offer = Math.round(baseValue + randomVariance)
    return Math.max(sortedAmounts[0] + 1, Math.min(sortedAmounts[1] - 1, offer))
  } else if (sortedAmounts.length <= 4) {
    baseValue = sortedAmounts[sortedAmounts.length - 2]
  } else {
    const middleIndex = Math.floor(sortedAmounts.length / 2)
    baseValue = sortedAmounts.length % 2 === 0
      ? (sortedAmounts[middleIndex - 1] + sortedAmounts[middleIndex]) / 2
      : sortedAmounts[middleIndex]
  }
  
  let variancePercent: number
  if (baseValue < 500) {
    variancePercent = 0.15
  } else if (baseValue < 1000) {
    variancePercent = 0.10
  } else {
    variancePercent = 0.05
  }
  
  const randomVariance = (Math.random() * 2 - 1) * variancePercent
  let offer = baseValue * (1 + randomVariance)
  
  if (offer < 10) {
    offer = Math.ceil(offer)
  } else if (offer < 100) {
    offer = Math.ceil(offer / 5) * 5
  } else {
    offer = Math.ceil(offer / 50) * 50
  }
  
  const minValue = sortedAmounts[0]
  const maxValue = sortedAmounts[sortedAmounts.length - 1]
  
  if (offer <= minValue) {
    offer = minValue + (minValue < 10 ? 1 : minValue < 100 ? 5 : 50)
  } else if (offer >= maxValue) {
    offer = maxValue - (maxValue < 10 ? 1 : maxValue < 100 ? 5 : 50)
  }
  
  return offer
}

export const getBankerRemark = (offer: number, briefcases: Briefcase[]): string => {
  const unopenedCases = briefcases.filter(b => !b.isOpened && b.amount !== null && !b.isPlayerCase)
  const unopenedAmounts = unopenedCases.map(b => b.amount as number)
  const avgRemaining = unopenedAmounts.reduce((a, b) => a + b, 0) / unopenedAmounts.length
  
  const offerQuality = offer / avgRemaining
  
  let remarkCategory: RemarkCategory
  if (offerQuality < 0.3) {
    remarkCategory = 'terrible'
  } else if (offerQuality < 0.6) {
    remarkCategory = 'poor'
  } else if (offerQuality < 0.9) {
    remarkCategory = 'fair'
  } else if (offerQuality < 1.2) {
    remarkCategory = 'good'
  } else {
    remarkCategory = 'excellent'
  }
  
  const categoryRemarks = BANKER_REMARKS[remarkCategory]
  return categoryRemarks[Math.floor(Math.random() * categoryRemarks.length)]
}
