import { useEffect } from 'react';
import type { Room, Task } from '../types';
import { hasNoNumericEstimates, getAbstentionPercentage } from '../utils/estimateUtils';

interface UseAutoFinalEstimateParams {
  isCreator: boolean;
  room: Room | null;
  currentTask: Task | undefined;
  roomCode: string | undefined;
  medianEstimate: number | null;
  estimatesForCurrentTask: number[];
  setFinalEstimate: (payload: { roomCode: string; taskId: string; finalEstimate: number | '?' | null }) => void;
}

export function useAutoFinalEstimate({
  isCreator,
  room,
  currentTask,
  roomCode,
  medianEstimate,
  estimatesForCurrentTask,
  setFinalEstimate,
}: UseAutoFinalEstimateParams) {
  useEffect(() => {
    if (!isCreator || !room?.isRevealed || !currentTask || !roomCode) {
      return;
    }
    
    const taskFinalEstimate = (currentTask as any).finalEstimate as number | '?' | null;
    if (taskFinalEstimate !== null) {
      return;
    }

    const hasNoNumeric = hasNoNumericEstimates(room.participants);
    const abstentionPercentage = getAbstentionPercentage(room.participants);
    const shouldRecommendAbstention = abstentionPercentage >= 50;
    
    if (hasNoNumeric || shouldRecommendAbstention) {
      setFinalEstimate({
        roomCode,
        taskId: currentTask.id,
        finalEstimate: '?',
      });
    } else if (medianEstimate !== null && estimatesForCurrentTask.length > 0) {
      setFinalEstimate({
        roomCode,
        taskId: currentTask.id,
        finalEstimate: medianEstimate,
      });
    }
  }, [
    room?.isRevealed,
    room?.participants,
    currentTask,
    medianEstimate,
    estimatesForCurrentTask.length,
    isCreator,
    roomCode,
    setFinalEstimate,
  ]);
}

