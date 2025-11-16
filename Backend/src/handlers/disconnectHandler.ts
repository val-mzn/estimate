import { Socket } from 'socket.io';
import { ParticipantLeftResponse } from '../types.js';
import * as participantService from '../services/participantService.js';
import * as roomService from '../services/roomService.js';
import logger from '../utils/logger.js';

export function registerDisconnectHandler(socket: Socket) {
  socket.on('disconnect', async () => {
    logger.info(`Client disconnected: ${socket.id}`, { socketId: socket.id });
    
    const participant = await participantService.getParticipantBySocketId(socket.id);
    
    if (participant) {
      const room = await roomService.getRoom(participant.roomCode);
      
      if (room) {
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
        
        const updatedRoom = await roomService.getRoom(participant.roomCode);
        if (updatedRoom && updatedRoom.participants.size === 0) {
          await roomService.deleteRoom(participant.roomCode);
          logger.info(`Room deleted (empty): ${participant.roomCode}`, { roomCode: participant.roomCode });
        }
      }
    }
  });
}

