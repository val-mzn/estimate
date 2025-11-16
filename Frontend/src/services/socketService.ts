import { io, Socket } from 'socket.io-client';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  RemoveParticipantPayload,
  ChangeParticipantRolePayload,
  ChangeParticipantNamePayload,
  ChangeOwnNamePayload,
  ChangeCardSetPayload,
  ChangeAnonymousVotesPayload,
  TransferManagerRolePayload,
  CreateTaskPayload,
  DeleteTaskPayload,
  SelectTaskPayload,
  EstimateTaskPayload,
  RevealEstimatesPayload,
  HideEstimatesPayload,
  ResetEstimatesPayload,
  SetFinalEstimatePayload,
  PreviewFinalEstimatePayload,
  RoomCreatedResponse,
  RoomJoinedResponse,
  ParticipantJoinedResponse,
  ParticipantLeftResponse,
  ParticipantRoleChangedResponse,
  ParticipantNameChangedResponse,
  CardSetChangedResponse,
  AnonymousVotesChangedResponse,
  TaskCreatedResponse,
  TaskDeletedResponse,
  TaskSelectedResponse,
  EstimateUpdatedResponse,
  EstimatesRevealedResponse,
  EstimatesHiddenResponse,
  EstimatesResetResponse,
  FinalEstimateUpdatedResponse,
  ErrorResponse,
} from '../types';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_API_URL || 'http://localhost';
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Room events
  createRoom(payload: CreateRoomPayload, callback: (response: RoomCreatedResponse) => void): void {
    this.socket?.emit('create-room', payload);
    this.socket?.once('room-created', callback);
  }

  joinRoom(payload: JoinRoomPayload, callback: (response: RoomJoinedResponse) => void): void {
    this.socket?.emit('join-room', payload);
    this.socket?.once('room-joined', callback);
  }

  onParticipantJoined(callback: (response: ParticipantJoinedResponse) => void): void {
    this.socket?.on('participant-joined', callback);
  }

  offParticipantJoined(callback: (response: ParticipantJoinedResponse) => void): void {
    this.socket?.off('participant-joined', callback);
  }

  onParticipantLeft(callback: (response: ParticipantLeftResponse) => void): void {
    this.socket?.on('participant-left', callback);
  }

  offParticipantLeft(callback: (response: ParticipantLeftResponse) => void): void {
    this.socket?.off('participant-left', callback);
  }

  removeParticipant(payload: RemoveParticipantPayload): void {
    this.socket?.emit('remove-participant', payload);
  }

  changeParticipantRole(payload: ChangeParticipantRolePayload): void {
    this.socket?.emit('change-participant-role', payload);
  }

  onParticipantRoleChanged(callback: (response: ParticipantRoleChangedResponse) => void): void {
    this.socket?.on('participant-role-changed', callback);
  }

  offParticipantRoleChanged(callback: (response: ParticipantRoleChangedResponse) => void): void {
    this.socket?.off('participant-role-changed', callback);
  }

  changeParticipantName(payload: ChangeParticipantNamePayload): void {
    this.socket?.emit('change-participant-name', payload);
  }

  changeOwnName(payload: ChangeOwnNamePayload): void {
    this.socket?.emit('change-own-name', payload);
  }

  changeCardSet(payload: ChangeCardSetPayload): void {
    this.socket?.emit('change-card-set', payload);
  }

  onCardSetChanged(callback: (response: CardSetChangedResponse) => void): void {
    this.socket?.on('card-set-changed', callback);
  }

  offCardSetChanged(callback: (response: CardSetChangedResponse) => void): void {
    this.socket?.off('card-set-changed', callback);
  }

  changeAnonymousVotes(payload: ChangeAnonymousVotesPayload): void {
    this.socket?.emit('change-anonymous-votes', payload);
  }

  onAnonymousVotesChanged(callback: (response: AnonymousVotesChangedResponse) => void): void {
    this.socket?.on('anonymous-votes-changed', callback);
  }

  offAnonymousVotesChanged(callback: (response: AnonymousVotesChangedResponse) => void): void {
    this.socket?.off('anonymous-votes-changed', callback);
  }

  transferManagerRole(payload: TransferManagerRolePayload): void {
    this.socket?.emit('transfer-manager-role', payload);
  }

  onParticipantNameChanged(callback: (response: ParticipantNameChangedResponse) => void): void {
    this.socket?.on('participant-name-changed', callback);
  }

  offParticipantNameChanged(callback: (response: ParticipantNameChangedResponse) => void): void {
    this.socket?.off('participant-name-changed', callback);
  }

  onKicked(callback: (response: { message: string }) => void): void {
    this.socket?.on('kicked', callback);
  }

  offKicked(callback: (response: { message: string }) => void): void {
    this.socket?.off('kicked', callback);
  }

  // Task events
  createTask(payload: CreateTaskPayload): void {
    this.socket?.emit('create-task', payload);
  }

  onTaskCreated(callback: (response: TaskCreatedResponse) => void): void {
    this.socket?.on('task-created', callback);
  }

  offTaskCreated(callback: (response: TaskCreatedResponse) => void): void {
    this.socket?.off('task-created', callback);
  }

  deleteTask(payload: DeleteTaskPayload): void {
    this.socket?.emit('delete-task', payload);
  }

  onTaskDeleted(callback: (response: TaskDeletedResponse) => void): void {
    this.socket?.on('task-deleted', callback);
  }

  offTaskDeleted(callback: (response: TaskDeletedResponse) => void): void {
    this.socket?.off('task-deleted', callback);
  }

  selectTask(payload: SelectTaskPayload): void {
    this.socket?.emit('select-task', payload);
  }

  onTaskSelected(callback: (response: TaskSelectedResponse) => void): void {
    this.socket?.on('task-selected', callback);
  }

  offTaskSelected(callback: (response: TaskSelectedResponse) => void): void {
    this.socket?.off('task-selected', callback);
  }

  // Estimate events
  estimateTask(payload: EstimateTaskPayload): void {
    this.socket?.emit('estimate-task', payload);
  }

  onEstimateUpdated(callback: (response: EstimateUpdatedResponse) => void): void {
    this.socket?.on('estimate-updated', callback);
  }

  offEstimateUpdated(callback: (response: EstimateUpdatedResponse) => void): void {
    this.socket?.off('estimate-updated', callback);
  }

  revealEstimates(payload: RevealEstimatesPayload): void {
    this.socket?.emit('reveal-estimates', payload);
  }

  onEstimatesRevealed(callback: (response: EstimatesRevealedResponse) => void): void {
    this.socket?.on('estimates-revealed', callback);
  }

  offEstimatesRevealed(callback: (response: EstimatesRevealedResponse) => void): void {
    this.socket?.off('estimates-revealed', callback);
  }

  hideEstimates(payload: HideEstimatesPayload): void {
    this.socket?.emit('hide-estimates', payload);
  }

  onEstimatesHidden(callback: (response: EstimatesHiddenResponse) => void): void {
    this.socket?.on('estimates-hidden', callback);
  }

  offEstimatesHidden(callback: (response: EstimatesHiddenResponse) => void): void {
    this.socket?.off('estimates-hidden', callback);
  }

  resetEstimates(payload: ResetEstimatesPayload): void {
    this.socket?.emit('reset-estimates', payload);
  }

  onEstimatesReset(callback: (response: EstimatesResetResponse) => void): void {
    this.socket?.on('estimates-reset', callback);
  }

  offEstimatesReset(callback: (response: EstimatesResetResponse) => void): void {
    this.socket?.off('estimates-reset', callback);
  }

  previewFinalEstimate(payload: PreviewFinalEstimatePayload): void {
    this.socket?.emit('preview-final-estimate', payload);
  }

  setFinalEstimate(payload: SetFinalEstimatePayload): void {
    this.socket?.emit('set-final-estimate', payload);
  }

  onFinalEstimateUpdated(callback: (response: FinalEstimateUpdatedResponse) => void): void {
    this.socket?.on('final-estimate-updated', callback);
  }

  offFinalEstimateUpdated(callback: (response: FinalEstimateUpdatedResponse) => void): void {
    this.socket?.off('final-estimate-updated', callback);
  }

  // Error handling
  onError(callback: (response: ErrorResponse) => void): void {
    this.socket?.on('error', callback);
  }

  offError(callback: (response: ErrorResponse) => void): void {
    this.socket?.off('error', callback);
  }

  // Connection events
  onConnect(callback: () => void): void {
    this.socket?.on('connect', callback);
  }

  offConnect(callback: () => void): void {
    this.socket?.off('connect', callback);
  }

  onDisconnect(callback: () => void): void {
    this.socket?.on('disconnect', callback);
  }

  offDisconnect(callback: () => void): void {
    this.socket?.off('disconnect', callback);
  }
}

export const socketService = new SocketService();

