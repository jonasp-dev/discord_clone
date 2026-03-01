import { Routes, Route, Navigate } from 'react-router-dom';
import { ServerSidebar } from '@/components/layout/ServerSidebar';
import { UserPanel } from '@/components/layout/UserPanel';
import { ChannelSidebar } from '@/components/channel/ChannelSidebar';
import { CreateServerModal } from '@/components/server/CreateServerModal';
import { JoinServerModal } from '@/components/server/JoinServerModal';
import { CreateChannelModal } from '@/components/channel/CreateChannelModal';
import { useUIStore } from '@/stores/uiStore';

/** DM sidebar placeholder — shown on @me routes. */
function DMSidebar() {
  return (
    <div className="flex h-full w-60 flex-shrink-0 flex-col bg-discord-bg-secondary">
      <div className="flex h-12 items-center border-b border-discord-bg-tertiary/50 px-4 shadow-sm">
        <h2 className="truncate text-sm font-semibold text-discord-text-primary">
          Direct Messages
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-2 text-xs text-discord-text-muted">
          Conversations will appear here
        </p>
      </div>
      <UserPanel />
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
        <Route path="@me/*" element={<DMSidebar />} />
        <Route path=":serverId/:channelId" element={<ChannelSidebar />} />
        <Route path=":serverId" element={<ChannelSidebar />} />
        <Route path="*" element={<DMSidebar />} />
      </Routes>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        <div className="flex h-12 items-center border-b border-discord-bg-tertiary/50 px-4 shadow-sm">
          <h3 className="text-sm font-semibold text-discord-text-primary">
            Welcome
          </h3>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Routes>
            <Route
              path="@me/*"
              element={
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-discord-text-primary">
                    Welcome to Discord Clone
                  </h2>
                  <p className="mt-2 text-discord-text-muted">
                    Select a conversation or join a server to get started.
                  </p>
                </div>
              }
            />
            <Route
              path=":serverId/:channelId"
              element={
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-discord-text-primary">
                    Channel view coming soon
                  </h2>
                  <p className="mt-2 text-discord-text-muted">
                    This will show channel messages.
                  </p>
                </div>
              }
            />
            <Route
              path=":serverId"
              element={
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-discord-text-primary">
                    Select a channel
                  </h2>
                  <p className="mt-2 text-discord-text-muted">
                    Pick a channel from the sidebar to start chatting.
                  </p>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/channels/@me" replace />} />
          </Routes>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'createServer' && <CreateServerModal />}
      {activeModal === 'joinServer' && <JoinServerModal />}
      {activeModal === 'createChannel' && <CreateChannelModal />}
    </div>
  );
}
