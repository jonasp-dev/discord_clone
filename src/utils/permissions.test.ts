import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetTestCounter } from '../__tests__/helpers';

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
  };
});

vi.mock('../db/prisma', () => ({
  prisma: prismaMock,
}));

import {
  canAccessServer,
  canManageServer,
  requireServerAccess,
  requireServerManagement,
  requireMessagePermission,
  requireMessageDeletion,
} from './permissions';

describe('permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTestCounter();
  });

  describe('canAccessServer', () => {
    it('should return true if user is a member', async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ userId: 'u1', serverId: 's1', role: 'MEMBER' });
      expect(await canAccessServer('u1', 's1')).toBe(true);
    });

    it('should return false if user is not a member', async () => {
      prismaMock.membership.findUnique.mockResolvedValue(null);
      expect(await canAccessServer('u1', 's1')).toBe(false);
    });
  });

  describe('canManageServer', () => {
    it('should return true for OWNER', async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: 'OWNER' });
      expect(await canManageServer('u1', 's1')).toBe(true);
    });

    it('should return true for ADMIN', async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: 'ADMIN' });
      expect(await canManageServer('u1', 's1')).toBe(true);
    });

    it('should return false for MEMBER', async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: 'MEMBER' });
      expect(await canManageServer('u1', 's1')).toBe(false);
    });

    it('should return false for non-members', async () => {
      prismaMock.membership.findUnique.mockResolvedValue(null);
      expect(await canManageServer('u1', 's1')).toBe(false);
    });
  });

  describe('requireServerAccess', () => {
    it('should not throw for members', async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ userId: 'u1', serverId: 's1', role: 'MEMBER' });
      await expect(requireServerAccess('u1', 's1')).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException for non-members', async () => {
      prismaMock.membership.findUnique.mockResolvedValue(null);
      await expect(requireServerAccess('u1', 's1')).rejects.toThrow('You do not have access to this server');
    });
  });

  describe('requireServerManagement', () => {
    it('should throw for non-admin members', async () => {
      prismaMock.membership.findUnique.mockResolvedValue({ role: 'MEMBER' });
      await expect(requireServerManagement('u1', 's1')).rejects.toThrow('You do not have permission to manage this server');
    });
  });

  describe('requireMessagePermission', () => {
    it('should allow server members to send messages', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1', server: {} });
      prismaMock.membership.findUnique.mockResolvedValue({ userId: 'u1', serverId: 's1', role: 'MEMBER' });

      await expect(requireMessagePermission('u1', 'c1')).resolves.toBeUndefined();
    });

    it('should reject non-members from sending messages', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1', server: {} });
      prismaMock.membership.findUnique.mockResolvedValue(null);

      await expect(requireMessagePermission('u1', 'c1')).rejects.toThrow(
        'You do not have permission to send messages in this channel'
      );
    });

    it('should throw NotFoundException for non-existent channel', async () => {
      prismaMock.channel.findUnique.mockResolvedValue(null);

      await expect(requireMessagePermission('u1', 'c1')).rejects.toThrow('Channel not found');
    });
  });

  describe('requireMessageDeletion', () => {
    it('should allow message author to delete', async () => {
      // No DB calls needed — author matches
      await expect(requireMessageDeletion('u1', 'u1', 'c1')).resolves.toBeUndefined();
    });

    it('should allow admin to delete other users messages', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prismaMock.membership.findUnique.mockResolvedValue({ userId: 'admin', serverId: 's1', role: 'ADMIN' });

      await expect(requireMessageDeletion('admin', 'u1', 'c1')).resolves.toBeUndefined();
    });

    it('should reject regular members from deleting other users messages', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({ id: 'c1', serverId: 's1' });
      prismaMock.membership.findUnique.mockResolvedValue({ userId: 'u2', serverId: 's1', role: 'MEMBER' });

      await expect(requireMessageDeletion('u2', 'u1', 'c1')).rejects.toThrow(
        'You do not have permission to delete this message'
      );
    });
  });
});
