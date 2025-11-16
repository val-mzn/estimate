import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  RemoveParticipantPayload,
  ChangeParticipantRolePayload,
  RoomCreatedResponse,
  RoomJoinedResponse,
  ParticipantJoinedResponse,
  ParticipantLeftResponse,
  ParticipantRoleChangedResponse,
  ErrorResponse
} from '../types.js';
import { generateRoomCode, serializeTask } from '../utils/roomUtils.js';
import * as roomService from '../services/roomService.js';
import * as participantService from '../services/participantService.js';
import logger from '../utils/logger.js';

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on('create-room', async (payload: CreateRoomPayload) => {
    try {
      const { roomName, userName, cardSet, role } = payload;
      const roomCode = generateRoomCode();
      const userId = socket.id;
      
      await roomService.createRoom(roomCode, roomName, cardSet.split(',').map(c => c.trim()));
      const participant = await participantService.createParticipant(
        userId,
        socket.id,
        userName,
        'creator',
        roomCode,
        role
      );
      
      socket.join(roomCode);
      
      const response: RoomCreatedResponse = {
        roomCode,
        roomName,
        cardSet: cardSet.split(',').map(c => c.trim()),
        participant: {
          id: participant.id,
          name: participant.name,
          role: participant.role,
          participationMode: participant.participationMode
        }
      };
      
      socket.emit('room-created', response);
      
      logger.info(`Room created: ${roomCode} by ${userName}`, { roomCode, userName });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la création de la room' };
      socket.emit('error', errorResponse);
      logger.error('Error creating room', { error, socketId: socket.id });
    }
  });

  socket.on('join-room', async (payload: JoinRoomPayload) => {
    try {
      const { roomCode, userName, role } = payload;
      const initialRoom = await roomService.getRoom(roomCode);
      
      if (!initialRoom) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const userId = socket.id;
      const participant = await participantService.createParticipant(
        userId,
        socket.id,
        userName,
        role,
        roomCode
      );
      
      socket.join(roomCode);
      
      // Récupérer la room mise à jour avec le nouveau participant
      const room = await roomService.getRoom(roomCode);
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const response: RoomJoinedResponse = {
        roomCode: room.code,
        roomName: room.name,
        cardSet: room.cardSet,
        participant: {
          id: participant.id,
          name: participant.name,
          role: participant.role,
          participationMode: participant.participationMode
        },
        participants: Array.from(room.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          currentEstimate: p.currentEstimate,
          participationMode: p.participationMode
        })),
        tasks: Array.from(room.tasks.values()).map(serializeTask),
        currentTaskId: room.currentTaskId,
        isRevealed: room.isRevealed
      };
      
      socket.emit('room-joined', response);
      
      const participantResponse: ParticipantJoinedResponse = {
        participant: {
          id: participant.id,
          name: participant.name,
          role: participant.role,
          participationMode: participant.participationMode
        }
      };
      
      socket.to(roomCode).emit('participant-joined', participantResponse);
      
      logger.info(`User ${userName} joined room ${roomCode}`, { roomCode, userName, socketId: socket.id });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la connexion à la room' };
      socket.emit('error', errorResponse);
      logger.error('Error joining room', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('remove-participant', async (payload: RemoveParticipantPayload) => {
    try {
      const { roomCode, participantId } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      const requester = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!requester || requester.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut retirer des participants' };
        socket.emit('error', errorResponse);
        return;
      }

      const participantToRemove = room.participants.get(participantId);
      
      if (!participantToRemove) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      if (participantToRemove.role === 'creator') {
        const errorResponse: ErrorResponse = { message: 'Le créateur ne peut pas être retiré' };
        socket.emit('error', errorResponse);
        return;
      }

      await participantService.deleteParticipantEstimates(participantId);
      await participantService.deleteParticipant(participantId);
      
      const participantSocket = io.sockets.sockets.get(participantToRemove.socketId);
      if (participantSocket) {
        participantSocket.leave(roomCode);
      }
      
      const response: ParticipantLeftResponse = {
        participantId: participantId
      };
      
      io.to(participantToRemove.socketId).emit('kicked', { message: 'Vous avez été retiré de la salle par le créateur' });
      io.to(roomCode).emit('participant-left', response);
      
      const updatedRoom = await roomService.getRoom(roomCode);
      if (updatedRoom && updatedRoom.participants.size === 0) {
        await roomService.deleteRoom(roomCode);
        logger.info(`Room deleted (empty): ${roomCode}`, { roomCode });
      }
      
      logger.info(`Participant ${participantToRemove.name} removed from room ${roomCode} by ${requester.name}`, { 
        roomCode, 
        removedParticipant: participantToRemove.name, 
        requester: requester.name 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la suppression du participant' };
      socket.emit('error', errorResponse);
      logger.error('Error removing participant', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('change-participant-role', async (payload: ChangeParticipantRolePayload) => {
    try {
      const { roomCode, participantId, role } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      const requester = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!requester || requester.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut changer le rôle des participants' };
        socket.emit('error', errorResponse);
        return;
      }

      const participantToChange = room.participants.get(participantId);
      
      if (!participantToChange) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      if (participantToChange.role === 'creator') {
        const errorResponse: ErrorResponse = { message: 'Le rôle du créateur ne peut pas être modifié' };
        socket.emit('error', errorResponse);
        return;
      }

      const updatedParticipant = await participantService.updateParticipantRole(participantId, role);
      
      const response: ParticipantRoleChangedResponse = {
        participant: {
          id: updatedParticipant.id,
          name: updatedParticipant.name,
          role: updatedParticipant.role,
          currentEstimate: updatedParticipant.currentEstimate,
          participationMode: updatedParticipant.participationMode
        }
      };
      
      io.to(roomCode).emit('participant-role-changed', response);
      
      logger.info(`Participant ${updatedParticipant.name} role changed to ${role} in room ${roomCode} by ${requester.name}`, { 
        roomCode, 
        participant: updatedParticipant.name, 
        newRole: role,
        requester: requester.name 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors du changement de rôle du participant' };
      socket.emit('error', errorResponse);
      logger.error('Error changing participant role', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });
}

