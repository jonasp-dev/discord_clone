import apiClient from '@/api/client';
import type {
  ApiResponse,
  CreateChannelRequest,
  UpdateChannelRequest,
} from '@/types/api';
import type { Channel } from '@/types/models';

export const channelsApi = {
  getServerChannels: async (serverId: string): Promise<Channel[]> => {
    const response = await apiClient.get<ApiResponse<Channel[]>>(
      `/channels/servers/${serverId}/channels`,
    );
    return response.data.data!;
  },

  getChannelById: async (channelId: string): Promise<Channel> => {
    const response = await apiClient.get<ApiResponse<Channel>>(
      `/channels/${channelId}`,
    );
    return response.data.data!;
  },

  createChannel: async (
    serverId: string,
    data: CreateChannelRequest,
  ): Promise<Channel> => {
    const response = await apiClient.post<ApiResponse<Channel>>(
      `/channels/servers/${serverId}/channels`,
      data,
    );
    return response.data.data!;
  },

  updateChannel: async (
    channelId: string,
    data: UpdateChannelRequest,
  ): Promise<Channel> => {
    const response = await apiClient.patch<ApiResponse<Channel>>(
      `/channels/${channelId}`,
      data,
    );
    return response.data.data!;
  },

  deleteChannel: async (channelId: string): Promise<void> => {
    await apiClient.delete(`/channels/${channelId}`);
  },
};
