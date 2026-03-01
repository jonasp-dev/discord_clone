import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { usersApi } from '@/api/users.api';
import { useAuthStore } from '@/stores/authStore';
import { QUERY_KEYS } from '@/lib/constants';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { LoginRequest, RegisterRequest } from '@/types/api';

/**
 * Fetch current user profile on app load (when we have a token).
 */
export function useCurrentUser(enabled: boolean) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: async () => {
      const user = await usersApi.getCurrentUser();
      // Hydrate auth store with the fetched user
      if (accessToken && refreshToken) {
        setAuth(user, accessToken, refreshToken);
      } else {
        setUser(user);
      }
      // Connect socket after auth confirmed
      if (accessToken) {
        getSocket(accessToken);
      }
      return user;
    },
    enabled,
    retry: false,
    meta: {
      onError: () => {
        setLoading(false);
      },
    },
  });
}

/**
 * Login mutation.
 */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response;
      setAuth(
        { ...user, createdAt: '', status: user.status as 'online' | 'idle' | 'dnd' | 'offline' },
        accessToken,
        refreshToken,
      );
      // Connect socket
      getSocket(accessToken);
      // Seed the current user query cache
      queryClient.setQueryData(QUERY_KEYS.currentUser, {
        ...user,
        createdAt: '',
        status: user.status,
      });
    },
  });
}

/**
 * Register mutation.
 */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response;
      setAuth(
        { ...user, createdAt: '', status: user.status as 'online' | 'idle' | 'dnd' | 'offline' },
        accessToken,
        refreshToken,
      );
      getSocket(accessToken);
      queryClient.setQueryData(QUERY_KEYS.currentUser, {
        ...user,
        createdAt: '',
        status: user.status,
      });
    },
  });
}

/**
 * Logout mutation.
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {
          // Ignore errors on logout — still clear local state
        });
      }
    },
    onSettled: () => {
      disconnectSocket();
      logout();
      queryClient.clear();
    },
  });
}
