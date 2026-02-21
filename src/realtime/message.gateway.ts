import { Server, Socket } from 'socket.io';
import { prisma } from '../db/prisma';
import { logger } from '../config/logger';
import { pubsub } from '../redis/pubsub';
import { NewMessagePayload } from './socket.types';

export class MessageGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.subscribeToPubSub();
  }

  private subscribeToPubSub() {
    pubsub.subscribe('message:new', (message) => {
      const data = JSON.parse(message);
      this.io.to(`channel:${data.channelId}`).emit('message:new', data);
    });
  }

  handleNewMessage(socket: Socket, payload: NewMessagePayload) {
    const userId = (socket as any).user.id;

    logger.debug({ userId, channelId: payload.channelId }, 'New message event');

    prisma.message
      .create({
        data: {
          content: payload.content,
          channelId: payload.channelId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      })
      .then((message) => {
        pubsub.publish('message:new', JSON.stringify(message));
      })
      .catch((error) => {
        logger.error(error, 'Failed to create message');
        socket.emit('error', { message: 'Failed to send message' });
      });
  }

  handleTyping(socket: Socket, payload: { channelId: string }) {
    const user = (socket as any).user;
    socket.to(`channel:${payload.channelId}`).emit('typing:start', {
      channelId: payload.channelId,
      userId: user.id,
      username: user.username,
    });
  }

  handleStopTyping(socket: Socket, payload: { channelId: string }) {
    const user = (socket as any).user;
    socket.to(`channel:${payload.channelId}`).emit('typing:stop', {
      channelId: payload.channelId,
      userId: user.id,
    });
  }
}
