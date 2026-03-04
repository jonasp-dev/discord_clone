import { prisma } from '../../db/prisma';
import { ForbiddenException, NotFoundException, ConflictException } from '../../utils/http-exception';
import { PaginatedResult, getPaginationLimit } from '../../utils/pagination';
import {
  CreateConversationDto,
  SendDirectMessageDto,
  ConversationResponse,
  DirectMessageResponse,
} from './dms.types';

const PARTICIPANT_USER_SELECT = {
  id: true,
  username: true,
  avatar: true,
  status: true,
};

const SENDER_SELECT = {
  id: true,
  username: true,
  avatar: true,
};

export class DmsService {
  /**
   * Get or create a 1:1 conversation between two users.
   * Ensures uniqueness — no duplicate 1:1 convos between the same pair.
   */
  async getOrCreateConversation(userId: string, data: CreateConversationDto): Promise<ConversationResponse> {
    const { targetUserId } = data;

    if (userId === targetUserId) {
      throw new ConflictException('Cannot create a conversation with yourself');
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Check if a 1:1 conversation already exists between these two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: SENDER_SELECT } },
        },
      },
    });

    if (existingConversation) {
      return this.formatConversationResponse(existingConversation);
    }

    // Create new 1:1 conversation with both participants
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        participants: {
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: SENDER_SELECT } },
        },
      },
    });

    return this.formatConversationResponse(conversation);
  }

  /**
   * List all conversations for a user, with last message preview.
   * Only returns conversations that have at least one message — empty
   * conversations are hidden from both participants until the first message.
   */
  async getUserConversations(userId: string): Promise<ConversationResponse[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
        messages: { some: {} },
      },
      include: {
        participants: {
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: SENDER_SELECT } },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations.map((c) => this.formatConversationResponse(c));
  }

  /**
   * Get paginated messages for a conversation.
   * Uses cursor-based pagination by message ID.
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<PaginatedResult<DirectMessageResponse>> {
    await this.requireParticipant(conversationId, userId);

    const pageSize = getPaginationLimit(limit);

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      include: {
        sender: { select: SENDER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize + 1,
    });

    const hasMore = messages.length > pageSize;
    const data = hasMore ? messages.slice(0, pageSize) : messages;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, nextCursor, hasMore };
  }

  /**
   * Send a direct message in a conversation.
   * Updates conversation's updatedAt for sorting.
   */
  async sendDirectMessage(
    conversationId: string,
    senderId: string,
    data: SendDirectMessageDto
  ): Promise<DirectMessageResponse> {
    await this.requireParticipant(conversationId, senderId);

    const [message] = await prisma.$transaction([
      prisma.directMessage.create({
        data: {
          content: data.content,
          conversationId,
          senderId,
        },
        include: {
          sender: { select: SENDER_SELECT },
        },
      }),
      // Touch conversation updatedAt so it sorts to top
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }

  /**
   * Delete a direct message. Only the sender can delete their own DMs.
   */
  async deleteDirectMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await prisma.directMessage.delete({
      where: { id: messageId },
    });
  }

  /**
   * Get a single conversation by ID (with participant check).
   */
  async getConversationById(conversationId: string, userId: string): Promise<ConversationResponse> {
    await this.requireParticipant(conversationId, userId);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: SENDER_SELECT } },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.formatConversationResponse(conversation);
  }

  /**
   * Ensure the user is a participant of the conversation.
   */
  private async requireParticipant(conversationId: string, userId: string): Promise<void> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }
  }

  /**
   * Format a conversation with its last message preview.
   */
  private formatConversationResponse(conversation: any): ConversationResponse {
    const { messages, ...rest } = conversation;
    return {
      ...rest,
      lastMessage: messages?.[0] ?? null,
    };
  }
}

export const dmsService = new DmsService();
