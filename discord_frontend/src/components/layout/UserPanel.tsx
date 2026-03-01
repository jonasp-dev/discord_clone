import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/queries/useAuth';
import { cn } from '@/lib/utils';

/**
 * User info panel at the bottom of the channel sidebar — shows avatar,
 * username, and a logout button.
 */
export function UserPanel() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  return (
    <div className="flex h-[52px] flex-shrink-0 items-center gap-2 bg-discord-bg-floating/50 px-2">
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white',
            user.avatar ? '' : 'bg-discord-blurple',
          )}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            user.username[0]?.toUpperCase()
          )}
        </div>
        {/* Status indicator */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-discord-bg-floating/50',
            user.status === 'online' && 'bg-status-online',
            user.status === 'idle' && 'bg-status-idle',
            user.status === 'dnd' && 'bg-status-dnd',
            user.status === 'offline' && 'bg-status-offline',
            !user.status && 'bg-status-online',
          )}
        />
      </div>

      {/* Username */}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-discord-text-primary">
          {user.username}
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="flex h-8 w-8 items-center justify-center rounded text-discord-interactive-normal hover:bg-discord-bg-primary/50 hover:text-discord-interactive-hover"
        title="Log Out"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  );
}
