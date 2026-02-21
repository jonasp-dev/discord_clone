import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { MessageGateway } from './message.gateway';
import { ChannelGateway } from './channel.gateway';
import { PresenceGateway } from './presence.gateway';

export class SocketEvents {
  private messageGateway: MessageGateway;
  private channelGateway: ChannelGateway;
  private presenceGateway: PresenceGateway;

  constructor(private io: Server) {
    this.messageGateway = new MessageGateway(io);
    this.channelGateway = new ChannelGateway(io);
    this.presenceGateway = new PresenceGateway(io);
    
    this.initializeSocketAuth();
    this.setupConnectionHandler();
  }

  private initializeSocketAuth() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        (socket as any).user = user;
        next();
      } catch (error) {
        logger.error(error, 'Socket authentication failed');
        next(new Error('Authentication error'));
      }
    });
  }

  private setupConnectionHandler() {
    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      logger.info({ userId: user.id, socketId: socket.id }, 'Client connected');

      this.presenceGateway.handleConnection(socket);

      socket.on('channel:join', (payload) => {
        this.channelGateway.handleJoinChannel(socket, payload);
      });

      socket.on('channel:leave', (payload) => {
        this.channelGateway.handleLeaveChannel(socket, payload);
      });

      socket.on('message:send', (payload) => {
        this.messageGateway.handleNewMessage(socket, payload);
      });

      socket.on('typing:start', (payload) => {
        this.messageGateway.handleTyping(socket, payload);
      });

      socket.on('typing:stop', (payload) => {
        this.messageGateway.handleStopTyping(socket, payload);
      });

      socket.on('presence:status', (payload) => {
        this.presenceGateway.handleStatusChange(socket, payload);
      });

      socket.on('disconnect', () => {
        logger.info({ userId: user.id, socketId: socket.id }, 'Client disconnected');
        this.presenceGateway.handleDisconnect(socket);
      });

      socket.on('error', (error) => {
        logger.error(error, 'Socket error');
      });
    });
  }
}
