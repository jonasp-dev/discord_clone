import { useNavigate, useParams } from 'react-router-dom';
import { useConversations } from '@/hooks/queries/useDMs';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { UserPanel } from '@/components/layout/UserPanel';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/models';

/**
 * DM sidebar — shown on @me routes.
 * Lists all conversations sorted by most recently updated.
 */
export function DMSidebar() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversations, isLoading } = useConversations();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="flex h-full w-60 flex-shrink-0 flex-col bg-discord-bg-secondary">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-discord-bg-tertiary/50 px-4 shadow-sm">
        <h2 className="truncate text-sm font-semibold text-discord-text-primary">
          Direct Messages
        </h2>
        <button
          onClick={() => openModal('newDM')}
          title="New Direct Message"
          className="flex-shrink-0 rounded p-0.5 text-discord-text-muted transition-colors hover:text-discord-text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H13V4a1 1 0 0 0-2 0v7H4a1 1 0 0 0 0 2h7v7a1 1 0 0 0 2 0v-7h7a1 1 0 0 0 0-2z" />
          </svg>
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 scrollbar-hide">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-2 rounded p-2">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-discord-bg-primary" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-24 rounded bg-discord-bg-primary" />
                  <div className="h-2 w-32 rounded bg-discord-bg-primary" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <p className="px-2 pt-2 text-xs text-discord-text-muted">
            No direct messages yet.
          </p>
        ) : (
          conversations?.map((convo) => (
            <ConversationItem
              key={convo.id}
              conversation={convo}
              currentUserId={currentUserId}
              isActive={conversationId === convo.id}
              onClick={() => navigate(ROUTES.DM_CONVERSATION(convo.id))}
            />
          ))
        )}
      </div>

      <UserPanel />
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string | undefined;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  currentUserId,
  isActive,
  onClick,
}: ConversationItemProps) {
  // For 1:1 DMs, show the other participant
  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );
  const displayName = conversation.isGroup
    ? conversation.name ?? 'Group'
    : other?.user.username ?? 'Unknown';
  const avatar = other?.user.avatar;
  const initial = displayName[0].toUpperCase();

  const lastContent = conversation.lastMessage?.content;
  const preview = lastContent
    ? lastContent.length > 40
      ? lastContent.slice(0, 40) + '…'
      : lastContent
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors',
        isActive
          ? 'bg-discord-interactive-active/20 text-discord-text-primary'
          : 'text-discord-text-muted hover:bg-discord-interactive-hover/10 hover:text-discord-text-secondary',
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-discord-blurple text-xs font-semibold text-white">
            {initial}
          </div>
        )}
      </div>

      {/* Name + preview */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        {preview && (
          <p className="truncate text-xs text-discord-text-muted">{preview}</p>
        )}
      </div>
    </button>
  );
}
