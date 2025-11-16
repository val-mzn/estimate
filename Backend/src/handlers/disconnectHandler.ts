import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { ParticipantLeftResponse, ParticipantRoleChangedResponse } from '../types.js';
import * as participantService from '../services/participantService.js';
import * as roomService from '../services/roomService.js';
import logger from '../utils/logger.js';

export function registerDisconnectHandler(io: Server, socket: Socket) {
  socket.on('disconnect', async () => {
    logger.info(`Client disconnected: ${socket.id}`, { socketId: socket.id });
    
    const participant = await participantService.getParticipantBySocketId(socket.id);
    
    if (participant) {
      const room = await roomService.getRoom(participant.roomCode);
      
      if (room) {
        const wasManager = participant.role === 'manager';
        
        await participantService.deleteParticipantEstimates(participant.id);
        await participantService.deleteParticipant(participant.id);
        
        const response: ParticipantLeftResponse = {
          participantId: participant.id
        };
        
        socket.to(participant.roomCode).emit('participant-left', response);
        
        logger.info(`Participant ${participant.name} left room ${participant.roomCode}`, { 
          roomCode: participant.roomCode, 
          participantId: participant.id, 
          participantName: participant.name 
        });
        
        // Si le manager quitte, transférer le rôle à un autre participant aléatoirement
        if (wasManager) {
          const updatedRoom = await roomService.getRoom(participant.roomCode);
          
          if (updatedRoom && updatedRoom.participants.size > 0) {
            const remainingParticipants = Array.from(updatedRoom.participants.values());
            const randomIndex = Math.floor(Math.random() * remainingParticipants.length);
            const newManager = remainingParticipants[randomIndex];
            
            // Déterminer le participationMode basé sur l'ancien rôle
            // Si c'était 'participant', le participationMode devient 'participant'
            // Si c'était 'spectator', le participationMode devient 'spectator'
            // Si c'était déjà 'manager', garder le participationMode existant
            const participationMode = newManager.role === 'participant' 
              ? 'participant' 
              : newManager.role === 'spectator' 
                ? 'spectator' 
                : newManager.participationMode || 'participant'; // Par défaut 'participant' si undefined
            
            const updatedParticipant = await participantService.updateParticipantRole(newManager.id, 'manager', participationMode);
            
            const roleChangedResponse: ParticipantRoleChangedResponse = {
              participant: {
                id: updatedParticipant.id,
                name: updatedParticipant.name,
                role: updatedParticipant.role,
                currentEstimate: updatedParticipant.currentEstimate,
                participationMode: updatedParticipant.participationMode
              }
            };
            
            io.to(participant.roomCode).emit('participant-role-changed', roleChangedResponse);
            
            logger.info(`Manager role transferred to ${newManager.name} in room ${participant.roomCode}`, { 
              roomCode: participant.roomCode, 
              newManagerId: newManager.id, 
              newManagerName: newManager.name,
              participationMode: participationMode
            });
          }
        }
        
        const finalRoom = await roomService.getRoom(participant.roomCode);
        if (finalRoom && finalRoom.participants.size === 0) {
          await roomService.deleteRoom(participant.roomCode);
          logger.info(`Room deleted (empty): ${participant.roomCode}`, { roomCode: participant.roomCode });
        }
      }
    }
  });
}

