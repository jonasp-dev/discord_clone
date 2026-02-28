import { Server, Socket } from 'socket.io';
import { prisma } from '../db/prisma';
import { logger } from '../config/logger';
import { canAccessServer } from '../utils/permissions';
import { JoinChannelPayload, LeaveChannelPayload } from './socket.types';

export class ChannelGateway {
  constructor(private io: Server) {}

  async handleJoinChannel(socket: Socket, payload: JoinChannelPayload) {
    const user = (socket as any).user;
    const { channelId } = payload;

    try {
      // Verify the channel exists and get its server
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { id: true, serverId: true },
      });

      if (!channel) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }

      // Verify user is a member of the server that owns this channel
      const hasAccess = await canAccessServer(user.id, channel.serverId);
      if (!hasAccess) {
        socket.emit('error', { message: 'You do not have access to this channel' });
        return;
      }

      socket.join(`channel:${channelId}`);
      logger.debug({ userId: user.id, channelId }, 'User joined channel');

      socket.to(`channel:${channelId}`).emit('user:joined', {
        channelId,
        userId: user.id,
        username: user.username,
      });
    } catch (error) {
      logger.error(error, 'Failed to join channel');
      socket.emit('error', { message: 'Failed to join channel' });
    }
  }

  async handleLeaveChannel(socket: Socket, payload: LeaveChannelPayload) {
    const user = (socket as any).user;
    const { channelId } = payload;

    socket.leave(`channel:${channelId}`);
    logger.debug({ userId: user.id, channelId }, 'User left channel');

    socket.to(`channel:${channelId}`).emit('user:left', {
      channelId,
      userId: user.id,
    });
  }
}
