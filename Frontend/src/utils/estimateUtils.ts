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
  // Filtrer les valeurs non numériques
  const numericEstimates = estimates
    .map(val => typeof val === 'number' ? val : parseFloat(String(val)))
    .filter(val => !isNaN(val) && isFinite(val));
  
  if (numericEstimates.length === 0) return null;
  
  // Si une seule valeur, retourner cette valeur directement
  if (numericEstimates.length === 1) return numericEstimates[0];
  
  // Si on a un cardSet, calculer la médiane sur les cartes de l'intervalle
  if (cardSet && cardSet.length > 0) {
    const numericCardSet = parseNumericCardSet(cardSet);
    
    if (numericCardSet.length > 0) {
      const sortedEstimates = [...numericEstimates].sort((a, b) => a - b);
      const minVote = sortedEstimates[0];
      const maxVote = sortedEstimates[sortedEstimates.length - 1];
      
      // Filtrer les cartes dans l'intervalle [minVote, maxVote]
      const intervalCards = numericCardSet.filter(
        card => card >= minVote && card <= maxVote
      );
      
      if (intervalCards.length > 0) {
        if (intervalCards.length === 1) {
          return intervalCards[0];
        }
        
        // Calculer la médiane sur les cartes de l'intervalle
        const mid = Math.floor(intervalCards.length / 2);
        
        if (intervalCards.length % 2 === 0) {
          // Nombre pair de cartes : prendre la carte supérieure (arrondi vers le supérieur)
          return intervalCards[mid];
        } else {
          // Nombre impair de cartes : valeur du milieu
          return intervalCards[mid];
        }
      }
    }
  }
  
  // Sinon, calculer la médiane sur les votes réels
  const sorted = [...numericEstimates].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  let median: number;
  if (sorted.length % 2 === 0) {
    // Nombre pair de votes : moyenne des deux valeurs du milieu
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // Nombre impair de votes : valeur du milieu
    median = sorted[mid];
  }
  
  // Arrondir la médiane si nécessaire
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

export function getAbstentionPercentage(participants: Participant[]): number {
  const activeParticipants = participants.filter(isActiveParticipant);
  if (activeParticipants.length === 0) return 0;
  
  // Compter les abstentions : ceux qui n'ont pas voté OU qui ont voté "?"
  const abstentions = activeParticipants.filter(p => 
    p.currentEstimate === null || p.currentEstimate === '?'
  ).length;
  
  return (abstentions / activeParticipants.length) * 100;
}

export function calculateRecommendedEstimate(
  estimates: number[],
  cardSet: string[],
  participants?: Participant[]
): number | null {
  if (estimates.length === 0) return null;
  
  // Si on a les participants, vérifier le pourcentage d'abstentions
  if (participants) {
    const abstentionPercentage = getAbstentionPercentage(participants);
    if (abstentionPercentage >= 50) {
      return null; // Indique qu'on doit recommander "?"
    }
  }
  
  return calculateMedian(estimates, cardSet);
}

