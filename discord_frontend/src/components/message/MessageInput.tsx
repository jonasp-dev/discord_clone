import { useState, useRef } from 'react';
import { getCurrentSocket } from '@/lib/socket';
import { MESSAGE_MAX_LENGTH } from '@/lib/constants';

interface MessageInputProps {
  channelId: string;
  channelName: string;
}

/**
 * Message input bar — Enter to send, Shift+Enter for newline.
 * Sends via socket `message:send` so the backend pubsub pipeline
 * fires `message:new` to all channel subscribers in real-time.
 */
export function MessageInput({ channelId, channelName }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    const socket = getCurrentSocket();
    if (!socket?.connected) return;

    setIsPending(true);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Emit via socket — backend creates message, publishes to Redis,
    // which emits `message:new` to all clients in `channel:{channelId}`.
    socket.emit('message:send', { channelId, content: trimmed });

    // Brief debounce to prevent double-sends
    setTimeout(() => setIsPending(false), 300);
  };

  // Auto-expand textarea up to ~5 lines
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
          placeholder={`Message #${channelName}`}
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
      {content.length > MESSAGE_MAX_LENGTH * 0.9 && (
        <p className="mt-1 text-right text-xs text-discord-text-muted">
          {content.length}/{MESSAGE_MAX_LENGTH}
        </p>
      )}
    </div>
  );
}
