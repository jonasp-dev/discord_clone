import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1, 'Target user ID is required'),
  }),
});

export const sendDirectMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  }),
  params: z.object({
    conversationId: z.string().min(1),
  }),
});

export const getConversationMessagesSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1),
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().transform(Number).optional(),
  }),
});

export const deleteDirectMessageSchema = z.object({
  params: z.object({
    messageId: z.string().min(1),
  }),
});

export interface CreateConversationDto {
  targetUserId: string;
}

export interface SendDirectMessageDto {
  content: string;
}

export interface ConversationResponse {
  id: string;
  isGroup: boolean;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
      avatar: string | null;
      status: string;
    };
  }[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    sender: {
      id: string;
      username: string;
      avatar: string | null;
    };
  } | null;
}

export interface DirectMessageResponse {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}
