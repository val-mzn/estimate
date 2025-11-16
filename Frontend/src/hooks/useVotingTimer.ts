import { useEffect, useState, useRef } from 'react';

export function useVotingTimer(
  currentTaskId: string | null,
  _currentUserEstimate: string | null,
  isRevealed: boolean
) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const taskIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Réinitialiser quand on change de tâche
    if (taskIdRef.current !== currentTaskId) {
      taskIdRef.current = currentTaskId;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedTime(0);
      startTimeRef.current = null;
      hasStartedRef.current = false;
    }

    // Arrêter le timer si on révèle ou s'il n'y a pas de tâche
    if (!currentTaskId || isRevealed) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Démarrer le timer dès la sélection de la fiche
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentTaskId, isRevealed]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    isRunning: hasStartedRef.current && !isRevealed && currentTaskId !== null,
  };
}

