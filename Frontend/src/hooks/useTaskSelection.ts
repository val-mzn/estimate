import { useState, useCallback } from 'react';
import type { Room, Task } from '../types';
import { hasParticipantEstimated } from '../utils/roomUtils';
import { calculateRecommendedEstimate, getEstimatesFromParticipants } from '../utils/estimateUtils';

interface UseTaskSelectionParams {
  room: Room | null;
  roomCode: string | undefined;
  isCreator: boolean;
  selectTask: (payload: { roomCode: string; taskId: string | null }) => void;
  setFinalEstimate: (payload: { roomCode: string; taskId: string; finalEstimate: number | '?' | null }) => void;
}

export function useTaskSelection({
  room,
  roomCode,
  isCreator,
  selectTask,
  setFinalEstimate,
}: UseTaskSelectionParams) {
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const performTaskSelection = useCallback((taskId: string | null) => {
    if (!roomCode || !room) return;
    
    if (taskId === null) {
      selectTask({ roomCode, taskId: null });
      return;
    }

    // La sauvegarde automatique de l'estimation finale a été désactivée
    // L'estimation finale doit être sauvegardée manuellement via le bouton "Sauvegarder"
    
    selectTask({ roomCode, taskId });
  }, [roomCode, selectTask]);

  const handleSelectTask = useCallback((taskId: string) => {
    if (!room) return;
    
    if (room.currentTaskId === taskId) {
      performTaskSelection(null);
      return;
    }

    const targetTask = room.tasks.find((t) => t.id === taskId) as Task | undefined;
    if (!targetTask) {
      performTaskSelection(taskId);
      return;
    }

    // Vérifier si la fiche cible est déjà estimée
    const taskFinalEstimate = (targetTask as any).finalEstimate as number | '?' | null;
    const isTaskAlreadyEstimatedValue = taskFinalEstimate !== null;

    // Vérifier si la fiche courante a déjà une estimation finale
    const currentTask = room.currentTaskId ? room.tasks.find((t) => t.id === room.currentTaskId) : null;
    const currentTaskHasFinalEstimate = currentTask ? (currentTask as any).finalEstimate !== null : false;

    // Les warnings ne s'appliquent qu'au créateur
    if (isCreator) {
      // Afficher le warning uniquement si on veut réestimer une fiche déjà estimée
      if (isTaskAlreadyEstimatedValue) {
        setWarningModal({
          isOpen: true,
          title: 'Réestimer une fiche',
          message: 'Cette fiche a déjà été estimée. Voulez-vous vraiment la réestimer ?',
          onConfirm: () => {
            // Supprimer l'estimation finale de la fiche avant de la sélectionner
            if (roomCode) {
              setFinalEstimate({
                roomCode,
                taskId,
                finalEstimate: null,
              });
            }
            performTaskSelection(taskId);
          },
        });
        return;
      }

      // Ne pas permettre le changement de fiche si au moins un participant a estimé la fiche
      // SAUF si la tâche courante a déjà une estimation finale
      if (!currentTaskHasFinalEstimate) {
        const hasParticipantEstimatedValue = hasParticipantEstimated(room.participants);
        if (hasParticipantEstimatedValue) {
          setWarningModal({
            isOpen: true,
            title: 'Changer de fiche',
            message: 'Au moins un participant a estimé la fiche. Voulez-vous vraiment changer de fiche ?',
            onConfirm: () => {
              performTaskSelection(taskId);
            },
          });
          return;
        }
      }
    }

    // Pour les participants, permettre la sélection sans warning
    performTaskSelection(taskId);
  }, [room, roomCode, isCreator, setFinalEstimate, performTaskSelection]);

  const closeWarningModal = useCallback(() => {
    setWarningModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    handleSelectTask,
    warningModal,
    closeWarningModal,
  };
}

