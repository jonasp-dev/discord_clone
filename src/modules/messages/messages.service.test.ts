import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTestUser,
  createTestChannel,
  createTestMessage,
  createTestServer,
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

import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let user: ReturnType<typeof createTestUser>;
  let otherUser: ReturnType<typeof createTestUser>;
  let server: ReturnType<typeof createTestServer>;
  let channel: ReturnType<typeof createTestChannel>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestCounter();
    messagesService = new MessagesService();

    user = createTestUser({ id: 'user-1' });
    otherUser = createTestUser({ id: 'user-2' });
    server = createTestServer(user.id, { id: 'server-1' });
    channel = createTestChannel(server.id, { id: 'channel-1' });
  });

  describe('createMessage', () => {
    it('should create a message when user has access', async () => {
      // requireMessagePermission calls canSendMessage which calls canAccessServer
      prismaMock.channel.findUnique.mockResolvedValue({ ...channel, server: server });
      prismaMock.membership.findUnique.mockResolvedValue({ userId: user.id, serverId: server.id, role: 'MEMBER' });
      
      const message = createTestMessage(channel.id, user.id, { content: 'Hello!' });
      prismaMock.message.create.mockResolvedValue({ ...message, user: { id: user.id, username: user.username, avatar: null } });

      const result = await messagesService.createMessage(channel.id, user.id, { content: 'Hello!' });

      expect(result.content).toBe('Hello!');
      expect(prismaMock.message.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has no access', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({ ...channel, server: server });
      prismaMock.membership.findUnique.mockResolvedValue(null); // Not a member

      await expect(
        messagesService.createMessage(channel.id, 'non-member-user', { content: 'Hello!' })
      ).rejects.toThrow('You do not have permission to send messages in this channel');
    });
  });

  describe('deleteMessage', () => {
    it('should allow the message author to delete their own message', async () => {
      const message = createTestMessage(channel.id, user.id, { id: 'msg-1' });
      prismaMock.message.findUnique.mockResolvedValue(message);
      prismaMock.message.delete.mockResolvedValue(message);

      await messagesService.deleteMessage('msg-1', user.id);

      expect(prismaMock.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('should allow server ADMIN to delete other users messages', async () => {
      const adminUser = createTestUser({ id: 'admin-1' });
      const message = createTestMessage(channel.id, user.id, { id: 'msg-1' });
      
      prismaMock.message.findUnique.mockResolvedValue(message);
      prismaMock.channel.findUnique.mockResolvedValue({ id: channel.id, serverId: server.id });
      prismaMock.membership.findUnique.mockResolvedValue({ 
        userId: adminUser.id, serverId: server.id, role: 'ADMIN' 
      });
      prismaMock.message.delete.mockResolvedValue(message);

      await messagesService.deleteMessage('msg-1', adminUser.id);

      expect(prismaMock.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('should allow server OWNER to delete other users messages', async () => {
      const message = createTestMessage(channel.id, otherUser.id, { id: 'msg-1' });
      
      prismaMock.message.findUnique.mockResolvedValue(message);
      prismaMock.channel.findUnique.mockResolvedValue({ id: channel.id, serverId: server.id });
      prismaMock.membership.findUnique.mockResolvedValue({ 
        userId: user.id, serverId: server.id, role: 'OWNER' 
      });
      prismaMock.message.delete.mockResolvedValue(message);

      await messagesService.deleteMessage('msg-1', user.id);

      expect(prismaMock.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('should reject deletion by a regular member of someone elses message', async () => {
      const regularUser = createTestUser({ id: 'regular-1' });
      const message = createTestMessage(channel.id, user.id, { id: 'msg-1' });
      
      prismaMock.message.findUnique.mockResolvedValue(message);
      prismaMock.channel.findUnique.mockResolvedValue({ id: channel.id, serverId: server.id });
      prismaMock.membership.findUnique.mockResolvedValue({ 
        userId: regularUser.id, serverId: server.id, role: 'MEMBER' 
      });

      await expect(
        messagesService.deleteMessage('msg-1', regularUser.id)
      ).rejects.toThrow('You do not have permission to delete this message');
    });

    it('should throw NotFoundException for non-existent message', async () => {
      prismaMock.message.findUnique.mockResolvedValue(null);

      await expect(
        messagesService.deleteMessage('non-existent', user.id)
      ).rejects.toThrow('Message not found');
    });
  });

  describe('getChannelMessages - cursor pagination', () => {
    it('should use ID-based cursor for pagination', async () => {
      prismaMock.channel.findUnique.mockResolvedValue(channel);
      prismaMock.channel.findUnique.mockResolvedValue({ ...channel, server: server }); // for permission check
      prismaMock.membership.findUnique.mockResolvedValue({ userId: user.id, serverId: server.id, role: 'MEMBER' });
      
      const messages = Array.from({ length: 3 }, (_, i) =>
        createTestMessage(channel.id, user.id, {
          id: `msg-${i}`,
          content: `Message ${i}`,
          createdAt: new Date(Date.now() - i * 1000),
        })
      );
      prismaMock.message.findMany.mockResolvedValue(messages);

      const result = await messagesService.getChannelMessages(channel.id, user.id, undefined, 50);

      expect(result.data.length).toBe(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should return nextCursor as message ID when hasMore is true', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({ ...channel, server: server });
      prismaMock.membership.findUnique.mockResolvedValue({ userId: user.id, serverId: server.id, role: 'MEMBER' });

      // Return pageSize + 1 messages to indicate more pages
      const messages = Array.from({ length: 3 }, (_, i) =>
        createTestMessage(channel.id, user.id, {
          id: `msg-${i}`,
          content: `Message ${i}`,
          createdAt: new Date(Date.now() - i * 1000),
        })
      );
      prismaMock.message.findMany.mockResolvedValue(messages);

      const result = await messagesService.getChannelMessages(channel.id, user.id, undefined, 2);

      expect(result.data.length).toBe(2);
      expect(result.hasMore).toBe(true);
      // nextCursor should be the ID of the last message in data, not a timestamp
      expect(result.nextCursor).toBe('msg-1');
    });
  });
});
