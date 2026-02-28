import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import { logger } from './config/logger';
import { SocketEvents } from './realtime/socket.events';

export function createSocketServer(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  new SocketEvents(io);

  logger.info('Socket.io server configured');

  return io;
}
