import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';
import { getRedisClient } from '../../redis/redis.client';
import { ConflictException, HttpException, UnauthorizedException } from '../../utils/http-exception';
import { RegisterDto, LoginDto, AuthResponse, JwtPayload } from './auth.types';

const REFRESH_TOKEN_PREFIX = 'refresh_token:';

/** Parse a JWT duration string like '7d', '15m', '1h' into seconds */
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 7 * 86400;
  }
}

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  async register(data: RegisterDto): Promise<AuthResponse> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ConflictException('Email already in use');
      }
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
    });

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    // Store refresh token in Redis with TTL
    await this.storeRefreshToken(refreshToken, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    // Store refresh token in Redis with TTL
    await this.storeRefreshToken(refreshToken, user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;

      // Verify token exists in Redis (hasn't been revoked/logged out)
      const isValid = await this.isRefreshTokenValid(token);
      if (!isValid) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke old refresh token and issue new ones
      await this.revokeRefreshToken(token);

      const accessToken = this.generateAccessToken(user.id, user.email);
      const refreshToken = this.generateRefreshToken(user.id, user.email);

      // Store new refresh token
      await this.storeRefreshToken(refreshToken, user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          status: user.status,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload: JwtPayload = { userId, email };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    } as any);
  }

  private generateRefreshToken(userId: string, email: string): string {
    const payload: JwtPayload = { userId, email };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    } as any);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.revokeRefreshToken(refreshToken);
  }

  private async storeRefreshToken(token: string, userId: string): Promise<void> {
    const redis = getRedisClient();
    const ttl = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN);
    await redis.set(`${REFRESH_TOKEN_PREFIX}${token}`, userId, { EX: ttl });
  }

  private async isRefreshTokenValid(token: string): Promise<boolean> {
    const redis = getRedisClient();
    const result = await redis.get(`${REFRESH_TOKEN_PREFIX}${token}`);
    return result !== null;
  }

  private async revokeRefreshToken(token: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${REFRESH_TOKEN_PREFIX}${token}`);
  }
}

export const authService = new AuthService();
