import { z } from 'zod';

export const createChannelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['TEXT', 'VOICE']).default('TEXT'),
  }),
  params: z.object({
    serverId: z.string(),
  }),
});

export const updateChannelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
  }),
  params: z.object({
    channelId: z.string(),
  }),
});

export interface CreateChannelDto {
  name: string;
  type?: 'TEXT' | 'VOICE';
}

export interface UpdateChannelDto {
  name?: string;
}

export interface ChannelResponse {
  id: string;
  name: string;
  type: string;
  serverId: string;
  createdAt: Date;
}
