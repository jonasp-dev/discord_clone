import { useNavigate, useLocation } from 'react-router-dom';
import { useServers } from '@/hooks/queries/useServers';
import { useUIStore } from '@/stores/uiStore';
import { ServerIcon } from '@/components/server/ServerIcon';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Left-most vertical sidebar showing the DM button, server icons, and
 * add/join server buttons — mirrors Discord's server icon rail.
 */
export function ServerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  // URL: /channels/@me or /channels/{serverId} or /channels/{serverId}/{channelId}
  const pathSegments = location.pathname.split('/').filter(Boolean);
  // pathSegments: ['channels', '@me'] or ['channels', 'serverId', ...]
  const serverId = pathSegments[1] && pathSegments[1] !== '@me' ? pathSegments[1] : undefined;
  const { data: servers, isLoading } = useServers();
  const openModal = useUIStore((s) => s.openModal);

  const isDMActive = !serverId;

  return (
    <nav className="flex h-full w-[72px] flex-shrink-0 flex-col items-center gap-2 overflow-y-auto bg-discord-bg-tertiary py-3 scrollbar-hide">
      {/* DM / Home button */}
      <div className="group relative flex items-center justify-center">
        <div
          className={cn(
            'absolute left-0 w-1 rounded-r-full bg-discord-text-primary transition-all',
            isDMActive ? 'h-10' : 'h-0 group-hover:h-5',
          )}
        />
        <button
          onClick={() => navigate(ROUTES.DMS)}
          className={cn(
            'flex h-12 w-12 items-center justify-center transition-all duration-200',
            isDMActive
              ? 'rounded-xl bg-discord-blurple'
              : 'rounded-2xl bg-discord-bg-primary hover:rounded-xl hover:bg-discord-blurple',
          )}
          title="Direct Messages"
        >
          <svg
            width="28"
            height="20"
            viewBox="0 0 28 20"
            fill="none"
            className="text-discord-text-primary"
          >
            <path
              d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0292 1.4184C10.8251 0.934541 10.5765 0.461744 10.3416 0C8.48074 0.318797 6.67795 0.879656 4.97885 1.67671C1.29863 7.28022 0.327577 12.7459 0.822486 18.1372C2.80263 19.6212 4.99806 20.6652 7.3254 21.3328C7.87273 20.5682 8.35613 19.7524 8.77684 18.897C7.95848 18.5912 7.17064 18.2116 6.42421 17.7716C6.62513 17.6244 6.82244 17.4672 7.01351 17.31C11.563 19.422 16.5318 19.422 21.0361 17.31C21.2384 17.4672 21.435 17.6244 21.6254 17.7716C20.879 18.2116 20.0812 18.5912 19.2828 18.897C19.7086 19.7524 20.1826 20.5682 20.7296 21.3328C23.0676 20.6652 25.2627 19.6212 27.2224 18.1372C27.8065 11.8948 26.2814 6.47991 23.0212 1.67671ZM9.68041 14.8492C8.43029 14.8492 7.40178 13.7112 7.40178 12.3216C7.40178 10.932 8.40873 9.78316 9.68041 9.78316C10.9521 9.78316 11.9701 10.932 11.959 12.3216C11.959 13.7112 10.9521 14.8492 9.68041 14.8492ZM18.3196 14.8492C17.0695 14.8492 16.041 13.7112 16.041 12.3216C16.041 10.932 17.0479 9.78316 18.3196 9.78316C19.5913 9.78316 20.6093 10.932 20.5982 12.3216C20.5982 13.7112 19.6019 14.8492 18.3196 14.8492Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div className="pointer-events-none absolute left-full z-50 ml-4 hidden whitespace-nowrap rounded-md bg-discord-bg-floating px-3 py-2 text-sm font-medium text-discord-text-primary shadow-lg group-hover:block">
          Direct Messages
        </div>
      </div>

      {/* Divider */}
      <div className="mx-auto h-0.5 w-8 rounded-full bg-discord-bg-primary" />

      {/* Server list */}
      {isLoading ? (
        <>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 w-12 animate-pulse rounded-2xl bg-discord-bg-primary"
            />
          ))}
        </>
      ) : (
        servers?.map((server) => (
          <ServerIcon
            key={server.id}
            name={server.name}
            icon={server.icon}
            isActive={serverId === server.id}
            onClick={() => {
              // Navigate to the first channel or just the server
              const firstChannel = server.channels?.[0];
              if (firstChannel) {
                navigate(ROUTES.SERVER_CHANNEL(server.id, firstChannel.id));
              } else {
                navigate(`/channels/${server.id}`);
              }
            }}
          />
        ))
      )}

      {/* Divider */}
      <div className="mx-auto h-0.5 w-8 rounded-full bg-discord-bg-primary" />

      {/* Add server button */}
      <div className="group relative flex items-center justify-center">
        <button
          onClick={() => openModal('createServer')}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-bg-primary text-discord-green transition-all duration-200 hover:rounded-xl hover:bg-discord-green hover:text-white"
          title="Add a Server"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2v16M2 10h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="pointer-events-none absolute left-full z-50 ml-4 hidden whitespace-nowrap rounded-md bg-discord-bg-floating px-3 py-2 text-sm font-medium text-discord-text-primary shadow-lg group-hover:block">
          Add a Server
        </div>
      </div>

      {/* Join server button */}
      <div className="group relative flex items-center justify-center">
        <button
          onClick={() => openModal('joinServer')}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-bg-primary text-discord-green transition-all duration-200 hover:rounded-xl hover:bg-discord-green hover:text-white"
          title="Join a Server"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </button>
        <div className="pointer-events-none absolute left-full z-50 ml-4 hidden whitespace-nowrap rounded-md bg-discord-bg-floating px-3 py-2 text-sm font-medium text-discord-text-primary shadow-lg group-hover:block">
          Join a Server
        </div>
      </div>
    </nav>
  );
}
