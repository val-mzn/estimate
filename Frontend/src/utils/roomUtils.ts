import type { Participant } from '../types';
import { isActiveParticipant } from './estimateUtils';

export function getTotalParticipants(participants: Participant[]): number {
  return participants.filter(isActiveParticipant).length;
}

export function getVotedParticipants(
  participants: Participant[],
  currentTaskId: string | null
): number {
  return participants.filter((p) => {
    return isActiveParticipant(p) && 
           p.currentEstimate && 
           currentTaskId !== null;
  }).length;
}

export function hasParticipantEstimated(participants: Participant[]): boolean {
  return participants.some((p) => p.currentEstimate && p.currentEstimate !== '?');
}

export function getCurrentUserEstimate(
  participants: Participant[],
  currentUserId: string | null
): string | null {
  return participants.find((p) => p.id === currentUserId)?.currentEstimate ?? null;
}

export function isTaskAlreadyEstimated(task: { finalEstimate: number | '?' | null }): boolean {
  return task.finalEstimate !== null;
}

export function getNameColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 15);
  const lightness = 45 + (Math.abs(hash) % 15);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

