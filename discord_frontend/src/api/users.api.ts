import apiClient from '@/api/client';
import type { ApiResponse, UpdateProfileRequest } from '@/types/api';
import type { User } from '@/types/models';

type UserResponse = User;

export const usersApi = {
  getCurrentUser: async (): Promise<UserResponse> => {
    const response =
      await apiClient.get<ApiResponse<UserResponse>>('/users/me');
    return response.data.data!;
  },

  getUserById: async (userId: string): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(
      `/users/${userId}`,
    );
    return response.data.data!;
  },

  getUserByUsername: async (username: string): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(
      `/users/username/${username}`,
    );
    return response.data.data!;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserResponse> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      '/users/me',
      data,
    );
    return response.data.data!;
  },
};
