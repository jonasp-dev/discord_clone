import { prisma } from '../../db/prisma';
import { NotFoundException } from '../../utils/http-exception';
import { requireMessagePermission, requireMessageDeletion } from '../../utils/permissions';
import { PaginatedResult, getPaginationLimit } from '../../utils/pagination';
import { CreateMessageDto, MessageResponse } from './messages.types';

export class MessagesService {
  async createMessage(channelId: string, userId: string, data: CreateMessageDto): Promise<MessageResponse> {
    await requireMessagePermission(userId, channelId);

    const message = await prisma.message.create({
      data: {
        content: data.content,
        channelId,
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
    });

    return message;
  }

  async getChannelMessages(
    channelId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<PaginatedResult<MessageResponse>> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await requireMessagePermission(userId, channelId);

    const pageSize = getPaginationLimit(limit);

    const messages = await prisma.message.findMany({
      where: {
        channelId,
      },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor item itself
      }),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: pageSize + 1,
    });

    const hasMore = messages.length > pageSize;
    const data = hasMore ? messages.slice(0, pageSize) : messages;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async getMessageById(messageId: string, userId: string): Promise<MessageResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await requireMessagePermission(userId, message.channelId);

    return message;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await requireMessageDeletion(userId, message.userId, message.channelId);

    await prisma.message.delete({
      where: { id: messageId },
    });
  }
}

export const messagesService = new MessagesService();
