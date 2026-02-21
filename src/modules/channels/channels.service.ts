import { prisma } from '../../db/prisma';
import { NotFoundException } from '../../utils/http-exception';
import { requireServerAccess, requireServerManagement } from '../../utils/permissions';
import { CreateChannelDto, UpdateChannelDto, ChannelResponse } from './channels.types';

export class ChannelsService {
  async createChannel(serverId: string, userId: string, data: CreateChannelDto): Promise<ChannelResponse> {
    await requireServerManagement(userId, serverId);

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        type: data.type || 'TEXT',
        serverId,
      },
    });

    return channel;
  }

  async getChannelById(channelId: string, userId: string): Promise<ChannelResponse> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await requireServerAccess(userId, channel.serverId);

    return channel;
  }

  async getServerChannels(serverId: string, userId: string): Promise<ChannelResponse[]> {
    await requireServerAccess(userId, serverId);

    const channels = await prisma.channel.findMany({
      where: { serverId },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return channels;
  }

  async updateChannel(channelId: string, userId: string, data: UpdateChannelDto): Promise<ChannelResponse> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await requireServerManagement(userId, channel.serverId);

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(data.name && { name: data.name }),
      },
    });

    return updatedChannel;
  }

  async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await requireServerManagement(userId, channel.serverId);

    await prisma.channel.delete({
      where: { id: channelId },
    });
  }
}

export const channelsService = new ChannelsService();
