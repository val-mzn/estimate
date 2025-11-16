import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { socketService } from '../services/socketService';
import { useRoomStore } from '../stores/roomStore';
import type {
  RoomJoinedResponse,
  ParticipantJoinedResponse,
  ParticipantLeftResponse,
  ParticipantRoleChangedResponse,
  ParticipantNameChangedResponse,
  CardSetChangedResponse,
  AnonymousVotesChangedResponse,
  TaskCreatedResponse,
  TaskDeletedResponse,
  TaskSelectedResponse,
  EstimateUpdatedResponse,
  EstimatesRevealedResponse,
  EstimatesHiddenResponse,
  EstimatesResetResponse,
  FinalEstimateUpdatedResponse,
  ErrorResponse,
  SelectTaskPayload,
} from '../types';

interface UseSocketCallbacks {
  onRoomJoined?: (response: RoomJoinedResponse) => void;
  onParticipantJoined?: (response: ParticipantJoinedResponse) => void;
  onParticipantLeft?: (response: ParticipantLeftResponse) => void;
  onParticipantNameChanged?: (response: ParticipantNameChangedResponse) => void;
  onTaskCreated?: (response: TaskCreatedResponse) => void;
  onTaskDeleted?: (response: TaskDeletedResponse) => void;
  onTaskSelected?: (response: TaskSelectedResponse) => void;
  onEstimateUpdated?: (response: EstimateUpdatedResponse) => void;
  onEstimatesRevealed?: (response: EstimatesRevealedResponse) => void;
  onEstimatesHidden?: (response: EstimatesHiddenResponse) => void;
  onEstimatesReset?: (response: EstimatesResetResponse) => void;
  onError?: (response: ErrorResponse) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(callbacks: UseSocketCallbacks = {}) {
  const callbacksRef = useRef(callbacks);
  const { t } = useTranslation();
  const {
    setRoom,
    setCurrentUser,
    setConnected,
    addParticipant,
    removeParticipant,
    updateParticipantEstimate,
    updateParticipantRole,
    updateParticipantName,
    updateCardSet,
    updateAnonymousVotes,
    addTask,
    removeTask,
    setCurrentTask,
    updateTaskFinalEstimate,
    setRevealed,
    resetEstimates: resetEstimatesStore,
    reset,
  } = useRoomStore();
  
  // Utiliser getState pour obtenir le currentUser actuel dans les handlers
  const getCurrentUser = useCallback(() => {
    return useRoomStore.getState().currentUser;
  }, []);

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

    const handleParticipantRoleChanged = (response: ParticipantRoleChangedResponse) => {
      const currentUser = getCurrentUser();
      const isCurrentUser = currentUser?.id === response.participant.id;
      const becameManager = response.participant.role === 'manager';
      
      updateParticipantRole(
        response.participant.id, 
        response.participant.role as 'participant' | 'spectator' | 'manager',
        response.participant.participationMode
      );
      
      // Afficher un toast si l'utilisateur actuel devient manager
      if (isCurrentUser && becameManager) {
        toast.success(t('participants.becameManager'));
      }
    };

    const handleParticipantNameChanged = (response: ParticipantNameChangedResponse) => {
      updateParticipantName(response.participant.id, response.participant.name);
      callbacksRef.current.onParticipantNameChanged?.(response);
    };

    const handleCardSetChanged = (response: CardSetChangedResponse) => {
      updateCardSet(response.cardSet);
    };

    const handleAnonymousVotesChanged = (response: AnonymousVotesChangedResponse) => {
      updateAnonymousVotes(response.anonymousVotes);
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

    const handleEstimatesHidden = (response: EstimatesHiddenResponse) => {
      response.participants.forEach((participant) => {
        updateParticipantEstimate(participant.id, participant.currentEstimate);
      });
      setRevealed(false);
      callbacksRef.current.onEstimatesHidden?.(response);
    };

    const handleEstimatesReset = (response: EstimatesResetResponse) => {
      resetEstimatesStore();
      callbacksRef.current.onEstimatesReset?.(response);
    };

    const handleFinalEstimateUpdated = (response: FinalEstimateUpdatedResponse) => {
      updateTaskFinalEstimate(response.taskId, response.finalEstimate);
    };

    const handleError = (response: ErrorResponse) => {
      toast.error(response.message);
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
      toast.error(response.message);
      setTimeout(() => {
        reset();
        window.location.href = '/';
      }, 2000);
    };

    socketService.onParticipantJoined(handleParticipantJoined);
    socketService.onParticipantLeft(handleParticipantLeft);
    socketService.onParticipantRoleChanged(handleParticipantRoleChanged);
    socketService.onParticipantNameChanged(handleParticipantNameChanged);
    socketService.onCardSetChanged(handleCardSetChanged);
    socketService.onAnonymousVotesChanged(handleAnonymousVotesChanged);
    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskDeleted(handleTaskDeleted);
    socketService.onTaskSelected(handleTaskSelected);
    socketService.onEstimateUpdated(handleEstimateUpdated);
    socketService.onEstimatesRevealed(handleEstimatesRevealed);
    socketService.onEstimatesHidden(handleEstimatesHidden);
    socketService.onEstimatesReset(handleEstimatesReset);
    socketService.onFinalEstimateUpdated(handleFinalEstimateUpdated);
    socketService.onError(handleError);
    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    socketService.onKicked(handleKicked);

    return () => {
      socketService.offParticipantJoined(handleParticipantJoined);
      socketService.offParticipantLeft(handleParticipantLeft);
      socketService.offParticipantRoleChanged(handleParticipantRoleChanged);
      socketService.offParticipantNameChanged(handleParticipantNameChanged);
      socketService.offCardSetChanged(handleCardSetChanged);
      socketService.offAnonymousVotesChanged(handleAnonymousVotesChanged);
      socketService.offTaskCreated(handleTaskCreated);
      socketService.offTaskDeleted(handleTaskDeleted);
      socketService.offTaskSelected(handleTaskSelected);
      socketService.offEstimateUpdated(handleEstimateUpdated);
      socketService.offEstimatesRevealed(handleEstimatesRevealed);
      socketService.offEstimatesHidden(handleEstimatesHidden);
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
    addParticipant,
    removeParticipant,
    updateParticipantEstimate,
    updateParticipantRole,
    updateParticipantName,
    updateCardSet,
    updateAnonymousVotes,
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
          anonymousVotes: response.anonymousVotes,
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
          anonymousVotes: response.anonymousVotes,
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

  const hideEstimates = useCallback((payload: Parameters<typeof socketService.hideEstimates>[0]) => {
    socketService.hideEstimates(payload);
  }, []);

  const resetEstimates = useCallback((payload: Parameters<typeof socketService.resetEstimates>[0]) => {
    socketService.resetEstimates(payload);
  }, []);

  const previewFinalEstimate = useCallback((payload: Parameters<typeof socketService.previewFinalEstimate>[0]) => {
    socketService.previewFinalEstimate(payload);
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
    hideEstimates,
    resetEstimates,
    previewFinalEstimate,
    setFinalEstimate,
  };
}

