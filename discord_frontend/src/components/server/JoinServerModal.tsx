import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJoinServer } from '@/hooks/queries/useServers';
import { useUIStore } from '@/stores/uiStore';
import { ROUTES } from '@/lib/constants';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

export function JoinServerModal() {
  const navigate = useNavigate();
  const closeModal = useUIStore((s) => s.closeModal);
  const joinServer = useJoinServer();
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim();
    if (!code) return;

    joinServer.mutate(
      { inviteCode: code },
      {
        onSuccess: (server) => {
          closeModal();
          const firstChannel = server.channels?.[0];
          if (firstChannel) {
            navigate(ROUTES.SERVER_CHANNEL(server.id, firstChannel.id));
          } else {
            navigate(`/channels/${server.id}`);
          }
        },
      },
    );
  };

  const errorMessage =
    joinServer.error &&
    ((joinServer.error as AxiosError<ApiResponse<never>>).response?.data
      ?.error ?? 'Failed to join server. Check your invite code.');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-md rounded-md bg-discord-bg-primary p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-bold text-discord-text-primary">
          Join a Server
        </h2>
        <p className="mt-2 text-center text-sm text-discord-text-muted">
          Enter an invite code below to join an existing server.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded bg-discord-red/10 p-3 text-sm text-discord-red">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="invite-code"
              className="text-xs font-bold uppercase text-discord-text-secondary"
            >
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              autoFocus
              placeholder="Enter an invite code"
              className="rounded-[3px] border-none bg-discord-bg-tertiary px-3 py-2.5 text-discord-text-primary outline-none placeholder:text-discord-text-muted focus:ring-2 focus:ring-discord-blurple"
            />
          </div>

          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-discord-text-secondary hover:text-discord-text-primary hover:underline"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={joinServer.isPending || !inviteCode.trim()}
              className="rounded-[3px] bg-discord-blurple px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-discord-blurple/80 disabled:opacity-50"
            >
              {joinServer.isPending ? 'Joining...' : 'Join Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
