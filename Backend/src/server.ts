import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerTaskHandlers } from './handlers/taskHandlers.js';
import { registerEstimateHandlers } from './handlers/estimateHandlers.js';
import { registerDisconnectHandler } from './handlers/disconnectHandler.js';
import logger from './utils/logger.js';

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket: Socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  registerRoomHandlers(io, socket);
  registerTaskHandlers(io, socket);
  registerEstimateHandlers(io, socket);
  registerDisconnectHandler(socket);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`Socket.IO server started on port ${PORT}`);
});

