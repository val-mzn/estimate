export type ParticipantRole = 'participant' | 'spectator' | 'manager';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  currentEstimate: string | null;
  participationMode?: 'participant' | 'spectator'; // Pour les managers uniquement
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  finalEstimate: number | '?' | null;
}

export interface TaskWithEstimates extends Task {
  estimates: Record<string, string>;
}

export interface Room {
  code: string;
  name: string;
  cardSet: string[];
  participants: Participant[];
  tasks: Task[];
  currentTaskId: string | null;
  isRevealed: boolean;
  anonymousVotes: boolean;
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

export interface SetFinalEstimatePayload {
  roomCode: string;
  taskId: string;
  finalEstimate: number | '?' | null;
}

export interface PreviewFinalEstimatePayload {
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
  participants: Participant[];
  tasks: Task[];
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
  task: Task;
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
  participants: Participant[];
  average: number | null;
}

export interface EstimatesHiddenResponse {
  participants: Participant[];
}

export interface EstimatesResetResponse {
  participants: Participant[];
}

export interface ErrorResponse {
  message: string;
}

