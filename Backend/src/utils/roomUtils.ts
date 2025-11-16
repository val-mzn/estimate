import { Room, SerializableTask, Task, Participant } from '../types.js';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createRoom(
  roomCode: string,
  roomName: string,
  creatorId: string,
  creatorName: string,
  cardSet: string,
  anonymousVotes: boolean = false
): Room {
  return {
    code: roomCode,
    name: roomName,
    cardSet: cardSet.split(',').map(c => c.trim()),
    participants: new Map<string, Participant>(),
    tasks: new Map<string, Task>(),
    currentTaskId: null,
    isRevealed: false,
    anonymousVotes,
    createdAt: new Date()
  };
}

export function serializeTask(task: Task): SerializableTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: task.createdAt.toISOString(),
    finalEstimate: task.finalEstimate
  };
}

