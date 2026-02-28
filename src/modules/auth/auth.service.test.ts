import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTestUser,
  resetTestCounter,
} from '../../__tests__/helpers';

// ─── Mock dependencies BEFORE importing the module under test ────────────

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

const redisMock = vi.hoisted(() => ({
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
}));

vi.mock('../../db/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('../../redis/redis.client', () => ({
  getRedisClient: () => redisMock,
}));

vi.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

// Now import the service under test
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestCounter();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      const user = createTestUser({ id: 'new-user-1', email: 'new@test.com', username: 'newuser' });

      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(user);
      redisMock.set.mockResolvedValue('OK');

      const result = await authService.register({
        email: 'new@test.com',
        username: 'newuser',
        password: 'password123',
      });

      expect(result.user.email).toBe('new@test.com');
      expect(result.user.username).toBe('newuser');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      // Refresh token should be stored in Redis
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh_token:'),
        user.id,
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });

    it('should throw ConflictException if email is taken', async () => {
      const existingUser = createTestUser({ email: 'taken@test.com' });
      prismaMock.user.findFirst.mockResolvedValue(existingUser);

      await expect(
        authService.register({
          email: 'taken@test.com',
          username: 'newuser',
          password: 'password123',
        })
      ).rejects.toThrow('Email already in use');
    });

    it('should throw ConflictException if username is taken', async () => {
      const existingUser = createTestUser({ username: 'taken', email: 'other@test.com' });
      prismaMock.user.findFirst.mockResolvedValue(existingUser);

      await expect(
        authService.register({
          email: 'new@test.com',
          username: 'taken',
          password: 'password123',
        })
      ).rejects.toThrow('Username already taken');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'none@test.com', password: 'password' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token by deleting it from Redis', async () => {
      redisMock.del.mockResolvedValue(1);

      await authService.logout('some-refresh-token');

      expect(redisMock.del).toHaveBeenCalledWith('refresh_token:some-refresh-token');
    });
  });

  describe('refreshToken', () => {
    it('should throw if refresh token is not in Redis (revoked)', async () => {
      // Generate a real refresh token so JWT verify passes
      const jwt = await import('jsonwebtoken');
      const token = jwt.default.sign(
        { userId: 'user-1', email: 'test@test.com' },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );

      redisMock.get.mockResolvedValue(null); // Token not in Redis = revoked

      await expect(authService.refreshToken(token)).rejects.toThrow('Refresh token has been revoked');
    });
  });
});
