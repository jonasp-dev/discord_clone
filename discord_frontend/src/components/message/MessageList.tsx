import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useDeleteMessage } from '@/hooks/queries/useMessages';
import { getCurrentSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';
import { QUERY_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/models';
import type { PaginatedResult } from '@/types/api';

type MessagePages = { pages: PaginatedResult<Message>[]; pageParams: unknown[] };

interface MessageListProps {
  channelId: string;
  channelName: string;
}

export function MessageList({ channelId, channelName }: MessageListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(channelId);
  const deleteMessage = useDeleteMessage(channelId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Join/leave channel socket room
  useEffect(() => {
    const socket = getCurrentSocket();
    if (!socket || !channelId) return;

    socket.emit('channel:join', { channelId });
    return () => {
      socket.emit('channel:leave', { channelId });
    };
  }, [channelId]);

  // Listen for real-time messages
  useEffect(() => {
    const socket = getCurrentSocket();
    if (!socket || !channelId) return;

    const handleNewMessage = (message: Message) => {
      if (message.channelId !== channelId) return;
      queryClient.setQueryData(
        QUERY_KEYS.messages(channelId),
        (old: MessagePages | undefined) => {
          if (!old) return old;
          const pages = [...old.pages];
          // Deduplicate — REST onSuccess may have already added it
          const exists = pages.flatMap((p) => p.data).some((m) => m.id === message.id);
          if (exists) return old;
          pages[0] = { ...pages[0], data: [message, ...pages[0].data] };
          return { ...old, pages };
        },
      );
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [channelId, queryClient]);

  // Auto-scroll to bottom on first load and new messages
  useEffect(() => {
    if (isLoading) return;
    if (isFirstLoad.current) {
      bottomRef.current?.scrollIntoView();
      isFirstLoad.current = false;
      return;
    }
    const lastPage = data?.pages[0];
    const latestMessage = lastPage?.data[0];
    // Only auto-scroll if newest message is from current user
    if (latestMessage?.userId === currentUserId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.pages, isLoading, currentUserId]);

  // Reset scroll flag when channel changes
  useEffect(() => {
    isFirstLoad.current = true;
  }, [channelId]);

  // Flatten pages: backend returns newest-first, so reverse pages then items
  const messages = data
    ? [...data.pages].reverse().flatMap((page) => [...page.data].reverse())
    : [];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="space-y-3 w-full px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full flex-shrink-0 bg-discord-bg-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-discord-bg-secondary" />
                <div className="h-3 w-2/3 rounded bg-discord-bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hide px-4 pb-2">
      {/* Load older messages */}
      {hasNextPage && (
        <div className="flex justify-center py-3">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs text-discord-text-muted hover:text-discord-text-secondary disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      {/* Channel welcome message */}
      {!hasNextPage && (
        <div className="mb-6 mt-auto pt-16">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-discord-bg-secondary">
            <span className="text-3xl text-discord-text-muted">#</span>
          </div>
          <h2 className="text-2xl font-bold text-discord-text-primary">
            Welcome to #{channelName}!
          </h2>
          <p className="text-discord-text-muted text-sm">
            This is the start of the #{channelName} channel.
          </p>
        </div>
      )}

      {/* Message list */}
      <div className="space-y-0.5">
        {messages.map((message, i) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.userId === currentUserId}
            showHeader={
              i === 0 ||
              messages[i - 1].userId !== message.userId ||
              new Date(message.createdAt).getTime() -
                new Date(messages[i - 1].createdAt).getTime() >
                5 * 60 * 1000
            }
            onDelete={() => deleteMessage.mutate(message.id)}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showHeader: boolean;
  onDelete: () => void;
}

function MessageItem({ message, isOwn, showHeader, onDelete }: MessageItemProps) {
  const initial = message.user.username[0].toUpperCase();
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const fullTime = new Date(message.createdAt).toLocaleString();

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded px-2 py-0.5 hover:bg-discord-bg-secondary/50',
        showHeader && 'mt-4',
      )}
    >
      {/* Avatar — only on first message in a group */}
      <div className="w-10 flex-shrink-0">
        {showHeader ? (
          message.user.avatar ? (
            <img
              src={message.user.avatar}
              alt={message.user.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-discord-blurple text-sm font-semibold text-white">
              {initial}
            </div>
          )
        ) : (
          <span className="invisible block pt-0.5 text-right text-[10px] leading-none text-discord-text-muted group-hover:visible">
            {time}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-discord-text-primary">
              {message.user.username}
            </span>
            <span className="text-[11px] text-discord-text-muted" title={fullTime}>
              {time}
            </span>
          </div>
        )}
        <p className="break-words text-sm text-discord-text-secondary leading-relaxed">
          {message.content}
        </p>
      </div>

      {/* Delete button — own messages only */}
      {isOwn && (
        <button
          onClick={onDelete}
          className="absolute right-2 top-1 hidden rounded p-1 text-discord-text-muted hover:bg-discord-danger/10 hover:text-discord-danger group-hover:block"
          title="Delete message"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      )}
    </div>
  );
}
