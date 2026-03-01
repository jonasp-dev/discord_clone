import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCreateChannel } from '@/hooks/queries/useChannels';
import { useUIStore } from '@/stores/uiStore';
import type { ChannelType } from '@/types/models';
import { CHANNEL_NAME_MAX_LENGTH } from '@/lib/constants';

/**
 * Modal for creating a new channel inside the current server.
 * Supports TEXT and VOICE channel types.
 */
export function CreateChannelModal() {
  const location = useLocation();
  // URL: /channels/{serverId} or /channels/{serverId}/{channelId}
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const serverId = pathSegments[1] && pathSegments[1] !== '@me' ? pathSegments[1] : undefined;
  const closeModal = useUIStore((s) => s.closeModal);
  const createChannel = useCreateChannel(serverId!);

  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('TEXT');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed) {
      setError('Channel name is required');
      return;
    }

    try {
      await createChannel.mutateAsync({ name: trimmed, type });
      closeModal();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create channel';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-discord-bg-secondary p-6">
        <h2 className="text-xl font-bold text-discord-text-primary">
          Create Channel
        </h2>
        <p className="mt-1 text-sm text-discord-text-muted">
          Add a new channel to the server.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Channel type */}
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-discord-text-muted">
              Channel Type
            </legend>
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors ${
                  type === 'TEXT'
                    ? 'bg-discord-interactive-active/20'
                    : 'bg-discord-bg-primary hover:bg-discord-interactive-hover/10'
                }`}
              >
                <input
                  type="radio"
                  name="channelType"
                  value="TEXT"
                  checked={type === 'TEXT'}
                  onChange={() => setType('TEXT')}
                  className="sr-only"
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-discord-text-muted">
                  <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-discord-text-primary">Text</p>
                  <p className="text-xs text-discord-text-muted">
                    Send messages, images, and more
                  </p>
                </div>
                <div className="ml-auto">
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      type === 'TEXT'
                        ? 'border-discord-blurple bg-discord-blurple'
                        : 'border-discord-text-muted'
                    }`}
                  >
                    {type === 'TEXT' && (
                      <svg viewBox="0 0 20 20" fill="white" className="h-full w-full p-0.5">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors ${
                  type === 'VOICE'
                    ? 'bg-discord-interactive-active/20'
                    : 'bg-discord-bg-primary hover:bg-discord-interactive-hover/10'
                }`}
              >
                <input
                  type="radio"
                  name="channelType"
                  value="VOICE"
                  checked={type === 'VOICE'}
                  onChange={() => setType('VOICE')}
                  className="sr-only"
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-discord-text-muted">
                  <path d="M12 3C10.34 3 9 4.37 9 6.07V11.93C9 13.63 10.34 15 12 15C13.66 15 15 13.63 15 11.93V6.07C15 4.37 13.66 3 12 3Z" />
                  <path d="M19 11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11H7C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11H19Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-discord-text-primary">Voice</p>
                  <p className="text-xs text-discord-text-muted">
                    Hang out with voice and video
                  </p>
                </div>
                <div className="ml-auto">
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      type === 'VOICE'
                        ? 'border-discord-blurple bg-discord-blurple'
                        : 'border-discord-text-muted'
                    }`}
                  >
                    {type === 'VOICE' && (
                      <svg viewBox="0 0 20 20" fill="white" className="h-full w-full p-0.5">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </fieldset>

          {/* Channel name */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-discord-text-muted">
              Channel Name
            </label>
            <div className="flex items-center rounded-md bg-discord-bg-primary px-3">
              <span className="mr-1 text-discord-text-muted">
                {type === 'TEXT' ? '#' : '🔊'}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-channel"
                maxLength={CHANNEL_NAME_MAX_LENGTH}
                className="w-full bg-transparent py-2.5 text-sm text-discord-text-primary placeholder-discord-text-muted outline-none"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-discord-danger">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-discord-text-secondary hover:text-discord-text-primary hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createChannel.isPending}
              className="rounded-md bg-discord-blurple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-discord-blurple-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createChannel.isPending ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
