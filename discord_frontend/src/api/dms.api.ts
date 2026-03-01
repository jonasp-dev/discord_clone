import apiClient from '@/api/client';
import type {
  ApiResponse,
  PaginatedResult,
  PaginationParams,
  CreateConversationRequest,
  SendMessageRequest,
} from '@/types/api';
import type { Conversation, DirectMessage } from '@/types/models';

export const dmsApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response =
      await apiClient.get<ApiResponse<Conversation[]>>('/dms');
    return response.data.data!;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await apiClient.get<ApiResponse<Conversation>>(
      `/dms/${conversationId}`,
    );
    return response.data.data!;
  },

  createConversation: async (
    data: CreateConversationRequest,
  ): Promise<Conversation> => {
    const response = await apiClient.post<ApiResponse<Conversation>>(
      '/dms',
      data,
    );
    return response.data.data!;
  },

  getMessages: async (
    conversationId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<DirectMessage>> => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResult<DirectMessage>>
    >(`/dms/${conversationId}/messages`, { params });
    return response.data.data!;
  },

  sendMessage: async (
    conversationId: string,
    data: SendMessageRequest,
  ): Promise<DirectMessage> => {
    const response = await apiClient.post<ApiResponse<DirectMessage>>(
      `/dms/${conversationId}/messages`,
      data,
    );
    return response.data.data!;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/dms/messages/${messageId}`);
  },
};
