// API response types — mirrors backend ApiResponse shape

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    avatar: string | null;
    status: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Request body types
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateServerRequest {
  name: string;
  icon?: string | null;
}

export interface UpdateServerRequest {
  name?: string;
  icon?: string | null;
}

export interface JoinServerRequest {
  inviteCode: string;
}

export interface CreateChannelRequest {
  name: string;
  type?: 'TEXT' | 'VOICE';
}

export interface UpdateChannelRequest {
  name?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface CreateConversationRequest {
  targetUserId: string;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string | null;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}
