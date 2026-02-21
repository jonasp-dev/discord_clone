import { z } from 'zod';

export const createMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
  params: z.object({
    channelId: z.string(),
  }),
});

export const getMessagesSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().transform(Number).optional(),
  }),
  params: z.object({
    channelId: z.string(),
  }),
});

export interface CreateMessageDto {
  content: string;
}

export interface MessageResponse {
  id: string;
  content: string;
  channelId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}
