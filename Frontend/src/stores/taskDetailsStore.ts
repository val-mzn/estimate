import { create } from 'zustand';
import type { Task } from '../types';

interface TaskDetailsState {
  // Computed values
  currentTask: Task | null;
  isManager: boolean;
  isParticipant: boolean;
  currentUserEstimate: string | null;
  numericCardSet: number[];
  estimatesForCurrentTask: number[];
  averageEstimate: number | null;
  medianEstimate: number | null;
  votedParticipants: number;
  totalParticipants: number;
  
  // Utility functions
  findClosestCardValue: (value: number) => number;
  getPreviousCardValue: (value: number) => number | null;
  getNextCardValue: (value: number) => number | null;
  
  // Actions handlers (will be set from RoomPage)
  onEstimate: ((value: string) => void) | null;
  onFinalEstimatePreview: ((value: number | '?' | null) => void) | null;
  onFinalEstimateChange: ((value: number | '?' | null) => void) | null;
  onReveal: (() => void) | null;
  onHide: (() => void) | null;
  onCloseTask: (() => void) | null;
  
  // Setters
  setOnEstimate: (handler: (value: string) => void) => void;
  setOnFinalEstimatePreview: (handler: (value: number | '?' | null) => void) => void;
  setOnFinalEstimateChange: (handler: (value: number | '?' | null) => void) => void;
  setOnReveal: (handler: () => void) => void;
  setOnHide: (handler: () => void) => void;
  setOnCloseTask: (handler: () => void) => void;
  updateTaskDetails: (details: Partial<Omit<TaskDetailsState, 'onEstimate' | 'onFinalEstimatePreview' | 'onFinalEstimateChange' | 'onReveal' | 'onHide' | 'onCloseTask' | 'setOnEstimate' | 'setOnFinalEstimatePreview' | 'setOnFinalEstimateChange' | 'setOnReveal' | 'setOnHide' | 'setOnCloseTask' | 'updateTaskDetails' | 'findClosestCardValue' | 'getPreviousCardValue' | 'getNextCardValue'>>) => void;
}

export const useTaskDetailsStore = create<TaskDetailsState>((set, get) => {
  // Initialize utility functions
  const findClosestCardValue = (value: number): number => {
    const { numericCardSet } = get();
    if (numericCardSet.length === 0) return value;
    let closest = numericCardSet[0];
    let minDiff = Math.abs(value - closest);
    for (const card of numericCardSet) {
      const diff = Math.abs(value - card);
      if (diff < minDiff) {
        minDiff = diff;
        closest = card;
      }
    }
    return closest;
  };

  const getNextCardValue = (value: number): number | null => {
    const { numericCardSet } = get();
    const index = numericCardSet.findIndex(card => card > value);
    return index !== -1 ? numericCardSet[index] : null;
  };

  const getPreviousCardValue = (value: number): number | null => {
    const { numericCardSet } = get();
    for (let i = numericCardSet.length - 1; i >= 0; i--) {
      if (numericCardSet[i] < value) {
        return numericCardSet[i];
      }
    }
    return null;
  };

  return {
    currentTask: null,
    isManager: false,
    isParticipant: false,
    currentUserEstimate: null,
    numericCardSet: [],
    estimatesForCurrentTask: [],
    averageEstimate: null,
    medianEstimate: null,
    votedParticipants: 0,
    totalParticipants: 0,
    findClosestCardValue,
    getPreviousCardValue,
    getNextCardValue,
    onEstimate: null,
    onFinalEstimatePreview: null,
    onFinalEstimateChange: null,
    onReveal: null,
    onHide: null,
    onCloseTask: null,
    setOnEstimate: (handler) => set({ onEstimate: handler }),
    setOnFinalEstimatePreview: (handler) => set({ onFinalEstimatePreview: handler }),
    setOnFinalEstimateChange: (handler) => set({ onFinalEstimateChange: handler }),
    setOnReveal: (handler) => set({ onReveal: handler }),
    setOnHide: (handler) => set({ onHide: handler }),
    setOnCloseTask: (handler) => set({ onCloseTask: handler }),
    updateTaskDetails: (details) => set(details),
  };
});

