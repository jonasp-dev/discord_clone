import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';
import { prisma } from '../db/prisma';
import { PresencePayload } from './socket.types';

export class PresenceGateway {
  private io: Server;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  handleConnection(socket: Socket) {
    const user = (socket as any).user;
    
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id)!.add(socket.id);

    this.updateUserStatus(user.id, 'online');
    logger.debug({ userId: user.id, socketId: socket.id }, 'User connected');
  }

  handleDisconnect(socket: Socket) {
    const user = (socket as any).user;
    
    if (this.userSockets.has(user.id)) {
      this.userSockets.get(user.id)!.delete(socket.id);
      
      if (this.userSockets.get(user.id)!.size === 0) {
        this.userSockets.delete(user.id);
        this.updateUserStatus(user.id, 'offline');
      }
    }

    logger.debug({ userId: user.id, socketId: socket.id }, 'User disconnected');
  }

  handleStatusChange(socket: Socket, payload: PresencePayload) {
    const user = (socket as any).user;
    this.updateUserStatus(user.id, payload.status);
  }

  private async updateUserStatus(userId: string, status: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status },
      });

      this.io.emit('presence:update', {
        userId,
        status,
      });

      logger.debug({ userId, status }, 'User status updated');
    } catch (error) {
      logger.error(error, 'Failed to update user status');
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
