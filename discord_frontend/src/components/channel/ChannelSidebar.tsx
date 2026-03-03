import { useNavigate, useParams } from 'react-router-dom';
import { useChannels } from '@/hooks/queries/useChannels';
import { useServer } from '@/hooks/queries/useServers';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Channel, ChannelType } from '@/types/models';

const CHANNEL_ICONS: Record<ChannelType, React.ReactNode> = {
  TEXT: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z" />
    </svg>
  ),
  VOICE: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M12 3C10.34 3 9 4.37 9 6.07V11.93C9 13.63 10.34 15 12 15C13.66 15 15 13.63 15 11.93V6.07C15 4.37 13.66 3 12 3Z" />
      <path d="M19 11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11H7C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11H19Z" />
    </svg>
  ),
};

/**
 * Channel sidebar — shown when a server is selected.
 * Displays server name header with channel list grouped by type.
 */
export function ChannelSidebar() {
  const navigate = useNavigate();
  const { serverId, channelId } = useParams<{
    serverId: string;
    channelId: string;
  }>();
  const { data: server } = useServer(serverId);
  const { data: channels, isLoading } = useChannels(serverId);
  const openModal = useUIStore((s) => s.openModal);
  const currentUser = useAuthStore((s) => s.user);

  const isOwnerOrAdmin =
    server &&
    currentUser &&
    (server.ownerId === currentUser.id ||
      server.members?.some(
        (m) => m.id === currentUser.id && (m.role === 'OWNER' || m.role === 'ADMIN'),
      ));

  // Group channels by type
  const textChannels = channels?.filter((c) => c.type === 'TEXT') ?? [];
  const voiceChannels = channels?.filter((c) => c.type === 'VOICE') ?? [];

  return (
    <div className="flex h-full w-60 flex-shrink-0 flex-col bg-discord-bg-secondary">
      {/* Server name header */}
      <div className="flex h-12 items-center justify-between border-b border-discord-bg-tertiary/50 px-4 shadow-sm">
        <h2 className="truncate text-sm font-semibold text-discord-text-primary">
          {server?.name ?? 'Loading...'}
        </h2>
        <button
          onClick={() => openModal('serverInvite')}
          title="Invite People"
          className="flex-shrink-0 rounded p-0.5 text-discord-text-muted transition-colors hover:text-discord-text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm-3-5a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm7 5a1 1 0 0 1-1 1h-1v1a1 1 0 0 1-2 0v-1h-1a1 1 0 0 1 0-2h1v-1a1 1 0 0 1 2 0v1h1a1 1 0 0 1 1 1z" />
          </svg>
        </button>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 pt-4 scrollbar-hide">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-discord-bg-primary/50" />
            ))}
          </div>
        ) : (
          <>
            <ChannelGroup
              label="Text Channels"
              channels={textChannels}
              activeChannelId={channelId}
              serverId={serverId!}
              canManage={!!isOwnerOrAdmin}
              onChannelClick={(ch) =>
                navigate(ROUTES.SERVER_CHANNEL(serverId!, ch.id))
              }
              onAddClick={() => openModal('createChannel')}
            />
            {voiceChannels.length > 0 && (
              <ChannelGroup
                label="Voice Channels"
                channels={voiceChannels}
                activeChannelId={channelId}
                serverId={serverId!}
                canManage={!!isOwnerOrAdmin}
                onChannelClick={(ch) =>
                  navigate(ROUTES.SERVER_CHANNEL(serverId!, ch.id))
                }
                onAddClick={() => openModal('createChannel')}
              />
            )}
            {textChannels.length === 0 && voiceChannels.length === 0 && (
              <p className="px-2 text-xs text-discord-text-muted">
                No channels yet.{' '}
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => openModal('createChannel')}
                    className="text-discord-blurple hover:underline"
                  >
                    Create one
                  </button>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** A collapsible group of channels (e.g. "Text Channels"). */
function ChannelGroup({
  label,
  channels,
  activeChannelId,
  canManage,
  onChannelClick,
  onAddClick,
}: {
  label: string;
  channels: Channel[];
  activeChannelId: string | undefined;
  serverId: string;
  canManage: boolean;
  onChannelClick: (channel: Channel) => void;
  onAddClick: () => void;
}) {
  return (
    <div className="mb-4">
      {/* Section header */}
      <div className="group mb-0.5 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-discord-text-muted">
          {label}
        </span>
        {canManage && (
          <button
            onClick={onAddClick}
            className="text-discord-text-muted opacity-0 transition-opacity hover:text-discord-text-secondary group-hover:opacity-100"
            title="Create Channel"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Channel items */}
      {channels.map((channel) => {
        const isActive = activeChannelId === channel.id;
        return (
          <button
            key={channel.id}
            onClick={() => onChannelClick(channel)}
            className={cn(
              'group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left transition-colors',
              isActive
                ? 'bg-discord-interactive-active/20 text-discord-text-primary'
                : 'text-discord-text-muted hover:bg-discord-interactive-hover/10 hover:text-discord-text-secondary',
            )}
          >
            <span className={cn(isActive ? 'text-discord-text-secondary' : 'text-discord-text-muted')}>
              {CHANNEL_ICONS[channel.type]}
            </span>
            <span className="truncate text-sm font-medium">{channel.name}</span>
          </button>
        );
      })}
    </div>
  );
}
