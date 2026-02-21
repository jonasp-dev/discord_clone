import { prisma } from '../db/prisma';
import { ForbiddenException, NotFoundException } from './http-exception';

export async function canAccessServer(userId: string, serverId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_serverId: {
        userId,
        serverId,
      },
    },
  });
  return !!membership;
}

export async function canManageServer(userId: string, serverId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_serverId: {
        userId,
        serverId,
      },
    },
  });
  return membership?.role === 'OWNER' || membership?.role === 'ADMIN';
}

export async function requireServerAccess(userId: string, serverId: string): Promise<void> {
  const hasAccess = await canAccessServer(userId, serverId);
  if (!hasAccess) {
    throw new ForbiddenException('You do not have access to this server');
  }
}

export async function requireServerManagement(userId: string, serverId: string): Promise<void> {
  const canManage = await canManageServer(userId, serverId);
  if (!canManage) {
    throw new ForbiddenException('You do not have permission to manage this server');
  }
}

export async function canSendMessage(userId: string, channelId: string): Promise<boolean> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { server: true },
  });

  if (!channel) {
    throw new NotFoundException('Channel not found');
  }

  return canAccessServer(userId, channel.serverId);
}

export async function requireMessagePermission(userId: string, channelId: string): Promise<void> {
  const canSend = await canSendMessage(userId, channelId);
  if (!canSend) {
    throw new ForbiddenException('You do not have permission to send messages in this channel');
  }
}
