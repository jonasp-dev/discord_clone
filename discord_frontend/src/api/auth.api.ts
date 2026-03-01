import apiClient from '@/api/client';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
} from '@/types/api';

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data,
    );
    return response.data.data!;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data,
    );
    return response.data.data!;
  },

  refresh: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/refresh',
      data,
    );
    return response.data.data!;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
