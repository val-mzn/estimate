import { Socket } from 'socket.io';
import { ParticipantLeftResponse } from '../types.js';
import { rooms } from '../store/rooms.js';

export function registerDisconnectHandler(socket: Socket) {
  socket.on('disconnect', () => {
    console.log(`Client déconnecté: ${socket.id}`);
    
    for (const [roomCode, room] of rooms.entries()) {
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (participant) {
        room.participants.delete(participant.id);
        
        const response: ParticipantLeftResponse = {
          participantId: participant.id
        };
        
        socket.to(roomCode).emit('participant-left', response);
        
        if (room.participants.size === 0) {
          rooms.delete(roomCode);
          console.log(`Room supprimée (vide): ${roomCode}`);
        }
        
        break;
      }
    }
  });
}

