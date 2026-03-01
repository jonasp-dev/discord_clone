import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '@/api/servers.api';
import { QUERY_KEYS } from '@/lib/constants';
import type {
  CreateServerRequest,
  UpdateServerRequest,
  JoinServerRequest,
} from '@/types/api';

/** Fetch all servers the current user belongs to. */
export function useServers() {
  return useQuery({
    queryKey: QUERY_KEYS.servers,
    queryFn: serversApi.getUserServers,
  });
}

/** Fetch a single server by ID (includes members + channels). */
export function useServer(serverId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.server(serverId!),
    queryFn: () => serversApi.getServerById(serverId!),
    enabled: !!serverId,
  });
}

/** Create a new server. */
export function useCreateServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServerRequest) => serversApi.createServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servers });
    },
  });
}

/** Update a server (name, icon). */
export function useUpdateServer(serverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateServerRequest) =>
      serversApi.updateServer(serverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servers });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.server(serverId),
      });
    },
  });
}

/** Delete a server. */
export function useDeleteServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => serversApi.deleteServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servers });
    },
  });
}

/** Join a server via invite code. */
export function useJoinServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinServerRequest) => serversApi.joinServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servers });
    },
  });
}

/** Leave a server. */
export function useLeaveServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => serversApi.leaveServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servers });
    },
  });
}
