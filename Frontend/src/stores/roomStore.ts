import { create } from 'zustand';
import type { Room, Participant, Task } from '../types';

interface RoomState {
  // Room data
  room: Room | null;
  currentUser: Participant | null;
  
  // Connection state
  isConnected: boolean;
  error: string | null;
  
  // Actions
  setRoom: (room: Room) => void;
  setCurrentUser: (user: Participant) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  
  // Room actions
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipantEstimate: (participantId: string, estimate: string | null) => void;
  
  // Task actions
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setCurrentTask: (taskId: string | null) => void;
  updateTaskFinalEstimate: (taskId: string, finalEstimate: number | '?' | null) => void;
  
  // Estimate actions
  setRevealed: (revealed: boolean) => void;
  resetEstimates: () => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  room: null,
  currentUser: null,
  isConnected: false,
  error: null,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,
  
  setRoom: (room) => set({ room }),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  setError: (error) => set({ error }),
  
  addParticipant: (participant) =>
    set((state) => {
      if (!state.room) return state;
      const participants = [...state.room.participants, participant];
      return {
        room: { ...state.room, participants },
      };
    }),
  
  removeParticipant: (participantId) =>
    set((state) => {
      if (!state.room) return state;
      const participants = state.room.participants.filter((p) => p.id !== participantId);
      return {
        room: { ...state.room, participants },
      };
    }),
  
  updateParticipantEstimate: (participantId, estimate) =>
    set((state) => {
      if (!state.room) return state;
      const participants = state.room.participants.map((p) =>
        p.id === participantId ? { ...p, currentEstimate: estimate } : p
      );
      return {
        room: { ...state.room, participants },
      };
    }),
  
  addTask: (task) =>
    set((state) => {
      if (!state.room) return state;
      const tasks = [...state.room.tasks, task];
      return {
        room: { ...state.room, tasks },
      };
    }),
  
  removeTask: (taskId) =>
    set((state) => {
      if (!state.room) return state;
      const room = state.room;
      const tasks = room.tasks.filter((t) => t.id !== taskId);
      const currentTaskId =
        room.currentTaskId === taskId
          ? tasks.length > 0
            ? tasks[0].id
            : null
          : room.currentTaskId;
      
      const participants = room.participants.map((p) => ({
        ...p,
        currentEstimate: room.currentTaskId === taskId ? null : p.currentEstimate,
      }));
      
      return {
        room: {
          ...room,
          tasks,
          currentTaskId,
          participants,
          isRevealed: room.currentTaskId === taskId ? false : room.isRevealed,
        },
      };
    }),
  
  setCurrentTask: (taskId) =>
    set((state) => {
      if (!state.room) return state;
      const participants = state.room.participants.map((p) => ({
        ...p,
        currentEstimate: null,
      }));
      return {
        room: {
          ...state.room,
          currentTaskId: taskId,
          participants,
          isRevealed: false,
        },
      };
    }),
  
  updateTaskFinalEstimate: (taskId, finalEstimate) =>
    set((state) => {
      if (!state.room) return state;
      const tasks = state.room.tasks.map((t) =>
        t.id === taskId ? { ...t, finalEstimate } : t
      );
      return {
        room: { ...state.room, tasks },
      };
    }),
  
  setRevealed: (revealed) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: { ...state.room, isRevealed: revealed },
      };
    }),
  
  resetEstimates: () =>
    set((state) => {
      if (!state.room) return state;
      const participants = state.room.participants.map((p) => ({
        ...p,
        currentEstimate: null,
      }));
      return {
        room: {
          ...state.room,
          participants,
          isRevealed: false,
        },
      };
    }),
  
  reset: () => set(initialState),
}));

