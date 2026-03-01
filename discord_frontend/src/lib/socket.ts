import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/**
 * Get or create the Socket.IO client instance.
 * Connects with the user's access token for authentication.
 */
export function getSocket(token: string): AppSocket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  socket.on('error', ({ message }) => {
    console.error('[Socket] Server error:', message);
  });

  return socket;
}

/**
 * Disconnect and destroy the socket instance.
 * Call on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance (may be null if not connected).
 */
export function getCurrentSocket(): AppSocket | null {
  return socket;
}
