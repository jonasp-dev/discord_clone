import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ServerSidebar } from '@/components/layout/ServerSidebar';
import { ChannelSidebar } from '@/components/channel/ChannelSidebar';
import { DMSidebar } from '@/components/dm/DMSidebar';
import { DMConversation } from '@/components/dm/DMConversation';
import { MessageList } from '@/components/message/MessageList';
import { MessageInput } from '@/components/message/MessageInput';
import { CreateServerModal } from '@/components/server/CreateServerModal';
import { JoinServerModal } from '@/components/server/JoinServerModal';
import { CreateChannelModal } from '@/components/channel/CreateChannelModal';
import { useUIStore } from '@/stores/uiStore';
import { useChannel } from '@/hooks/queries/useChannels';

/** Full channel view — header + message list + input. */
function ChannelView() {
  const { channelId } = useParams<{ serverId: string; channelId: string }>();
  const { data: channel } = useChannel(channelId);
  const channelName = channel?.name ?? '…';

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 flex-shrink-0 items-center gap-2 border-b border-discord-bg-tertiary/50 px-4 shadow-sm">
        <span className="text-discord-text-muted font-semibold">#</span>
        <h3 className="text-sm font-semibold text-discord-text-primary">{channelName}</h3>
      </div>
      <MessageList channelId={channelId!} channelName={channelName} />
      <MessageInput channelId={channelId!} channelName={channelName} />
    </div>
  );
}

/**
 * Main application layout — Discord's 3-column shell.
 * Server sidebar (left icons) | Channel sidebar (middle list) | Main chat area.
 */
export function AppLayout() {
  const activeModal = useUIStore((s) => s.activeModal);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-discord-bg-primary">
      {/* Server sidebar — left icon bar */}
      <ServerSidebar />

      {/* Middle panel — uses parameterized routes so children get useParams */}
      <Routes>
        {/* DM routes: explicit so DMSidebar gets conversationId via useParams */}
        <Route path="@me" element={<DMSidebar />} />
        <Route path="@me/:conversationId" element={<DMSidebar />} />
        <Route path=":serverId/:channelId" element={<ChannelSidebar />} />
        <Route path=":serverId" element={<ChannelSidebar />} />
        <Route path="*" element={<DMSidebar />} />
      </Routes>

      {/* Main content area — each route owns its full layout */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Routes>
          {/* DM: no conversation selected */}
          <Route
            path="@me"
            element={
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-discord-text-primary">
                    Welcome to Discord Clone
                  </h2>
                  <p className="mt-2 text-discord-text-muted">
                    Select a conversation or join a server to get started.
                  </p>
                </div>
              </div>
            }
          />
          {/* DM: conversation open */}
          <Route path="@me/:conversationId" element={<DMConversation />} />
          <Route path=":serverId/:channelId" element={<ChannelView />} />
          <Route
            path=":serverId"
            element={
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-discord-text-primary">
                    Select a channel
                  </h2>
                  <p className="mt-2 text-discord-text-muted">
                    Pick a channel from the sidebar to start chatting.
                  </p>
                </div>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/channels/@me" replace />} />
        </Routes>
      </div>

      {/* Modals */}
      {activeModal === 'createServer' && <CreateServerModal />}
      {activeModal === 'joinServer' && <JoinServerModal />}
      {activeModal === 'createChannel' && <CreateChannelModal />}
    </div>
  );
}
