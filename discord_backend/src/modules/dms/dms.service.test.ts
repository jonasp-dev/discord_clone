import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTestUser,
  createTestConversation,
  resetTestCounter,
} from '../../__tests__/helpers';

// ─── Mock dependencies ──────────────────────────────────────────────────

const prismaMock = vi.hoisted(() => {
  const createModelMock = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });
  return {
    user: createModelMock(),
    server: createModelMock(),
    channel: createModelMock(),
    membership: createModelMock(),
    message: createModelMock(),
    conversation: createModelMock(),
    conversationParticipant: createModelMock(),
    directMessage: createModelMock(),
    $transaction: vi.fn(),
  };
});

vi.mock('../../db/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('../../config/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { DmsService } from './dms.service';

describe('DmsService', () => {
  let dmsService: DmsService;
  let user1: ReturnType<typeof createTestUser>;
  let user2: ReturnType<typeof createTestUser>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestCounter();
    dmsService = new DmsService();

    user1 = createTestUser({ id: 'user-1' });
    user2 = createTestUser({ id: 'user-2' });
  });

  describe('getOrCreateConversation', () => {
    it('should throw if trying to create a conversation with yourself', async () => {
      await expect(
        dmsService.getOrCreateConversation(user1.id, { targetUserId: user1.id })
      ).rejects.toThrow('Cannot create a conversation with yourself');
    });

    it('should throw if target user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        dmsService.getOrCreateConversation(user1.id, { targetUserId: 'non-existent' })
      ).rejects.toThrow('Target user not found');
    });

    it('should return existing conversation if one already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user2);

      const existingConvo = {
        ...createTestConversation({ id: 'convo-1' }),
        participants: [
          { id: 'p-1', userId: user1.id, user: { id: user1.id, username: user1.username, avatar: null, status: 'online' } },
          { id: 'p-2', userId: user2.id, user: { id: user2.id, username: user2.username, avatar: null, status: 'online' } },
        ],
        messages: [],
      };
      prismaMock.conversation.findFirst.mockResolvedValue(existingConvo);

      const result = await dmsService.getOrCreateConversation(user1.id, { targetUserId: user2.id });

      expect(result.id).toBe('convo-1');
      expect(prismaMock.conversation.create).not.toHaveBeenCalled();
    });

    it('should create a new conversation if none exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user2);
      prismaMock.conversation.findFirst.mockResolvedValue(null);

      const newConvo = {
        ...createTestConversation({ id: 'convo-new' }),
        participants: [
          { id: 'p-1', userId: user1.id, user: { id: user1.id, username: user1.username, avatar: null, status: 'online' } },
          { id: 'p-2', userId: user2.id, user: { id: user2.id, username: user2.username, avatar: null, status: 'online' } },
        ],
        messages: [],
      };
      prismaMock.conversation.create.mockResolvedValue(newConvo);

      const result = await dmsService.getOrCreateConversation(user1.id, { targetUserId: user2.id });

      expect(result.id).toBe('convo-new');
      expect(result.participants.length).toBe(2);
      expect(prismaMock.conversation.create).toHaveBeenCalled();
    });
  });

  describe('sendDirectMessage', () => {
    it('should throw if sender is not a participant', async () => {
      prismaMock.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        dmsService.sendDirectMessage('convo-1', 'stranger', { content: 'Hey' })
      ).rejects.toThrow('You are not a participant of this conversation');
    });

    it('should create a message when sender is a participant', async () => {
      prismaMock.conversationParticipant.findUnique.mockResolvedValue({
        id: 'p-1', conversationId: 'convo-1', userId: user1.id,
      });

      const dmMessage = {
        id: 'dm-msg-1',
        content: 'Hello!',
        conversationId: 'convo-1',
        senderId: user1.id,
        sender: { id: user1.id, username: user1.username, avatar: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.$transaction.mockResolvedValue([dmMessage, {}]);

      const result = await dmsService.sendDirectMessage('convo-1', user1.id, { content: 'Hello!' });

      expect(result.id).toBe('dm-msg-1');
      expect(result.content).toBe('Hello!');
    });
  });

  describe('deleteDirectMessage', () => {
    it('should throw NotFoundException for non-existent message', async () => {
      prismaMock.directMessage.findUnique.mockResolvedValue(null);

      await expect(
        dmsService.deleteDirectMessage('non-existent', user1.id)
      ).rejects.toThrow('Message not found');
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      prismaMock.directMessage.findUnique.mockResolvedValue({
        id: 'dm-1',
        content: 'test',
        conversationId: 'convo-1',
        senderId: user2.id, // Different user
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        dmsService.deleteDirectMessage('dm-1', user1.id)
      ).rejects.toThrow('You can only delete your own messages');
    });

    it('should delete the message if sender matches', async () => {
      const dm = {
        id: 'dm-1',
        content: 'test',
        conversationId: 'convo-1',
        senderId: user1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.directMessage.findUnique.mockResolvedValue(dm);
      prismaMock.directMessage.delete.mockResolvedValue(dm);

      await dmsService.deleteDirectMessage('dm-1', user1.id);

      expect(prismaMock.directMessage.delete).toHaveBeenCalledWith({ where: { id: 'dm-1' } });
    });
  });

  describe('getUserConversations', () => {
    it('should return conversations for the user', async () => {
      const conversations = [
        {
          ...createTestConversation({ id: 'convo-1' }),
          participants: [
            { id: 'p-1', userId: user1.id, user: { id: user1.id, username: user1.username, avatar: null, status: 'online' } },
            { id: 'p-2', userId: user2.id, user: { id: user2.id, username: user2.username, avatar: null, status: 'online' } },
          ],
          messages: [{
            id: 'dm-1', content: 'Last message', senderId: user2.id,
            createdAt: new Date(),
            sender: { id: user2.id, username: user2.username, avatar: null },
          }],
        },
      ];

      prismaMock.conversation.findMany.mockResolvedValue(conversations);

      const result = await dmsService.getUserConversations(user1.id);

      expect(result.length).toBe(1);
      expect(result[0].lastMessage?.content).toBe('Last message');
    });
  });
});
