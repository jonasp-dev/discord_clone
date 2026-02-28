import { prisma } from '../../db/prisma';
import { NotFoundException, ForbiddenException, ConflictException } from '../../utils/http-exception';
import { CreateServerDto, UpdateServerDto, ServerResponse } from './servers.types';

export class ServersService {
  async createServer(userId: string, data: CreateServerDto): Promise<ServerResponse> {
    const server = await prisma.server.create({
      data: {
        name: data.name,
        icon: data.icon,
        ownerId: userId,
        memberships: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        channels: {
          create: {
            name: 'general',
            type: 'TEXT',
          },
        },
      },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    return {
      id: server.id,
      name: server.name,
      icon: server.icon,
      ownerId: server.ownerId,
      inviteCode: server.inviteCode,
      createdAt: server.createdAt,
      memberCount: server._count.memberships,
      channels: server.channels,
    };
  }

  async getServerById(serverId: string, userId: string): Promise<ServerResponse> {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            type: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                status: true,
              }
            }
          }
        }
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this server');
    }

    return {
      id: server.id,
      name: server.name,
      icon: server.icon,
      ownerId: server.ownerId,
      inviteCode: server.inviteCode,
      createdAt: server.createdAt,
      memberCount: server._count.memberships,
      members: server.memberships.map(m => ({
        id: m.user.id,
        username: m.user.username,
        avatar: m.user.avatar,
        status: m.user.status,
      })),
      channels: server.channels,
    };
  }

  async getUserServers(userId: string): Promise<ServerResponse[]> {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        server: {
          include: {
            channels: {
              select: {
                id: true,
                name: true,
                type: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
            _count: {
              select: {
                memberships: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return memberships.map((m) => ({
      id: m.server.id,
      name: m.server.name,
      icon: m.server.icon,
      ownerId: m.server.ownerId,
      inviteCode: m.server.inviteCode,
      createdAt: m.server.createdAt,
      memberCount: m.server._count.memberships,
      channels: m.server.channels,
    }));
  }

  async updateServer(serverId: string, userId: string, data: UpdateServerDto): Promise<ServerResponse> {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw new ForbiddenException('You do not have permission to update this server');
    }

    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    return {
      id: updatedServer.id,
      name: updatedServer.name,
      icon: updatedServer.icon,
      ownerId: updatedServer.ownerId,
      inviteCode: updatedServer.inviteCode,
      createdAt: updatedServer.createdAt,
      memberCount: updatedServer._count.memberships,
      channels: updatedServer.channels,
    };
  }

  async deleteServer(serverId: string, userId: string): Promise<void> {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.ownerId !== userId) {
      throw new ForbiddenException('Only the server owner can delete the server');
    }

    await prisma.server.delete({
      where: { id: serverId },
    });
  }

  async joinServer(userId: string, inviteCode: string): Promise<ServerResponse> {
    const server = await prisma.server.findUnique({
      where: { inviteCode },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Invalid invite code');
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId: server.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this server');
    }

    await prisma.membership.create({
      data: {
        userId,
        serverId: server.id,
        role: 'MEMBER',
      },
    });

    const memberCount = await prisma.membership.count({
      where: { serverId: server.id },
    });

    return {
      id: server.id,
      name: server.name,
      icon: server.icon,
      ownerId: server.ownerId,
      inviteCode: server.inviteCode,
      createdAt: server.createdAt,
      memberCount,
      channels: server.channels,
    };
  }

  async leaveServer(serverId: string, userId: string): Promise<void> {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.ownerId === userId) {
      throw new ForbiddenException('Server owner cannot leave the server. Transfer ownership or delete the server.');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this server');
    }

    await prisma.membership.delete({
      where: {
        userId_serverId: {
          userId,
          serverId,
        },
      },
    });
  }
}

export const serversService = new ServersService();
