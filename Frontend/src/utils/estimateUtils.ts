import type { Participant } from '../types';

export function isActiveParticipant(participant: Participant): boolean {
  const isParticipant = participant.role === 'participant';
  const isCreatorParticipating = participant.role === 'creator' && participant.participationMode === 'participant';
  return isParticipant || isCreatorParticipating;
}

export function parseNumericCardSet(cardSet: string[]): number[] {
  return cardSet
    .filter(card => card !== '?')
    .map(card => parseFloat(card))
    .filter(val => !isNaN(val))
    .sort((a, b) => a - b);
}

export function getEstimatesFromParticipants(participants: Participant[]): number[] {
  return participants
    .filter((p) => {
      return isActiveParticipant(p) && p.currentEstimate && p.currentEstimate !== '?';
    })
    .map((p) => parseFloat(p.currentEstimate!))
    .filter((val) => !isNaN(val) && isFinite(val));
}

export function getAllEstimatesFromParticipants(participants: Participant[]): string[] {
  return participants
    .filter((p) => {
      return isActiveParticipant(p) && p.currentEstimate;
    })
    .map((p) => p.currentEstimate!);
}

export function hasNoNumericEstimates(participants: Participant[]): boolean {
  const activeParticipants = participants.filter(isActiveParticipant);
  if (activeParticipants.length === 0) return false;
  
  const votedParticipants = activeParticipants.filter(p => p.currentEstimate !== null);
  if (votedParticipants.length === 0) return false;
  
  // Vérifie qu'il n'y a aucune estimation numérique en utilisant parseInt
  return votedParticipants.every(p => {
    const estimate = p.currentEstimate;
    if (estimate === null) return false;
    const parsed = parseInt(estimate, 10);
    return isNaN(parsed);
  });
}

export function calculateAverage(estimates: number[]): number | null {
  if (estimates.length === 0) return null;
  return Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length);
}

export function calculateMedian(estimates: number[], cardSet?: string[]): number | null {
  if (estimates.length === 0) return null;
  
  if (cardSet && cardSet.length > 0) {
    const numericCardSet = parseNumericCardSet(cardSet);
    
    if (numericCardSet.length > 0) {
      const sortedEstimates = [...estimates].sort((a, b) => a - b);
      const minVote = sortedEstimates[0];
      const maxVote = sortedEstimates[sortedEstimates.length - 1];
      
      const intervalCards = numericCardSet.filter(
        card => card >= minVote && card <= maxVote
      );
      
      if (intervalCards.length > 0) {
        if (intervalCards.length === 1) {
          return intervalCards[0];
        }
        
        const mid = Math.floor(intervalCards.length / 2);
        
        if (intervalCards.length % 2 === 0) {
          return (intervalCards[mid - 1] + intervalCards[mid]) / 2;
        } else {
          return intervalCards[mid];
        }
      }
    }
  }
  
  const sorted = [...estimates].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    const leftValue = sorted[mid - 1];
    const rightValue = sorted[mid];
    const leftCount = sorted.filter(v => v === leftValue).length;
    const rightCount = sorted.filter(v => v === rightValue).length;
    
    if (leftCount === rightCount && leftValue !== rightValue) {
      return (leftValue + rightValue) / 2;
    }
  }
  
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  const rounded = median % 1 === 0.5 ? Math.ceil(median) : Math.round(median);
  
  return rounded;
}

export function findClosestCard(median: number, cardSet: number[]): number {
  if (cardSet.length === 0) return median;
  
  let closest = cardSet[0];
  let minDiff = Math.abs(median - closest);
  
  for (const card of cardSet) {
    const diff = Math.abs(median - card);
    if (diff < minDiff) {
      minDiff = diff;
      closest = card;
    }
  }
  
  return closest;
}

export function calculateRecommendedEstimate(
  estimates: number[],
  cardSet: string[]
): number | null {
  if (estimates.length === 0) return null;
  
  return calculateMedian(estimates, cardSet);
}

