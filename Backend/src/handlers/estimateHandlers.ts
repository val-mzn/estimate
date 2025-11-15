import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import {
  EstimateTaskPayload,
  RevealEstimatesPayload,
  ResetEstimatesPayload,
  SetFinalEstimatePayload,
  EstimateUpdatedResponse,
  EstimatesRevealedResponse,
  EstimatesResetResponse,
  FinalEstimateUpdatedResponse,
  ErrorResponse
} from '../types.js';
import { rooms } from '../store/rooms.js';

export function registerEstimateHandlers(io: Server, socket: Socket) {
  socket.on('estimate-task', (payload: EstimateTaskPayload) => {
    try {
      const { roomCode, taskId, estimate } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant) {
        const errorResponse: ErrorResponse = { message: 'Participant introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const canEstimate = participant.role === 'participant' || 
                          (participant.role === 'creator' && participant.participationMode === 'participant');
      
      if (!canEstimate) {
        const errorResponse: ErrorResponse = { message: 'Seuls les participants peuvent estimer' };
        socket.emit('error', errorResponse);
        return;
      }
      
      if (room.currentTaskId !== taskId) {
        const errorResponse: ErrorResponse = { message: 'Cette fiche n\'est pas la fiche courante' };
        socket.emit('error', errorResponse);
        return;
      }
      
      if (participant.currentEstimate === estimate) {
        participant.currentEstimate = null;
      } else {
        participant.currentEstimate = estimate;
      }
      
      const task = room.tasks.get(taskId);
      if (task) {
        if (participant.currentEstimate === null) {
          task.estimates.delete(participant.id);
        } else {
          task.estimates.set(participant.id, participant.currentEstimate);
        }
      }
      
      const response: EstimateUpdatedResponse = {
        participantId: participant.id,
        estimate: participant.currentEstimate,
        taskId
      };
      
      io.to(roomCode).emit('estimate-updated', response);
      
      console.log(`Estimation mise à jour dans ${roomCode} par ${participant.name}: ${participant.currentEstimate || 'retirée'}`);
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de l\'estimation' };
      socket.emit('error', errorResponse);
      console.error('Erreur estimation:', error);
    }
  });

  socket.on('reveal-estimates', (payload: RevealEstimatesPayload) => {
    try {
      const { roomCode } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut révéler les estimations' };
        socket.emit('error', errorResponse);
        return;
      }
      
      room.isRevealed = true;
      
      const activeParticipants = Array.from(room.participants.values())
        .filter(p => {
          const isParticipant = p.role === 'participant';
          const isCreatorParticipating = p.role === 'creator' && p.participationMode === 'participant';
          return (isParticipant || isCreatorParticipating);
        });
      
      const allVotedQuestionMark = activeParticipants.length > 0 && 
        activeParticipants.every(p => p.currentEstimate === '?');
      
      const estimates = activeParticipants
        .filter(p => p.currentEstimate && p.currentEstimate !== '?')
        .map(p => parseFloat(p.currentEstimate!))
        .filter(val => !isNaN(val) && isFinite(val));
      
      const average = estimates.length > 0
        ? Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length)
        : null;
      
      const response: EstimatesRevealedResponse = {
        participants: Array.from(room.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          currentEstimate: p.currentEstimate,
          participationMode: p.participationMode
        })),
        average
      };
      
      io.to(roomCode).emit('estimates-revealed', response);
      
      console.log(`Estimations révélées dans ${roomCode}`);
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la révélation des estimations' };
      socket.emit('error', errorResponse);
      console.error('Erreur révélation:', error);
    }
  });

  socket.on('reset-estimates', (payload: ResetEstimatesPayload) => {
    try {
      const { roomCode } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut réinitialiser les estimations' };
        socket.emit('error', errorResponse);
        return;
      }
      
      room.isRevealed = false;
      
      room.participants.forEach(p => {
        p.currentEstimate = null;
      });
      
      if (room.currentTaskId) {
        const task = room.tasks.get(room.currentTaskId);
        if (task) {
          task.estimates.clear();
        }
      }
      
      const response: EstimatesResetResponse = {
        participants: Array.from(room.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          currentEstimate: null,
          participationMode: p.participationMode
        }))
      };
      
      io.to(roomCode).emit('estimates-reset', response);
      
      console.log(`Estimations réinitialisées dans ${roomCode}`);
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la réinitialisation' };
      socket.emit('error', errorResponse);
      console.error('Erreur réinitialisation:', error);
    }
  });

  socket.on('set-final-estimate', (payload: SetFinalEstimatePayload) => {
    try {
      const { roomCode, taskId, finalEstimate } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut définir l\'estimation finale' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const task = room.tasks.get(taskId);
      if (!task) {
        const errorResponse: ErrorResponse = { message: 'Fiche introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      task.finalEstimate = finalEstimate;
      
      const response: FinalEstimateUpdatedResponse = {
        taskId,
        finalEstimate
      };
      
      io.to(roomCode).emit('final-estimate-updated', response);
      
      console.log(`Estimation finale mise à jour dans ${roomCode} pour la fiche ${taskId}: ${finalEstimate || 'supprimée'}`);
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la mise à jour de l\'estimation finale' };
      socket.emit('error', errorResponse);
      console.error('Erreur mise à jour estimation finale:', error);
    }
  });
}

