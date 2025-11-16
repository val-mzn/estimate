import prisma from '../db/prisma.js';
import { Participant, ParticipantRole } from '../types.js';

export async function createParticipant(
  id: string,
  socketId: string,
  name: string,
  role: ParticipantRole,
  roomCode: string,
  participationMode?: 'participant' | 'spectator'
): Promise<Participant> {
  const participant = await prisma.participant.create({
    data: {
      id,
      socketId,
      name,
      role,
      roomCode,
      participationMode
    }
  });

  return {
    id: participant.id,
    socketId: participant.socketId,
    name: participant.name,
    role: participant.role as ParticipantRole,
    currentEstimate: participant.currentEstimate,
    joinedAt: participant.joinedAt,
    participationMode: participant.participationMode as 'participant' | 'spectator' | undefined
  };
}

export async function getParticipantById(id: string): Promise<Participant | null> {
  const participant = await prisma.participant.findUnique({
    where: { id }
  });

  if (!participant) return null;

  return {
    id: participant.id,
    socketId: participant.socketId,
    name: participant.name,
    role: participant.role as ParticipantRole,
    currentEstimate: participant.currentEstimate,
    joinedAt: participant.joinedAt,
    participationMode: participant.participationMode as 'participant' | 'spectator' | undefined
  };
}

export async function getParticipantBySocketId(socketId: string): Promise<(Participant & { roomCode: string }) | null> {
  const participant = await prisma.participant.findFirst({
    where: { socketId }
  });

  if (!participant) return null;

  return {
    id: participant.id,
    socketId: participant.socketId,
    name: participant.name,
    role: participant.role as ParticipantRole,
    currentEstimate: participant.currentEstimate,
    joinedAt: participant.joinedAt,
    participationMode: participant.participationMode as 'participant' | 'spectator' | undefined,
    roomCode: participant.roomCode
  };
}

export async function updateParticipant(
  id: string,
  data: {
    socketId?: string;
    currentEstimate?: string | null;
  }
): Promise<void> {
  await prisma.participant.update({
    where: { id },
    data: {
      socketId: data.socketId !== undefined ? data.socketId : undefined,
      currentEstimate: data.currentEstimate !== undefined ? data.currentEstimate : undefined
    }
  });
}

export async function updateParticipantRole(
  id: string,
  role: 'participant' | 'spectator' | 'manager',
  participationMode?: 'participant' | 'spectator'
): Promise<Participant> {
  // Construire l'objet de mise à jour dynamiquement
  const updateData: { role: string; participationMode?: 'participant' | 'spectator' | null } = { role };
  
  // Ne mettre à jour participationMode que s'il est explicitement fourni
  // Si participationMode est undefined, ne pas l'inclure dans l'update pour préserver la valeur existante
  if (participationMode !== undefined) {
    updateData.participationMode = participationMode;
  }
  
  const participant = await prisma.participant.update({
    where: { id },
    data: updateData
  });

  return {
    id: participant.id,
    socketId: participant.socketId,
    name: participant.name,
    role: participant.role as ParticipantRole,
    currentEstimate: participant.currentEstimate,
    joinedAt: participant.joinedAt,
    participationMode: participant.participationMode as 'participant' | 'spectator' | undefined
  };
}

export async function updateParticipantName(
  id: string,
  name: string
): Promise<Participant> {
  const participant = await prisma.participant.update({
    where: { id },
    data: { name }
  });

  return {
    id: participant.id,
    socketId: participant.socketId,
    name: participant.name,
    role: participant.role as ParticipantRole,
    currentEstimate: participant.currentEstimate,
    joinedAt: participant.joinedAt,
    participationMode: participant.participationMode as 'participant' | 'spectator' | undefined
  };
}

export async function updateParticipantsCurrentEstimate(
  roomCode: string,
  currentEstimate: string | null
): Promise<void> {
  await prisma.participant.updateMany({
    where: { roomCode },
    data: { currentEstimate }
  });
}

export async function deleteParticipant(id: string): Promise<void> {
  await prisma.participant.delete({
    where: { id }
  });
}

export async function deleteParticipantEstimates(participantId: string): Promise<void> {
  await prisma.estimate.deleteMany({
    where: { participantId }
  });
}

