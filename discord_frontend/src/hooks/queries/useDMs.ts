import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dmsApi } from '@/api/dms.api';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreateConversationRequest, PaginatedResult } from '@/types/api';
import type { DirectMessage } from '@/types/models';

type DMPages = { pages: PaginatedResult<DirectMessage>[]; pageParams: unknown[] };

/** Fetch all conversations for the current user. */
export function useConversations() {
  return useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: dmsApi.getConversations,
  });
}

/** Fetch a single conversation by ID. */
export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.conversation(conversationId!),
    queryFn: () => dmsApi.getConversation(conversationId!),
    enabled: !!conversationId,
  });
}

/** Fetch DM messages with cursor-based infinite pagination. */
export function useDMMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.dmMessages(conversationId!),
    queryFn: ({ pageParam }) =>
      dmsApi.getMessages(conversationId!, {
        cursor: pageParam as string | undefined,
        limit: 50,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
  });
}

/** Get or create a 1:1 conversation with another user. */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      dmsApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
  });
}

/** Prepend a new DM message into the cache (called from socket listener). */
export function prependDMMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: DirectMessage,
) {
  queryClient.setQueryData(
    QUERY_KEYS.dmMessages(conversationId),
    (old: DMPages | undefined) => {
      if (!old) return old;
      const pages = [...old.pages];
      const exists = pages.flatMap((p) => p.data).some((m) => m.id === message.id);
      if (exists) return old;
      pages[0] = { ...pages[0], data: [message, ...pages[0].data] };
      return { ...old, pages };
    },
  );
  // Also refresh conversations list to update last message preview
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
}
