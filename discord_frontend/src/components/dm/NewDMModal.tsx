import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useCreateConversation } from '@/hooks/queries/useDMs';
import { usersApi } from '@/api/users.api';
import { ROUTES } from '@/lib/constants';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

/**
 * Modal to start a new DM. Looks up a user by username, then calls
 * the idempotent POST /dms endpoint to get-or-create a conversation.
 */
export function NewDMModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const navigate = useNavigate();
  const createConversation = useCreateConversation();

  const [username, setUsername] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || isPending) return;

    setError(null);
    setIsPending(true);

    try {
      // Step 1: resolve username → userId
      const user = await usersApi.getUserByUsername(trimmed);

      // Step 2: get-or-create conversation (idempotent)
      createConversation.mutate(
        { targetUserId: user.id },
        {
          onSuccess: (conversation) => {
            closeModal();
            navigate(ROUTES.DM_CONVERSATION(conversation.id));
          },
          onError: (err) => {
            const axiosErr = err as AxiosError<ApiResponse<never>>;
            setError(
              axiosErr.response?.data?.error ?? 'Failed to open conversation.',
            );
            setIsPending(false);
          },
        },
      );
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<never>>;
      const status = axiosErr.response?.status;
      if (status === 404) {
        setError(`No user found with username "${trimmed}".`);
      } else {
        setError(axiosErr.response?.data?.error ?? 'Something went wrong.');
      }
      setIsPending(false);
    }
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
          Open a Conversation
        </h2>
        <p className="mt-1 text-sm text-discord-text-muted">
          Enter the exact username of the person you want to message.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {error && (
            <div className="rounded bg-discord-red/10 px-3 py-2 text-sm text-discord-red">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="dm-username"
              className="text-xs font-bold uppercase text-discord-text-secondary"
            >
              Username
            </label>
            <input
              id="dm-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              placeholder="username"
              autoFocus
              autoComplete="off"
              className="rounded-[3px] bg-discord-bg-tertiary px-3 py-2.5 text-sm text-discord-text-primary outline-none placeholder:text-discord-text-muted focus:ring-2 focus:ring-discord-blurple"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-discord-text-secondary hover:text-discord-text-primary hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!username.trim() || isPending}
              className="rounded-[3px] bg-discord-blurple px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-discord-blurple/80 disabled:opacity-50"
            >
              {isPending ? 'Opening…' : 'Open DM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
