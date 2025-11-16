import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import {
  EstimateTaskPayload,
  RevealEstimatesPayload,
  HideEstimatesPayload,
  ResetEstimatesPayload,
  PreviewFinalEstimatePayload,
  SetFinalEstimatePayload,
  EstimateUpdatedResponse,
  EstimatesRevealedResponse,
  EstimatesHiddenResponse,
  EstimatesResetResponse,
  FinalEstimateUpdatedResponse,
  ErrorResponse
} from '../types.js';
import * as roomService from '../services/roomService.js';
import * as participantService from '../services/participantService.js';
import * as estimateService from '../services/estimateService.js';
import * as taskService from '../services/taskService.js';
import logger from '../utils/logger.js';

export function registerEstimateHandlers(io: Server, socket: Socket) {
  socket.on('estimate-task', async (payload: EstimateTaskPayload) => {
    try {
      const { roomCode, taskId, estimate } = payload;
      const room = await roomService.getRoom(roomCode);
      
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
                          (participant.role === 'manager' && participant.participationMode === 'participant');
      
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
      
      let newEstimate: string | null = null;
      if (participant.currentEstimate === estimate) {
        newEstimate = null;
        await estimateService.deleteEstimate(taskId, participant.id);
      } else {
        newEstimate = estimate;
        await estimateService.upsertEstimate(taskId, participant.id, estimate);
      }
      
      await participantService.updateParticipant(participant.id, {
        currentEstimate: newEstimate
      });
      
      const response: EstimateUpdatedResponse = {
        participantId: participant.id,
        estimate: newEstimate,
        taskId
      };
      
      io.to(roomCode).emit('estimate-updated', response);
      
      logger.info(`Estimate updated in room ${roomCode} by ${participant.name}: ${newEstimate || 'removed'}`, { 
        roomCode, 
        participantId: participant.id, 
        participantName: participant.name, 
        estimate: newEstimate,
        taskId 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de l\'estimation' };
      socket.emit('error', errorResponse);
      logger.error('Error updating estimate', { error, roomCode: payload.roomCode, taskId: payload.taskId, socketId: socket.id });
    }
  });

  socket.on('reveal-estimates', async (payload: RevealEstimatesPayload) => {
    try {
      const { roomCode } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut révéler les estimations' };
        socket.emit('error', errorResponse);
        return;
      }
      
      await roomService.updateRoom(roomCode, { isRevealed: true });
      
      const activeParticipants = Array.from(room.participants.values())
        .filter(p => {
          const isParticipant = p.role === 'participant';
          const isManagerParticipating = p.role === 'manager' && p.participationMode === 'participant';
          return (isParticipant || isManagerParticipating);
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
      
      logger.info(`Estimates revealed in room ${roomCode}`, { roomCode, average, participantCount: activeParticipants.length });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la révélation des estimations' };
      socket.emit('error', errorResponse);
      logger.error('Error revealing estimates', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('hide-estimates', async (payload: HideEstimatesPayload) => {
    try {
      const { roomCode } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut masquer les estimations' };
        socket.emit('error', errorResponse);
        return;
      }
      
      await roomService.updateRoom(roomCode, { isRevealed: false });
      
      const response: EstimatesHiddenResponse = {
        participants: Array.from(room.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          currentEstimate: p.currentEstimate,
          participationMode: p.participationMode
        }))
      };
      
      io.to(roomCode).emit('estimates-hidden', response);
      
      logger.info(`Estimates hidden in room ${roomCode}`, { roomCode });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors du masquage des estimations' };
      socket.emit('error', errorResponse);
      logger.error('Error hiding estimates', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('reset-estimates', async (payload: ResetEstimatesPayload) => {
    try {
      const { roomCode } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut réinitialiser les estimations' };
        socket.emit('error', errorResponse);
        return;
      }
      
      await roomService.updateRoom(roomCode, { isRevealed: false });
      await participantService.updateParticipantsCurrentEstimate(roomCode, null);
      
      if (room.currentTaskId) {
        await estimateService.deleteEstimatesByTask(room.currentTaskId);
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
      
      logger.info(`Estimates reset in room ${roomCode}`, { roomCode, taskId: room.currentTaskId });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la réinitialisation' };
      socket.emit('error', errorResponse);
      logger.error('Error resetting estimates', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('preview-final-estimate', async (payload: PreviewFinalEstimatePayload) => {
    try {
      const { roomCode, taskId, finalEstimate } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut prévisualiser l\'estimation finale' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const task = room.tasks.get(taskId);
      if (!task) {
        const errorResponse: ErrorResponse = { message: 'Fiche introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const response: FinalEstimateUpdatedResponse = {
        taskId,
        finalEstimate
      };
      
      io.to(roomCode).emit('final-estimate-updated', response);
      
      logger.info(`Final estimate preview updated in room ${roomCode} for task ${taskId}: ${finalEstimate || 'removed'}`, { 
        roomCode, 
        taskId, 
        finalEstimate 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la prévisualisation de l\'estimation finale' };
      socket.emit('error', errorResponse);
      logger.error('Error previewing final estimate', { error, roomCode: payload.roomCode, taskId: payload.taskId, socketId: socket.id });
    }
  });

  socket.on('set-final-estimate', async (payload: SetFinalEstimatePayload) => {
    try {
      const { roomCode, taskId, finalEstimate } = payload;
      const room = await roomService.getRoom(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'manager') {
        const errorResponse: ErrorResponse = { message: 'Seul le manager peut définir l\'estimation finale' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const task = room.tasks.get(taskId);
      if (!task) {
        const errorResponse: ErrorResponse = { message: 'Fiche introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      await taskService.updateTask(taskId, { finalEstimate });
      
      const response: FinalEstimateUpdatedResponse = {
        taskId,
        finalEstimate
      };
      
      io.to(roomCode).emit('final-estimate-updated', response);
      
      logger.info(`Final estimate updated in room ${roomCode} for task ${taskId}: ${finalEstimate || 'removed'}`, { 
        roomCode, 
        taskId, 
        finalEstimate 
      });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la mise à jour de l\'estimation finale' };
      socket.emit('error', errorResponse);
      logger.error('Error updating final estimate', { error, roomCode: payload.roomCode, taskId: payload.taskId, socketId: socket.id });
    }
  });
}

