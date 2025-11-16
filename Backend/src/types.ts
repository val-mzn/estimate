export type ParticipantRole = 'participant' | 'spectator' | 'manager';

export interface Participant {
  id: string;
  socketId: string;
  name: string;
  role: ParticipantRole;
  currentEstimate: string | null;
  joinedAt: Date;
  participationMode?: 'participant' | 'spectator'; // Pour les managers uniquement
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  estimates: Map<string, string>;
  finalEstimate: number | '?' | null;
}

export interface Room {
  code: string;
  name: string;
  cardSet: string[];
  participants: Map<string, Participant>;
  tasks: Map<string, Task>;
  currentTaskId: string | null;
  isRevealed: boolean;
  anonymousVotes: boolean;
  createdAt: Date;
}

export interface CreateRoomPayload {
  roomName: string;
  userName: string;
  cardSet: string;
  role: 'participant' | 'spectator';
  anonymousVotes?: boolean;
}

export interface JoinRoomPayload {
  roomCode: string;
  userName: string;
  role: 'participant' | 'spectator';
}

export interface RemoveParticipantPayload {
  roomCode: string;
  participantId: string;
}

export interface ChangeParticipantRolePayload {
  roomCode: string;
  participantId: string;
  role: 'participant' | 'spectator';
}

export interface ChangeParticipantNamePayload {
  roomCode: string;
  participantId: string;
  name: string;
}

export interface ChangeOwnNamePayload {
  roomCode: string;
  name: string;
}

export interface ChangeCardSetPayload {
  roomCode: string;
  cardSet: string;
}

export interface ChangeAnonymousVotesPayload {
  roomCode: string;
  anonymousVotes: boolean;
}

export interface TransferManagerRolePayload {
  roomCode: string;
  participantId: string;
}

export interface CreateTaskPayload {
  roomCode: string;
  title: string;
  description?: string;
}

export interface DeleteTaskPayload {
  roomCode: string;
  taskId: string;
}

export interface SelectTaskPayload {
  roomCode: string;
  taskId: string | null;
}

export interface EstimateTaskPayload {
  roomCode: string;
  taskId: string;
  estimate: string;
}

export interface RevealEstimatesPayload {
  roomCode: string;
}

export interface HideEstimatesPayload {
  roomCode: string;
}

export interface ResetEstimatesPayload {
  roomCode: string;
}

export interface PreviewFinalEstimatePayload {
  roomCode: string;
  taskId: string;
  finalEstimate: number | '?' | null;
}

export interface SetFinalEstimatePayload {
  roomCode: string;
  taskId: string;
  finalEstimate: number | '?' | null;
}

export interface FinalEstimateUpdatedResponse {
  taskId: string;
  finalEstimate: number | '?' | null;
}

export interface RoomCreatedResponse {
  roomCode: string;
  roomName: string;
  cardSet: string[];
  anonymousVotes: boolean;
  participant: {
    id: string;
    name: string;
    role: ParticipantRole;
    participationMode?: 'participant' | 'spectator';
  };
}

export interface RoomJoinedResponse {
  roomCode: string;
  roomName: string;
  cardSet: string[];
  anonymousVotes: boolean;
  participant: {
    id: string;
    name: string;
    role: ParticipantRole;
    participationMode?: 'participant' | 'spectator';
  };
  participants: Array<{
    id: string;
    name: string;
    role: ParticipantRole;
    currentEstimate: string | null;
    participationMode?: 'participant' | 'spectator';
  }>;
  tasks: SerializableTask[];
  currentTaskId: string | null;
  isRevealed: boolean;
}

export interface ParticipantJoinedResponse {
  participant: {
    id: string;
    name: string;
    role: ParticipantRole;
    participationMode?: 'participant' | 'spectator';
  };
}

export interface ParticipantLeftResponse {
  participantId: string;
}

export interface ParticipantRoleChangedResponse {
  participant: {
    id: string;
    name: string;
    role: ParticipantRole;
    currentEstimate: string | null;
    participationMode?: 'participant' | 'spectator';
  };
}

export interface ParticipantNameChangedResponse {
  participant: {
    id: string;
    name: string;
    role: ParticipantRole;
    currentEstimate: string | null;
    participationMode?: 'participant' | 'spectator';
  };
}

export interface CardSetChangedResponse {
  cardSet: string[];
}

export interface AnonymousVotesChangedResponse {
  anonymousVotes: boolean;
}

export interface TaskCreatedResponse {
  task: SerializableTask;
  currentTaskId: string | null;
}

export interface TaskDeletedResponse {
  taskId: string;
  currentTaskId: string | null;
}

export interface TaskSelectedResponse {
  taskId: string | null;
  isRevealed: boolean;
}

export interface EstimateUpdatedResponse {
  participantId: string;
  estimate: string | null;
  taskId: string;
}

export interface EstimatesRevealedResponse {
  participants: Array<{
    id: string;
    name: string;
    role: ParticipantRole;
    currentEstimate: string | null;
    participationMode?: 'participant' | 'spectator';
  }>;
  average: number | null;
}

export interface EstimatesHiddenResponse {
  participants: Array<{
    id: string;
    name: string;
    role: ParticipantRole;
    currentEstimate: string | null;
    participationMode?: 'participant' | 'spectator';
  }>;
}

export interface EstimatesResetResponse {
  participants: Array<{
    id: string;
    name: string;
    role: ParticipantRole;
    currentEstimate: null;
    participationMode?: 'participant' | 'spectator';
  }>;
}

export interface ErrorResponse {
  message: string;
}

// Types sérialisables pour les réponses Socket.IO
export interface SerializableTask {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  finalEstimate: number | '?' | null;
}

export interface SerializableTaskWithEstimates extends SerializableTask {
  estimates: Record<string, string>;
}

