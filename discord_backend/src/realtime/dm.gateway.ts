import { Server, Socket } from 'socket.io';
import { prisma } from '../db/prisma';
import { logger } from '../config/logger';
import { pubsub } from '../redis/pubsub';
import { DmSendPayload, DmTypingPayload } from './socket.types';

export class DmGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.subscribeToPubSub();
  }

  private subscribeToPubSub() {
    pubsub.subscribe('dm:new', (message) => {
      const data = JSON.parse(message);
      // Deliver to all participants' personal rooms
      for (const participantUserId of data._participantUserIds ?? []) {
        this.io.to(`user:${participantUserId}`).emit('dm:new', {
          ...data,
          _participantUserIds: undefined, // Strip internal field before sending to client
        });
      }
    });
  }

  async handleSendDm(socket: Socket, payload: DmSendPayload) {
    const user = (socket as any).user;

    logger.debug({ userId: user.id, conversationId: payload.conversationId }, 'DM send event');

    try {
      // Verify sender is a participant
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: payload.conversationId,
            userId: user.id,
          },
        },
      });

      if (!participant) {
        socket.emit('error', { message: 'You are not a participant of this conversation' });
        return;
      }

      // Create the message and update conversation timestamp in a transaction
      const [message] = await prisma.$transaction([
        prisma.directMessage.create({
          data: {
            content: payload.content,
            conversationId: payload.conversationId,
            senderId: user.id,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        }),
        prisma.conversation.update({
          where: { id: payload.conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      // Get all participant user IDs for delivery
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: payload.conversationId },
        select: { userId: true },
      });

      const participantUserIds = participants.map((p) => p.userId);

      // Publish via Redis pub/sub for cross-instance delivery
      await pubsub.publish(
        'dm:new',
        JSON.stringify({ ...message, _participantUserIds: participantUserIds })
      );
    } catch (error) {
      logger.error(error, 'Failed to send DM');
      socket.emit('error', { message: 'Failed to send direct message' });
    }
  }

  async handleTyping(socket: Socket, payload: DmTypingPayload) {
    const user = (socket as any).user;

    try {
      // Get other participants to send typing indicator to
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId: payload.conversationId,
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      for (const p of participants) {
        this.io.to(`user:${p.userId}`).emit('dm:typing:start', {
          conversationId: payload.conversationId,
          userId: user.id,
          username: user.username,
        });
      }
    } catch (error) {
      logger.error(error, 'Failed to emit DM typing indicator');
    }
  }

  async handleStopTyping(socket: Socket, payload: DmTypingPayload) {
    const user = (socket as any).user;

    try {
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId: payload.conversationId,
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      for (const p of participants) {
        this.io.to(`user:${p.userId}`).emit('dm:typing:stop', {
          conversationId: payload.conversationId,
          userId: user.id,
        });
      }
    } catch (error) {
      logger.error(error, 'Failed to emit DM stop typing indicator');
    }
  }
}
