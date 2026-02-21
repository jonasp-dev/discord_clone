import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';
import { JoinChannelPayload, LeaveChannelPayload } from './socket.types';

export class ChannelGateway {
  constructor(private io: Server) {}

  async handleJoinChannel(socket: Socket, payload: JoinChannelPayload) {
    const user = (socket as any).user;
    const { channelId } = payload;

    socket.join(`channel:${channelId}`);
    logger.debug({ userId: user.id, channelId }, 'User joined channel');

    socket.to(`channel:${channelId}`).emit('user:joined', {
      channelId,
      userId: user.id,
      username: user.username,
    });
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
