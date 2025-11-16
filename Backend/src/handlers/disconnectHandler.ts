import { Socket } from 'socket.io';
import { ParticipantLeftResponse } from '../types.js';
import { rooms } from '../store/rooms.js';
import logger from '../utils/logger.js';

export function registerDisconnectHandler(socket: Socket) {
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`, { socketId: socket.id });
    
    for (const [roomCode, room] of rooms.entries()) {
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (participant) {
        room.participants.delete(participant.id);
        
        const response: ParticipantLeftResponse = {
          participantId: participant.id
        };
        
        socket.to(roomCode).emit('participant-left', response);
        
        logger.info(`Participant ${participant.name} left room ${roomCode}`, { 
          roomCode, 
          participantId: participant.id, 
          participantName: participant.name 
        });
        
        if (room.participants.size === 0) {
          rooms.delete(roomCode);
          logger.info(`Room deleted (empty): ${roomCode}`, { roomCode });
        }
        
        break;
      }
    }
  });
}

