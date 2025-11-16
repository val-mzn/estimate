import prisma from '../db/prisma.js';
import { Room, Participant, Task } from '../types.js';
import { ParticipantRole } from '../types.js';

export async function getRoom(roomCode: string): Promise<Room | null> {
  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: {
      participants: true,
      tasks: {
        include: {
          estimates: true
        }
      }
    }
  });

  if (!room) return null;

  const participantsMap = new Map<string, Participant>();
  for (const p of room.participants) {
    participantsMap.set(p.id, {
      id: p.id,
      socketId: p.socketId,
      name: p.name,
      role: p.role as ParticipantRole,
      currentEstimate: p.currentEstimate,
      joinedAt: p.joinedAt,
      participationMode: p.participationMode as 'participant' | 'spectator' | undefined
    });
  }

  const tasksMap = new Map<string, Task>();
  for (const t of room.tasks) {
    const estimatesMap = new Map<string, string>();
    for (const e of t.estimates) {
      estimatesMap.set(e.participantId, e.estimate);
    }
    tasksMap.set(t.id, {
      id: t.id,
      title: t.title,
      description: t.description,
      createdAt: t.createdAt,
      estimates: estimatesMap,
      finalEstimate: t.finalEstimate ? (t.finalEstimate === '?' ? '?' : Number(t.finalEstimate)) : null
    });
  }

  return {
    code: room.code,
    name: room.name,
    cardSet: room.cardSet.split(',').map(c => c.trim()),
    participants: participantsMap,
    tasks: tasksMap,
    currentTaskId: room.currentTaskId,
    isRevealed: room.isRevealed,
    createdAt: room.createdAt
  };
}

export async function createRoom(
  roomCode: string,
  roomName: string,
  cardSet: string[]
): Promise<void> {
  await prisma.room.create({
    data: {
      code: roomCode,
      name: roomName,
      cardSet: cardSet.join(','),
      isRevealed: false
    }
  });
}

export async function updateRoom(
  roomCode: string,
  data: {
    currentTaskId?: string | null;
    isRevealed?: boolean;
  }
): Promise<void> {
  await prisma.room.update({
    where: { code: roomCode },
    data: {
      currentTaskId: data.currentTaskId !== undefined ? data.currentTaskId : undefined,
      isRevealed: data.isRevealed !== undefined ? data.isRevealed : undefined
    }
  });
}

export async function deleteRoom(roomCode: string): Promise<void> {
  await prisma.room.delete({
    where: { code: roomCode }
  });
}

