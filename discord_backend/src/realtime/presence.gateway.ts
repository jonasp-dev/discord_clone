import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';
import { prisma } from '../db/prisma';
import { getRedisClient } from '../redis/redis.client';
import { pubsub } from '../redis/pubsub';
import { PresencePayload } from './socket.types';

const PRESENCE_PREFIX = 'presence:user:';
const PRESENCE_ONLINE_SET = 'presence:online';

export class PresenceGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.subscribeToPubSub();
  }

  private subscribeToPubSub() {
    pubsub.subscribe('presence:update', (message) => {
      const data = JSON.parse(message);
      this.io.emit('presence:update', data);
    });
  }

  async handleConnection(socket: Socket) {
    const user = (socket as any).user;
    const redis = getRedisClient();

    try {
      // Track socket → user mapping with a Redis set per user
      await redis.sAdd(`${PRESENCE_PREFIX}${user.id}:sockets`, socket.id);

      // Add user to global online set
      await redis.sAdd(PRESENCE_ONLINE_SET, user.id);

      // Store user status (default to 'online' on first connection)
      const currentStatus = await redis.hGet(`${PRESENCE_PREFIX}${user.id}`, 'status');
      if (!currentStatus) {
        await redis.hSet(`${PRESENCE_PREFIX}${user.id}`, 'status', 'online');
        await this.broadcastStatusChange(user.id, 'online');
      }

      logger.debug({ userId: user.id, socketId: socket.id }, 'User connected (presence tracked in Redis)');
    } catch (error) {
      logger.error(error, 'Failed to track presence on connection');
    }
  }

  async handleDisconnect(socket: Socket) {
    const user = (socket as any).user;
    const redis = getRedisClient();

    try {
      // Remove this socket from the user's socket set
      await redis.sRem(`${PRESENCE_PREFIX}${user.id}:sockets`, socket.id);

      // Check if user has any remaining sockets
      const remainingSockets = await redis.sCard(`${PRESENCE_PREFIX}${user.id}:sockets`);

      if (remainingSockets === 0) {
        // User is fully offline — clean up
        await redis.sRem(PRESENCE_ONLINE_SET, user.id);
        await redis.del(`${PRESENCE_PREFIX}${user.id}:sockets`);
        await redis.del(`${PRESENCE_PREFIX}${user.id}`);
        await this.broadcastStatusChange(user.id, 'offline');
      }

      logger.debug({ userId: user.id, socketId: socket.id }, 'User disconnected (presence updated in Redis)');
    } catch (error) {
      logger.error(error, 'Failed to update presence on disconnect');
    }
  }

  async handleStatusChange(socket: Socket, payload: PresencePayload) {
    const user = (socket as any).user;
    const redis = getRedisClient();

    try {
      await redis.hSet(`${PRESENCE_PREFIX}${user.id}`, 'status', payload.status);
      await this.broadcastStatusChange(user.id, payload.status);
    } catch (error) {
      logger.error(error, 'Failed to update user status');
    }
  }

  private async broadcastStatusChange(userId: string, status: string) {
    try {
      // Persist to database
      await prisma.user.update({
        where: { id: userId },
        data: { status },
      });

      // Broadcast via Redis pub/sub for cross-instance delivery
      await pubsub.publish('presence:update', JSON.stringify({ userId, status }));

      logger.debug({ userId, status }, 'User status updated');
    } catch (error) {
      logger.error(error, 'Failed to broadcast status change');
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const redis = getRedisClient();
    return await redis.sIsMember(PRESENCE_ONLINE_SET, userId);
  }
}
