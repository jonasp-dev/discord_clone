import { prisma } from '../../db/prisma';
import { NotFoundException, ConflictException } from '../../utils/http-exception';
import { UpdateProfileDto, UserResponse } from './users.types';

export class UsersService {
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserResponse> {
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.status && { status: data.status }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    return this.getUserById(userId);
  }
}

export const usersService = new UsersService();
