import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import {
  CreateTaskPayload,
  DeleteTaskPayload,
  SelectTaskPayload,
  TaskCreatedResponse,
  TaskDeletedResponse,
  TaskSelectedResponse,
  ErrorResponse
} from '../types.js';
import { rooms } from '../store/rooms.js';
import { serializeTask } from '../utils/roomUtils.js';
import { createTask } from '../utils/taskUtils.js';
import logger from '../utils/logger.js';

export function registerTaskHandlers(io: Server, socket: Socket) {
  socket.on('create-task', (payload: CreateTaskPayload) => {
    try {
      const { roomCode, title, description } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut créer des fiches' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const task = createTask(title, description);
      room.tasks.set(task.id, task);
      
      const response: TaskCreatedResponse = {
        task: serializeTask(task),
        currentTaskId: room.currentTaskId
      };
      
      io.to(roomCode).emit('task-created', response);
      
      logger.info(`Task created in room ${roomCode}: ${title}`, { roomCode, taskId: task.id, title });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la création de la fiche' };
      socket.emit('error', errorResponse);
      logger.error('Error creating task', { error, roomCode: payload.roomCode, socketId: socket.id });
    }
  });

  socket.on('delete-task', (payload: DeleteTaskPayload) => {
    try {
      const { roomCode, taskId } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut supprimer des fiches' };
        socket.emit('error', errorResponse);
        return;
      }
      
      room.tasks.delete(taskId);
      
      if (room.currentTaskId === taskId) {
        const remainingTasks = Array.from(room.tasks.keys());
        room.currentTaskId = remainingTasks.length > 0 ? remainingTasks[0] : null;
        
        room.participants.forEach(p => {
          p.currentEstimate = null;
        });
        room.isRevealed = false;
      }
      
      const response: TaskDeletedResponse = {
        taskId,
        currentTaskId: room.currentTaskId
      };
      
      io.to(roomCode).emit('task-deleted', response);
      
      logger.info(`Task deleted in room ${roomCode}: ${taskId}`, { roomCode, taskId });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la suppression de la fiche' };
      socket.emit('error', errorResponse);
      logger.error('Error deleting task', { error, roomCode: payload.roomCode, taskId: payload.taskId, socketId: socket.id });
    }
  });

  socket.on('select-task', (payload: SelectTaskPayload) => {
    try {
      const { roomCode, taskId } = payload;
      const room = rooms.get(roomCode);
      
      if (!room) {
        const errorResponse: ErrorResponse = { message: 'Room introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      const participant = Array.from(room.participants.values())
        .find(p => p.socketId === socket.id);
      
      if (!participant || participant.role !== 'creator') {
        const errorResponse: ErrorResponse = { message: 'Seul le créateur peut sélectionner/désélectionner des fiches' };
        socket.emit('error', errorResponse);
        return;
      }
      
      if (taskId === null) {
        room.currentTaskId = null;
        room.isRevealed = false;
        
        room.participants.forEach(p => {
          p.currentEstimate = null;
        });
        
        const response: TaskSelectedResponse = {
          taskId: null,
          isRevealed: false
        };
        
        io.to(roomCode).emit('task-selected', response);
        
        logger.info(`Task deselected in room ${roomCode}`, { roomCode });
        return;
      }
      
      if (!room.tasks.has(taskId)) {
        const errorResponse: ErrorResponse = { message: 'Fiche introuvable' };
        socket.emit('error', errorResponse);
        return;
      }
      
      room.currentTaskId = taskId;
      room.isRevealed = false;
      
      room.participants.forEach(p => {
        p.currentEstimate = null;
      });
      
      const response: TaskSelectedResponse = {
        taskId,
        isRevealed: false
      };
      
      io.to(roomCode).emit('task-selected', response);
      
      logger.info(`Task selected in room ${roomCode}: ${taskId}`, { roomCode, taskId });
    } catch (error) {
      const errorResponse: ErrorResponse = { message: 'Erreur lors de la sélection de la fiche' };
      socket.emit('error', errorResponse);
      logger.error('Error selecting task', { error, roomCode: payload.roomCode, taskId: payload.taskId, socketId: socket.id });
    }
  });
}

