import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useServer } from '@/hooks/queries/useServers';
import { useUIStore } from '@/stores/uiStore';

/**
 * Modal that displays a server's invite code and lets the user copy it.
 * Uses useLocation() to extract serverId — consistent with other
 * layout-level components that can't rely on useParams().
 */
export function InviteModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const { pathname } = useLocation();

  // /channels/:serverId/... or /channels/:serverId
  const segments = pathname.split('/');
  const serverId = segments[2] !== '@me' ? segments[2] : undefined;

  const { data: server, isLoading } = useServer(serverId);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!server?.inviteCode) return;
    navigator.clipboard.writeText(server.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-md rounded-md bg-discord-bg-primary p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-discord-text-primary">
          Invite People
        </h2>
        {server && (
          <p className="mt-1 text-sm text-discord-text-muted">
            Share this invite code to let people join{' '}
            <span className="font-medium text-discord-text-secondary">
              {server.name}
            </span>
            .
          </p>
        )}

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-bold uppercase text-discord-text-secondary">
            Server Invite Code
          </label>

          {isLoading ? (
            <div className="h-10 animate-pulse rounded bg-discord-bg-secondary" />
          ) : (
            <div className="flex gap-2">
              <input
                readOnly
                value={server?.inviteCode ?? ''}
                className="flex-1 rounded-[3px] bg-discord-bg-tertiary px-3 py-2.5 text-sm font-mono text-discord-text-primary outline-none"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                disabled={!server?.inviteCode}
                className="flex-shrink-0 rounded-[3px] bg-discord-blurple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-discord-blurple/80 disabled:opacity-50"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          <p className="mt-2 text-xs text-discord-text-muted">
            Others can join using this code from the &ldquo;Join a Server&rdquo; option.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm text-discord-text-secondary hover:text-discord-text-primary hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
