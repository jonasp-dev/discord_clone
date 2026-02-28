import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(32).optional(),
    avatar: z.string().url().optional().nullable(),
    status: z.enum(['online', 'idle', 'dnd', 'offline']).optional(),
  }),
});

export interface UpdateProfileDto {
  username?: string;
  avatar?: string | null;
  status?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  status: string;
  createdAt: Date;
}
