import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  RemoveParticipantPayload,
  ChangeParticipantRolePayload,
  ChangeParticipantNamePayload,
  ChangeOwnNamePayload,
  ChangeCardSetPayload,
  ChangeAnonymousVotesPayload,
  TransferManagerRolePayload,
  RoomCreatedResponse,
  RoomJoinedResponse,
  ParticipantJoinedResponse,
  ParticipantLeftResponse,
  ParticipantRoleChangedResponse,
  ParticipantNameChangedResponse,
  CardSetChangedResponse,
  AnonymousVotesChangedResponse,
  ErrorResponse
} from '../types.js';
import { generateRoomCode, serializeTask } from '../utils/roomUtils.js';
import * as roomService from '../services/roomService.js';
import * as participantService from '../services/participantService.js';
import logger from '../utils/logger.js';

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on('create-room', async (payload: CreateRoomPayload) => {
    try {
      const { roomName, userName, cardSet, role, anonymousVotes = false } = payload;
      const roomCode = generateRoomCode();
      const userId = socket.id;
      
      await roomService.createRoom(roomCode, roomName, cardSet.split(',').map(c => c.trim()), anonymousVotes);
      const participant = await participantService.createParticipant(
        userId,
        socket.id,
        userName,
        'manager',
        roomCode,
        role
      );
      
      socket.join(roomCode);
      
      const response: RoomCreatedResponse = {
        roomCode,
        roomName,
        cardSet: cardSet.split(',').map(c => c.trim()),
        anonymousVotes,
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
        anonymousVotes: room.anonymousVotes,
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
      
      if (!requester || requester.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut retirer des participants' };
        socket.emit('error', errorResponse);
        return;
      }

      const participantToRemove = room.participants.get(participantId);
      
      if (!participantToRemove) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      if (participantToRemove.role === 'manager') {
        const errorResponse: ErrorResponse = { message: 'Le manager ne peut pas être retiré' };
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
      
      io.to(participantToRemove.socketId).emit('kicked', { message: 'Vous avez été retiré de la salle par le manager' });
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
      
      if (!requester || requester.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut changer le rôle des participants' };
        socket.emit('error', errorResponse);
        return;
      }

      const participantToChange = room.participants.get(participantId);
      
      if (!participantToChange) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      if (participantToChange.role === 'manager') {
        const errorResponse: ErrorResponse = { message: 'Le rôle du manager ne peut pas être modifié' };
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

  socket.on('change-participant-name', async (payload: ChangeParticipantNamePayload) => {
    try {
      const { roomCode, participantId, name } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      const requester = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!requester || requester.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut renommer les participants' };
        socket.emit('error', errorResponse);
        return;
      }

      const participantToRename = room.participants.get(participantId);
      
      if (!participantToRename) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      if (!name || name.trim().length === 0) {
        const errorResponse: ErrorResponse = { message: 'Le nom ne peut pas être vide' };
        socket.emit('error', errorResponse);
        return;
      }

      const updatedParticipant = await participantService.updateParticipantName(participantId, name.trim());
      
      const response: ParticipantNameChangedResponse = {
        participant: {
          id: updatedParticipant.id,
          name: updatedParticipant.name,
          role: updatedParticipant.role,
          currentEstimate: updatedParticipant.currentEstimate,
          participationMode: updatedParticipant.participationMode
        }
      };
      
      io.to(roomCode).emit('participant-name-changed', response);
      
      logger.info(`Participant ${participantToRename.name} renamed to ${updatedParticipant.name} in room ${roomCode} by ${requester.name}`, { 
        roomCode, 
        oldName: participantToRename.name,
        newName: updatedParticipant.name,
        requester: requester.name 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors du renommage du participant' };
      socket.emit('error', errorResponse);
      logger.error('Error changing participant name', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('change-own-name', async (payload: ChangeOwnNamePayload) => {
    try {
      const { roomCode, name } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      const requester = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!requester) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      if (!name || name.trim().length === 0) {
        const errorResponse: ErrorResponse = { message: 'Le nom ne peut pas être vide' };
        socket.emit('error', errorResponse);
        return;
      }

      const updatedParticipant = await participantService.updateParticipantName(requester.id, name.trim());
      
      const response: ParticipantNameChangedResponse = {
        participant: {
          id: updatedParticipant.id,
          name: updatedParticipant.name,
          role: updatedParticipant.role,
          currentEstimate: updatedParticipant.currentEstimate,
          participationMode: updatedParticipant.participationMode
        }
      };
      
      io.to(roomCode).emit('participant-name-changed', response);
      
      logger.info(`Participant ${requester.name} changed own name to ${updatedParticipant.name} in room ${roomCode}`, { 
        roomCode, 
        oldName: requester.name,
        newName: updatedParticipant.name
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors du changement de nom' };
      socket.emit('error', errorResponse);
      logger.error('Error changing own name', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('change-card-set', async (payload: ChangeCardSetPayload) => {
    try {
      const { roomCode, cardSet } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      const requester = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!requester || requester.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut changer le jeu de cartes' };
        socket.emit('error', errorResponse);
        return;
      }

      if (!cardSet || cardSet.trim().length === 0) {
        const errorResponse: ErrorResponse = { message: 'Le jeu de cartes ne peut pas être vide' };
        socket.emit('error', errorResponse);
        return;
      }

      const cardSetArray = cardSet.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      if (cardSetArray.length === 0) {
        const errorResponse: ErrorResponse = { message: 'Le jeu de cartes doit contenir au moins une carte' };
        socket.emit('error', errorResponse);
        return;
      }

      await roomService.updateRoom(roomCode, { cardSet: cardSetArray });
      
      const response: CardSetChangedResponse = {
        cardSet: cardSetArray
      };
      
      io.to(roomCode).emit('card-set-changed', response);
      
      logger.info(`Card set changed in room ${roomCode} by ${requester.name}`, { 
        roomCode, 
        newCardSet: cardSetArray,
        requester: requester.name 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors du changement du jeu de cartes' };
      socket.emit('error', errorResponse);
      logger.error('Error changing card set', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('change-anonymous-votes', async (payload: ChangeAnonymousVotesPayload) => {
    try {
      const { roomCode, anonymousVotes } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      const requester = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!requester || requester.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut changer l\'anonymisation des votes' };
        socket.emit('error', errorResponse);
        return;
      }

      await roomService.updateRoom(roomCode, { anonymousVotes });
      
      const response: AnonymousVotesChangedResponse = {
        anonymousVotes
      };
      
      io.to(roomCode).emit('anonymous-votes-changed', response);
      
      logger.info(`Anonymous votes changed to ${anonymousVotes} in room ${roomCode} by ${requester.name}`, { 
        roomCode, 
        anonymousVotes,
        requester: requester.name 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors du changement de l\'anonymisation des votes' };
      socket.emit('error', errorResponse);
      logger.error('Error changing anonymous votes', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('transfer-manager-role', async (payload: TransferManagerRolePayload) => {
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
      
      if (!requester || requester.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut transférer le rôle de manager' };
        socket.emit('error', errorResponse);
        return;
      }

      if (requester.id === participantId) {
        const errorResponse: ErrorResponse = { message: 'Vous ne pouvez pas transférer le rôle de manager à vous-même' };
        socket.emit('error', errorResponse);
        return;
      }

      const participantToPromote = room.participants.get(participantId);
      
      if (!participantToPromote) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }

      if (participantToPromote.role === 'manager') {
        const errorResponse: ErrorResponse = { message: 'Ce participant est déjà manager' };
        socket.emit('error', errorResponse);
        return;
      }

      // Déterminer le nouveau rôle de l'ancien manager basé sur son participationMode
      const oldManagerNewRole = requester.participationMode === 'spectator' ? 'spectator' : 'participant';
      
      // Déterminer le participationMode du nouveau manager
      // Si c'était un participant normal, on lui donne 'participant' par défaut pour qu'il puisse continuer à voter
      // Si c'était un spectateur, on lui donne 'spectator'
      const newManagerParticipationMode = participantToPromote.role === 'spectator' ? 'spectator' : 'participant';
      
      // Transférer le rôle manager au nouveau participant en préservant son mode de participation
      const newManager = await participantService.updateParticipantRole(participantId, 'manager', newManagerParticipationMode);
      
      // Changer le rôle de l'ancien manager
      const oldManager = await participantService.updateParticipantRole(requester.id, oldManagerNewRole, requester.participationMode);
      
      // Émettre les événements pour les deux participants
      const newManagerResponse: ParticipantRoleChangedResponse = {
        participant: {
          id: newManager.id,
          name: newManager.name,
          role: newManager.role,
          currentEstimate: newManager.currentEstimate,
          participationMode: newManager.participationMode
        }
      };
      
      const oldManagerResponse: ParticipantRoleChangedResponse = {
        participant: {
          id: oldManager.id,
          name: oldManager.name,
          role: oldManager.role,
          currentEstimate: oldManager.currentEstimate,
          participationMode: oldManager.participationMode
        }
      };
      
      io.to(roomCode).emit('participant-role-changed', newManagerResponse);
      io.to(roomCode).emit('participant-role-changed', oldManagerResponse);
      
      logger.info(`Manager role transferred from ${requester.name} to ${newManager.name} in room ${roomCode}`, { 
        roomCode, 
        oldManager: requester.name,
        newManager: newManager.name
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors du transfert du rôle de manager' };
      socket.emit('error', errorResponse);
      logger.error('Error transferring manager role', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });
}

