import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/api/messages.api';
import { QUERY_KEYS } from '@/lib/constants';
import type { PaginatedResult, SendMessageRequest } from '@/types/api';
import type { Message } from '@/types/models';

type MessagePages = { pages: PaginatedResult<Message>[]; pageParams: unknown[] };

/** Fetch channel messages with cursor-based infinite pagination. */
export function useMessages(channelId: string | undefined) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.messages(channelId!),
    queryFn: ({ pageParam }) =>
      messagesApi.getChannelMessages(channelId!, {
        cursor: pageParam as string | undefined,
        limit: 50,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!channelId,
  });
}

/** Send a message and optimistically add it to the top of pages[0]. */
export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) =>
      messagesApi.sendMessage(channelId, data),
    onSuccess: (newMessage) => {
      // Add to cache — socket will also fire message:new so we deduplicate there.
      queryClient.setQueryData(
        QUERY_KEYS.messages(channelId),
        (old: MessagePages | undefined) => {
          if (!old) return old;
          const pages = [...old.pages];
          const existing = pages.flatMap((p) => p.data).some((m) => m.id === newMessage.id);
          if (existing) return old;
          pages[0] = { ...pages[0], data: [newMessage, ...pages[0].data] };
          return { ...old, pages };
        },
      );
    },
  });
}

/** Delete a message and remove it from the cache. */
export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(
        QUERY_KEYS.messages(channelId),
        (old: MessagePages | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((m) => m.id !== messageId),
            })),
          };
        },
      );
    },
  });
}
