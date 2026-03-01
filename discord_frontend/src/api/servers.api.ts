import apiClient from '@/api/client';
import type {
  ApiResponse,
  CreateServerRequest,
  UpdateServerRequest,
  JoinServerRequest,
} from '@/types/api';
import type { Server } from '@/types/models';

export const serversApi = {
  getUserServers: async (): Promise<Server[]> => {
    const response = await apiClient.get<ApiResponse<Server[]>>('/servers');
    return response.data.data!;
  },

  getServerById: async (serverId: string): Promise<Server> => {
    const response = await apiClient.get<ApiResponse<Server>>(
      `/servers/${serverId}`,
    );
    return response.data.data!;
  },

  createServer: async (data: CreateServerRequest): Promise<Server> => {
    const response = await apiClient.post<ApiResponse<Server>>(
      '/servers',
      data,
    );
    return response.data.data!;
  },

  updateServer: async (
    serverId: string,
    data: UpdateServerRequest,
  ): Promise<Server> => {
    const response = await apiClient.patch<ApiResponse<Server>>(
      `/servers/${serverId}`,
      data,
    );
    return response.data.data!;
  },

  deleteServer: async (serverId: string): Promise<void> => {
    await apiClient.delete(`/servers/${serverId}`);
  },

  joinServer: async (data: JoinServerRequest): Promise<Server> => {
    const response = await apiClient.post<ApiResponse<Server>>(
      '/servers/join',
      data,
    );
    return response.data.data!;
  },

  leaveServer: async (serverId: string): Promise<void> => {
    await apiClient.post(`/servers/${serverId}/leave`);
  },
};
