import { z } from 'zod';

export const createServerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    icon: z.string().url().optional().nullable(),
  }),
});

export const updateServerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    icon: z.string().url().optional().nullable(),
  }),
  params: z.object({
    serverId: z.string(),
  }),
});

export const joinServerSchema = z.object({
  body: z.object({
    inviteCode: z.string().min(1),
  }),
});

export interface CreateServerDto {
  name: string;
  icon?: string | null;
}

export interface UpdateServerDto {
  name?: string;
  icon?: string | null;
}

export interface ServerResponse {
  id: string;
  name: string;
  icon: string | null;
  ownerId: string;
  inviteCode: string;
  createdAt: Date;
  memberCount?: number;
  members?: {
    id: string;
    username: string;
    avatar: string | null;
    status: string;
  }[];
  channels?: ChannelResponse[];
}

export interface ChannelResponse {
  id: string;
  name: string;
  type: string;
}
