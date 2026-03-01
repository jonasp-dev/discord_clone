// Socket.IO event types — mirrors backend socket.events.ts and socket.types.ts

import type { Message, DirectMessage, UserStatus } from './models';

// --- Client → Server events ---

export interface ClientToServerEvents {
  'channel:join': (payload: { channelId: string }) => void;
  'channel:leave': (payload: { channelId: string }) => void;
  'message:send': (payload: { channelId: string; content: string }) => void;
  'typing:start': (payload: { channelId: string }) => void;
  'typing:stop': (payload: { channelId: string }) => void;
  'dm:send': (payload: { conversationId: string; content: string }) => void;
  'dm:typing:start': (payload: { conversationId: string }) => void;
  'dm:typing:stop': (payload: { conversationId: string }) => void;
  'presence:status': (payload: { userId: string; status: UserStatus }) => void;
}

// --- Server → Client events ---

export interface ServerToClientEvents {
  'user:joined': (payload: { channelId: string; userId: string; username: string }) => void;
  'user:left': (payload: { channelId: string; userId: string }) => void;
  'message:new': (payload: Message) => void;
  'typing:start': (payload: { channelId: string; userId: string; username: string }) => void;
  'typing:stop': (payload: { channelId: string; userId: string }) => void;
  'dm:new': (payload: DirectMessage) => void;
  'dm:typing:start': (payload: { conversationId: string; userId: string; username: string }) => void;
  'dm:typing:stop': (payload: { conversationId: string; userId: string }) => void;
  'presence:update': (payload: { userId: string; status: UserStatus }) => void;
  error: (payload: { message: string }) => void;
}
