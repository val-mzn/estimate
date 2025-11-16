import { useCallback } from 'react';
import type { Room } from '../types';

interface UseTaskHandlersParams {
  room: Room | null;
  roomCode: string | undefined;
  isCreator: boolean;
  isParticipant: boolean;
  createTask: (payload: { roomCode: string; title: string; description?: string }) => void;
  deleteTask: (payload: { roomCode: string; taskId: string }) => void;
  estimateTask: (payload: { roomCode: string; taskId: string; estimate: string }) => void;
  revealEstimates: (payload: { roomCode: string }) => void;
  hideEstimates: (payload: { roomCode: string }) => void;
  resetEstimates: (payload: { roomCode: string }) => void;
  previewFinalEstimate: (payload: { roomCode: string; taskId: string; finalEstimate: number | '?' | null }) => void;
  setFinalEstimate: (payload: { roomCode: string; taskId: string; finalEstimate: number | '?' | null }) => void;
  setShowAddTaskModal: (show: boolean) => void;
}

export function useTaskHandlers({
  room,
  roomCode,
  isCreator,
  isParticipant,
  createTask,
  deleteTask,
  estimateTask,
  revealEstimates,
  hideEstimates,
  resetEstimates,
  previewFinalEstimate,
  setFinalEstimate,
  setShowAddTaskModal,
}: UseTaskHandlersParams) {
  const handleEstimate = useCallback((value: string) => {
    if (!room?.currentTaskId || !isParticipant || !roomCode) return;
    estimateTask({
      roomCode,
      taskId: room.currentTaskId,
      estimate: value,
    });
  }, [room?.currentTaskId, isParticipant, roomCode, estimateTask]);

  const handleFinalEstimatePreview = useCallback((value: number | '?' | null) => {
    if (!room?.currentTaskId || !roomCode) return;
    previewFinalEstimate({
      roomCode,
      taskId: room.currentTaskId,
      finalEstimate: value,
    });
  }, [room?.currentTaskId, roomCode, previewFinalEstimate]);

  const handleFinalEstimateChange = useCallback((value: number | '?' | null) => {
    if (!room?.currentTaskId || !roomCode) return;
    setFinalEstimate({
      roomCode,
      taskId: room.currentTaskId,
      finalEstimate: value,
    });
  }, [room?.currentTaskId, roomCode, setFinalEstimate]);

  const handleReveal = useCallback(() => {
    if (!isCreator || !roomCode) return;
    revealEstimates({ roomCode });
  }, [isCreator, roomCode, revealEstimates]);

  const handleHide = useCallback(() => {
    if (!isCreator || !roomCode) return;
    hideEstimates({ roomCode });
  }, [isCreator, roomCode, hideEstimates]);

  const handleReset = useCallback(() => {
    if (!isCreator || !roomCode) return;
    resetEstimates({ roomCode });
  }, [isCreator, roomCode, resetEstimates]);

  const handleAddTask = useCallback((taskData: { title: string }) => {
    if (!roomCode) return;
    createTask({
      roomCode,
      title: taskData.title,
    });
    setShowAddTaskModal(false);
  }, [roomCode, createTask, setShowAddTaskModal]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!roomCode) return;
    deleteTask({ roomCode, taskId });
  }, [roomCode, deleteTask]);

  return {
    handleEstimate,
    handleFinalEstimatePreview,
    handleFinalEstimateChange,
    handleReveal,
    handleHide,
    handleReset,
    handleAddTask,
    handleDeleteTask,
  };
}

