import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useConversation, useDMMessages, prependDMMessage } from '@/hooks/queries/useDMs';
import { getCurrentSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';
import { MESSAGE_MAX_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { DirectMessage } from '@/types/models';

/**
 * Full DM conversation view: header + scrollable message history + input.
 * Receives real-time messages via the `dm:new` socket event, which the
 * backend delivers to each participant's personal `user:{userId}` room.
 */
export function DMConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversation } = useConversation(conversationId);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useDMMessages(conversationId);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // The other participant (for 1:1 DMs)
  const other = conversation?.participants.find(
    (p) => p.userId !== currentUser?.id,
  );
  const displayName = conversation?.isGroup
    ? conversation.name ?? 'Group'
    : other?.user.username ?? '…';

  // Listen for real-time DM messages on the personal room
  useEffect(() => {
    const socket = getCurrentSocket();
    if (!socket || !conversationId) return;

    const handleDMNew = (message: DirectMessage) => {
      if (message.conversationId !== conversationId) return;
      prependDMMessage(queryClient, conversationId, message);
    };

    socket.on('dm:new', handleDMNew);
    return () => {
      socket.off('dm:new', handleDMNew);
    };
  }, [conversationId, queryClient]);

  // Auto-scroll on first load and own messages
  useEffect(() => {
    if (isLoading) return;
    if (isFirstLoad.current) {
      bottomRef.current?.scrollIntoView();
      isFirstLoad.current = false;
      return;
    }
    const newest = data?.pages[0]?.data[0];
    if (newest?.senderId === currentUser?.id) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.pages, isLoading, currentUser?.id]);

  useEffect(() => {
    isFirstLoad.current = true;
  }, [conversationId]);

  // Backend returns DESC (newest first) per page — reverse for display
  const messages = data
    ? [...data.pages].reverse().flatMap((page) => [...page.data].reverse())
    : [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 flex-shrink-0 items-center gap-2 border-b border-discord-bg-tertiary/50 px-4 shadow-sm">
        {other?.user.avatar ? (
          <img
            src={other.user.avatar}
            alt={displayName}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-discord-blurple text-xs font-semibold text-white">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <h3 className="text-sm font-semibold text-discord-text-primary">
          {displayName}
        </h3>
      </div>

      {/* Message history */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-2 scrollbar-hide">
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

        {!hasNextPage && !isLoading && (
          <div className="mb-6 mt-auto pt-16">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-discord-blurple text-2xl font-bold text-white">
              {displayName[0]?.toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-discord-text-primary">
              {displayName}
            </h2>
            <p className="text-sm text-discord-text-muted">
              This is the beginning of your conversation with {displayName}.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="mt-auto space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-start gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-discord-bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-discord-bg-secondary" />
                  <div className="h-3 w-2/3 rounded bg-discord-bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-auto space-y-0.5">
            {messages.map((msg, i) => (
              <DMMessageItem
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUser?.id}
                showHeader={
                  i === 0 ||
                  messages[i - 1].senderId !== msg.senderId ||
                  new Date(msg.createdAt).getTime() -
                    new Date(messages[i - 1].createdAt).getTime() >
                    5 * 60 * 1000
                }
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <DMInput conversationId={conversationId!} displayName={displayName} />
    </div>
  );
}

interface DMMessageItemProps {
  message: DirectMessage;
  isOwn: boolean;
  showHeader: boolean;
}

function DMMessageItem({ message, isOwn, showHeader }: DMMessageItemProps) {
  const initial = message.sender.username[0].toUpperCase();
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded px-2 py-0.5 hover:bg-discord-bg-secondary/50',
        showHeader && 'mt-4',
      )}
    >
      <div className="w-10 flex-shrink-0">
        {showHeader ? (
          message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white',
                isOwn ? 'bg-discord-blurple' : 'bg-discord-bg-primary',
              )}
            >
              {initial}
            </div>
          )
        ) : (
          <span className="invisible block pt-0.5 text-right text-[10px] leading-none text-discord-text-muted group-hover:visible">
            {time}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-discord-text-primary">
              {message.sender.username}
            </span>
            <span className="text-[11px] text-discord-text-muted">{time}</span>
          </div>
        )}
        <p className="break-words text-sm leading-relaxed text-discord-text-secondary">
          {message.content}
        </p>
      </div>
    </div>
  );
}

function DMInput({
  conversationId,
  displayName,
}: {
  conversationId: string;
  displayName: string;
}) {
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;
    const socket = getCurrentSocket();
    if (!socket?.connected) return;

    setIsPending(true);
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    socket.emit('dm:send', { conversationId, content: trimmed });
    setTimeout(() => setIsPending(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setContent(el.value);
  };

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="flex items-end gap-2 rounded-lg bg-discord-bg-secondary px-4 py-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${displayName}`}
          maxLength={MESSAGE_MAX_LENGTH}
          rows={1}
          className="flex-1 resize-none bg-transparent py-1.5 text-sm text-discord-text-primary placeholder-discord-text-muted outline-none"
          style={{ maxHeight: '120px' }}
        />
        <button
          onClick={submit}
          disabled={!content.trim() || isPending}
          className="mb-0.5 flex-shrink-0 rounded p-1.5 text-discord-text-muted transition-colors hover:text-discord-text-primary disabled:opacity-30"
          title="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
