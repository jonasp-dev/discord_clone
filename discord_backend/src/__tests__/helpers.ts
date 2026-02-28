/**
 * Shared test utilities — Prisma mock, Redis mock, and Express app factory.
 */

import { vi } from 'vitest';

// ─── Prisma Mock ─────────────────────────────────────────────────────────

/**
 * Creates a deep mock of the Prisma client.
 * Each model gets chainable methods that return promises.
 */
export function createPrismaMock() {
  const createModelMock = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    $transaction: vi.fn(),
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
    $transaction: vi.fn((fns: any[]) => Promise.all(fns)),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;

// ─── Redis Mock ──────────────────────────────────────────────────────────

export function createRedisMock() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    sAdd: vi.fn(),
    sRem: vi.fn(),
    sCard: vi.fn().mockResolvedValue(0),
    sIsMember: vi.fn().mockResolvedValue(false),
    hGet: vi.fn(),
    hSet: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
    duplicate: vi.fn(),
    connect: vi.fn(),
    quit: vi.fn(),
  };
}

// ─── JWT helpers ─────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-jwt-secret';
const TEST_JWT_REFRESH_SECRET = 'test-refresh-secret';

export function generateTestAccessToken(userId: string, email: string = 'test@example.com'): string {
  return jwt.sign({ userId, email }, TEST_JWT_SECRET, { expiresIn: '15m' });
}

export function generateTestRefreshToken(userId: string, email: string = 'test@example.com'): string {
  return jwt.sign({ userId, email }, TEST_JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export { TEST_JWT_SECRET, TEST_JWT_REFRESH_SECRET };

// ─── Test user factory ──────────────────────────────────────────────────

let counter = 0;

export function createTestUser(overrides: Partial<{
  id: string;
  email: string;
  username: string;
  password: string;
  avatar: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  counter++;
  return {
    id: `test-user-${counter}`,
    email: `user${counter}@test.com`,
    username: `testuser${counter}`,
    password: '$2b$10$hashedpassword',
    avatar: null,
    status: 'online',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestServer(ownerId: string, overrides: Partial<{
  id: string;
  name: string;
  icon: string | null;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  counter++;
  return {
    id: `test-server-${counter}`,
    name: `Test Server ${counter}`,
    icon: null,
    ownerId,
    inviteCode: `invite-${counter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestChannel(serverId: string, overrides: Partial<{
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  counter++;
  return {
    id: `test-channel-${counter}`,
    name: `test-channel-${counter}`,
    type: 'TEXT',
    serverId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestMessage(channelId: string, userId: string, overrides: Partial<{
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  counter++;
  return {
    id: `test-message-${counter}`,
    content: `Test message ${counter}`,
    channelId,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestConversation(overrides: Partial<{
  id: string;
  isGroup: boolean;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  counter++;
  return {
    id: `test-conversation-${counter}`,
    isGroup: false,
    name: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Reset counter between tests
export function resetTestCounter() {
  counter = 0;
}
