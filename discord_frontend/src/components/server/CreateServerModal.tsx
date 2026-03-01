import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateServer } from '@/hooks/queries/useServers';
import { useUIStore } from '@/stores/uiStore';
import { ROUTES } from '@/lib/constants';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

export function CreateServerModal() {
  const navigate = useNavigate();
  const closeModal = useUIStore((s) => s.closeModal);
  const createServer = useCreateServer();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createServer.mutate(
      { name: name.trim() },
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
    createServer.error &&
    ((createServer.error as AxiosError<ApiResponse<never>>).response?.data
      ?.error ?? 'Failed to create server.');

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
          Create a Server
        </h2>
        <p className="mt-2 text-center text-sm text-discord-text-muted">
          Give your new server a personality with a name. You can always change
          it later.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded bg-discord-red/10 p-3 text-sm text-discord-red">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="server-name"
              className="text-xs font-bold uppercase text-discord-text-secondary"
            >
              Server Name
            </label>
            <input
              id="server-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              autoFocus
              placeholder="My Awesome Server"
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
              disabled={createServer.isPending || !name.trim()}
              className="rounded-[3px] bg-discord-blurple px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-discord-blurple/80 disabled:opacity-50"
            >
              {createServer.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
