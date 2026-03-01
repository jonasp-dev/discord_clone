import apiClient from '@/api/client';
import type {
  ApiResponse,
  PaginatedResult,
  PaginationParams,
  SendMessageRequest,
} from '@/types/api';
import type { Message } from '@/types/models';

export const messagesApi = {
  getChannelMessages: async (
    channelId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Message>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResult<Message>>>(
      `/messages/${channelId}`,
      { params },
    );
    return response.data.data!;
  },

  sendMessage: async (
    channelId: string,
    data: SendMessageRequest,
  ): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>(
      `/messages/${channelId}`,
      data,
    );
    return response.data.data!;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },
};
