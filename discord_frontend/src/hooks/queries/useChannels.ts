import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { channelsApi } from '@/api/channels.api';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreateChannelRequest } from '@/types/api';

/** Fetch all channels for a server. */
export function useChannels(serverId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.channels(serverId!),
    queryFn: () => channelsApi.getServerChannels(serverId!),
    enabled: !!serverId,
  });
}

/** Fetch a single channel by ID. */
export function useChannel(channelId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.channel(channelId!),
    queryFn: () => channelsApi.getChannelById(channelId!),
    enabled: !!channelId,
  });
}

/** Create a new channel in a server. */
export function useCreateChannel(serverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChannelRequest) =>
      channelsApi.createChannel(serverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.channels(serverId),
      });
      // Also refresh the server (it includes channels)
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.server(serverId),
      });
    },
  });
}

/** Delete a channel. */
export function useDeleteChannel(serverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => channelsApi.deleteChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.channels(serverId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.server(serverId),
      });
    },
  });
}
