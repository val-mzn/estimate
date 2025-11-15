import { Participant, ParticipantRole } from '../types.js';

export function createParticipant(
  socketId: string,
  name: string,
  role: ParticipantRole,
  userId?: string
): Participant {
  return {
    id: userId || socketId,
    socketId,
    name,
    role,
    currentEstimate: null,
    joinedAt: new Date()
  };
}

