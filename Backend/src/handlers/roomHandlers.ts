import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  RemoveParticipantPayload,
  RoomCreatedResponse,
  RoomJoinedResponse,
  ParticipantJoinedResponse,
  ParticipantLeftResponse,
  ErrorResponse
} from '../types.js';
import { rooms } from '../store/rooms.js';
import { generateRoomCode, createRoom, serializeTask } from '../utils/roomUtils.js';
import { createParticipant } from '../utils/participantUtils.js';
import logger from '../utils/logger.js';

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on('create-room', (payload: CreateRoomPayload) => {
    try {
      const { roomName, userName, cardSet, role } = payload;
      const roomCode = generateRoomCode();
      const userId = socket.id;
      
      const room = createRoom(roomCode, roomName, userId, userName, cardSet);
      const participant = createParticipant(socket.id, userName, 'creator', userId);
      participant.participationMode = role;
      
      room.participants.set(userId, participant);
      rooms.set(roomCode, room);
      
      socket.join(roomCode);
      
      const response: RoomCreatedResponse = {
        roomCode,
        roomName,
        cardSet: room.cardSet,
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

  socket.on('join-room', (payload: JoinRoomPayload) => {
    try {
      const { roomCode, userName, role } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const userId = socket.id;
      const participant = createParticipant(socket.id, userName, role, userId);
      
      room.participants.set(userId, participant);
      socket.join(roomCode);
      
      const response: RoomJoinedResponse = {
        roomCode: room.code,
        roomName: room.name,
        cardSet: room.cardSet,
        participant: {
          id: participant.id,
          name: participant.name,
          role: participant.role
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

  socket.on('remove-participant', (payload: RemoveParticipantPayload) => {
    try {
      const { roomCode, participantId } = payload;
      const room = rooms.get(roomCode);
      
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

      room.participants.delete(participantId);
      
      room.tasks.forEach(task => {
        task.estimates.delete(participantId);
      });
      
      const participantSocket = io.sockets.sockets.get(participantToRemove.socketId);
      if (participantSocket) {
        participantSocket.leave(roomCode);
      }
      
      const response: ParticipantLeftResponse = {
        participantId: participantId
      };
      
      io.to(participantToRemove.socketId).emit('kicked', { message: 'Vous avez été retiré de la salle par le créateur' });
      io.to(roomCode).emit('participant-left', response);
      
      if (room.participants.size === 0) {
        rooms.delete(roomCode);
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
}

