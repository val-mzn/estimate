import { useMemo } from 'react';
import type { Room, Participant } from '../types';
import {
  parseNumericCardSet,
  getEstimatesFromParticipants,
  calculateAverage,
  calculateRecommendedEstimate,
} from '../utils/estimateUtils';
import { getCurrentUserEstimate, getTotalParticipants, getVotedParticipants } from '../utils/roomUtils';

export function useEstimateCalculations(
  room: Room | null,
  currentUser: Participant | null,
  currentTaskId: string | null
) {
  const currentUserEstimate = useMemo(() => {
    if (!room || !currentUser) return null;
    return getCurrentUserEstimate(room.participants, currentUser.id);
  }, [room?.participants, currentUser?.id]);

  const numericCardSet = useMemo(() => {
    if (!room) return [];
    return parseNumericCardSet(room.cardSet);
  }, [room?.cardSet]);

  const estimatesForCurrentTask = useMemo(() => {
    if (!room) return [];
    return getEstimatesFromParticipants(room.participants);
  }, [room?.participants]);

  const averageEstimate = useMemo(() => {
    return calculateAverage(estimatesForCurrentTask);
  }, [estimatesForCurrentTask]);

  const medianEstimate = useMemo(() => {
    if (!room) return null;
    return calculateRecommendedEstimate(estimatesForCurrentTask, room.cardSet);
  }, [estimatesForCurrentTask, room?.cardSet]);

  const totalParticipants = useMemo(() => {
    if (!room) return 0;
    return getTotalParticipants(room.participants);
  }, [room?.participants]);

  const votedParticipants = useMemo(() => {
    if (!room) return 0;
    return getVotedParticipants(room.participants, currentTaskId);
  }, [room?.participants, currentTaskId]);

  return {
    currentUserEstimate,
    numericCardSet,
    estimatesForCurrentTask,
    averageEstimate,
    medianEstimate,
    totalParticipants,
    votedParticipants,
  };
}

