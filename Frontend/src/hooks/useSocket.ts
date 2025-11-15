import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { socketService } from '../services/socketService';
import { useRoomStore } from '../stores/roomStore';
import type {
  RoomJoinedResponse,
  ParticipantJoinedResponse,
  ParticipantLeftResponse,
  TaskCreatedResponse,
  TaskDeletedResponse,
  TaskSelectedResponse,
  EstimateUpdatedResponse,
  EstimatesRevealedResponse,
  EstimatesResetResponse,
  FinalEstimateUpdatedResponse,
  ErrorResponse,
  SelectTaskPayload,
} from '../types';

interface UseSocketCallbacks {
  onRoomJoined?: (response: RoomJoinedResponse) => void;
  onParticipantJoined?: (response: ParticipantJoinedResponse) => void;
  onParticipantLeft?: (response: ParticipantLeftResponse) => void;
  onTaskCreated?: (response: TaskCreatedResponse) => void;
  onTaskDeleted?: (response: TaskDeletedResponse) => void;
  onTaskSelected?: (response: TaskSelectedResponse) => void;
  onEstimateUpdated?: (response: EstimateUpdatedResponse) => void;
  onEstimatesRevealed?: (response: EstimatesRevealedResponse) => void;
  onEstimatesReset?: (response: EstimatesResetResponse) => void;
  onError?: (response: ErrorResponse) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(callbacks: UseSocketCallbacks = {}) {
  const callbacksRef = useRef(callbacks);
  const {
    setRoom,
    setCurrentUser,
    setConnected,
    setError,
    addParticipant,
    removeParticipant,
    updateParticipantEstimate,
    addTask,
    removeTask,
    setCurrentTask,
    updateTaskFinalEstimate,
    setRevealed,
    resetEstimates: resetEstimatesStore,
    reset,
  } = useRoomStore();

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    socketService.connect();

    const handleParticipantJoined = (response: ParticipantJoinedResponse) => {
      addParticipant({
        ...response.participant,
        currentEstimate: null,
        participationMode: response.participant.participationMode,
      });
      callbacksRef.current.onParticipantJoined?.(response);
    };

    const handleParticipantLeft = (response: ParticipantLeftResponse) => {
      removeParticipant(response.participantId);
      callbacksRef.current.onParticipantLeft?.(response);
    };

    const handleTaskCreated = (response: TaskCreatedResponse) => {
      addTask({
        ...response.task,
        finalEstimate: response.task.finalEstimate ?? null,
      });
      callbacksRef.current.onTaskCreated?.(response);
    };

    const handleTaskDeleted = (response: TaskDeletedResponse) => {
      removeTask(response.taskId);
      if (response.currentTaskId) {
        setCurrentTask(response.currentTaskId);
      }
      callbacksRef.current.onTaskDeleted?.(response);
    };

    const handleTaskSelected = (response: TaskSelectedResponse) => {
      setCurrentTask(response.taskId);
      setRevealed(response.isRevealed);
      callbacksRef.current.onTaskSelected?.(response);
    };

    const handleEstimateUpdated = (response: EstimateUpdatedResponse) => {
      updateParticipantEstimate(response.participantId, response.estimate);
      callbacksRef.current.onEstimateUpdated?.(response);
    };

    const handleEstimatesRevealed = (response: EstimatesRevealedResponse) => {
      response.participants.forEach((participant) => {
        updateParticipantEstimate(participant.id, participant.currentEstimate);
      });
      setRevealed(true);
      callbacksRef.current.onEstimatesRevealed?.(response);
    };

    const handleEstimatesReset = (response: EstimatesResetResponse) => {
      resetEstimatesStore();
      callbacksRef.current.onEstimatesReset?.(response);
    };

    const handleFinalEstimateUpdated = (response: FinalEstimateUpdatedResponse) => {
      updateTaskFinalEstimate(response.taskId, response.finalEstimate);
    };

    const handleError = (response: ErrorResponse) => {
      if (response.message === 'Seul le créateur peut sélectionner/désélectionner des fiches') {
        toast.error(response.message);
      } else {
        setError(response.message);
      }
      callbacksRef.current.onError?.(response);
    };

    const handleConnect = () => {
      setConnected(true);
      callbacksRef.current.onConnect?.();
    };

    const handleDisconnect = () => {
      setConnected(false);
      callbacksRef.current.onDisconnect?.();
    };

    const handleKicked = (response: { message: string }) => {
      setError(response.message);
      setTimeout(() => {
        reset();
        window.location.href = '/';
      }, 2000);
    };

    socketService.onParticipantJoined(handleParticipantJoined);
    socketService.onParticipantLeft(handleParticipantLeft);
    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskDeleted(handleTaskDeleted);
    socketService.onTaskSelected(handleTaskSelected);
    socketService.onEstimateUpdated(handleEstimateUpdated);
    socketService.onEstimatesRevealed(handleEstimatesRevealed);
    socketService.onEstimatesReset(handleEstimatesReset);
    socketService.onFinalEstimateUpdated(handleFinalEstimateUpdated);
    socketService.onError(handleError);
    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    socketService.onKicked(handleKicked);

    return () => {
      socketService.offParticipantJoined(handleParticipantJoined);
      socketService.offParticipantLeft(handleParticipantLeft);
      socketService.offTaskCreated(handleTaskCreated);
      socketService.offTaskDeleted(handleTaskDeleted);
      socketService.offTaskSelected(handleTaskSelected);
      socketService.offEstimateUpdated(handleEstimateUpdated);
      socketService.offEstimatesRevealed(handleEstimatesRevealed);
      socketService.offEstimatesReset(handleEstimatesReset);
      socketService.offFinalEstimateUpdated(handleFinalEstimateUpdated);
      socketService.offError(handleError);
      socketService.offConnect(handleConnect);
      socketService.offDisconnect(handleDisconnect);
      socketService.offKicked(handleKicked);
    };
  }, [
    setRoom,
    setCurrentUser,
    setConnected,
    setError,
    addParticipant,
    removeParticipant,
    updateParticipantEstimate,
    addTask,
    removeTask,
    setCurrentTask,
    updateTaskFinalEstimate,
    setRevealed,
    resetEstimatesStore,
    reset,
  ]);

  const createRoom = useCallback(
    (
      payload: Parameters<typeof socketService.createRoom>[0],
      callback: (response: Parameters<typeof socketService.createRoom>[1] extends (response: infer T) => void ? T : never) => void
    ) => {
      socketService.createRoom(payload, (response) => {
        const participant = {
          ...response.participant,
          currentEstimate: null,
          participationMode: response.participant.participationMode,
        };
        setRoom({
          code: response.roomCode,
          name: response.roomName,
          cardSet: response.cardSet,
          participants: [participant],
          tasks: [],
          currentTaskId: null,
          isRevealed: false,
        });
        setCurrentUser(participant);
        callback(response);
      });
    },
    [setRoom, setCurrentUser]
  );

  const joinRoom = useCallback(
    (
      payload: Parameters<typeof socketService.joinRoom>[0],
      callback?: (response: RoomJoinedResponse) => void
    ) => {
      socketService.joinRoom(payload, (response) => {
        const foundParticipant = response.participants.find((p) => p.id === response.participant.id);
        const participant = {
          ...response.participant,
          currentEstimate: foundParticipant?.currentEstimate ?? null,
          participationMode: foundParticipant?.participationMode,
        };
        setRoom({
          code: response.roomCode,
          name: response.roomName,
          cardSet: response.cardSet,
          participants: response.participants,
          tasks: response.tasks.map(task => ({
            ...task,
            finalEstimate: task.finalEstimate ?? null,
          })),
          currentTaskId: response.currentTaskId,
          isRevealed: response.isRevealed,
        });
        setCurrentUser(participant);
        callback?.(response);
      });
    },
    [setRoom, setCurrentUser]
  );

  const createTask = useCallback((payload: Parameters<typeof socketService.createTask>[0]) => {
    socketService.createTask(payload);
  }, []);

  const deleteTask = useCallback((payload: Parameters<typeof socketService.deleteTask>[0]) => {
    socketService.deleteTask(payload);
  }, []);

  const selectTask = useCallback((payload: SelectTaskPayload) => {
    socketService.selectTask(payload);
  }, []);

  const estimateTask = useCallback((payload: Parameters<typeof socketService.estimateTask>[0]) => {
    socketService.estimateTask(payload);
  }, []);

  const revealEstimates = useCallback((payload: Parameters<typeof socketService.revealEstimates>[0]) => {
    socketService.revealEstimates(payload);
  }, []);

  const resetEstimates = useCallback((payload: Parameters<typeof socketService.resetEstimates>[0]) => {
    socketService.resetEstimates(payload);
  }, []);

  const setFinalEstimate = useCallback((payload: Parameters<typeof socketService.setFinalEstimate>[0]) => {
    socketService.setFinalEstimate(payload);
  }, []);

  return {
    isConnected: socketService.isConnected(),
    createRoom,
    joinRoom,
    createTask,
    deleteTask,
    selectTask,
    estimateTask,
    revealEstimates,
    resetEstimates,
    setFinalEstimate,
  };
}

