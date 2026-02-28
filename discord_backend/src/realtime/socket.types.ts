export interface SocketUser {
  userId: string;
  socketId: string;
}

export interface NewMessagePayload {
  channelId: string;
  content: string;
}

export interface TypingPayload {
  channelId: string;
  userId: string;
  username: string;
}

export interface JoinChannelPayload {
  channelId: string;
}

export interface LeaveChannelPayload {
  channelId: string;
}

export interface PresencePayload {
  userId: string;
  status: 'online' | 'offline' | 'idle' | 'dnd';
}

// ─── Direct Messaging Payloads ──────────────────────────────────────────

export interface DmSendPayload {
  conversationId: string;
  content: string;
}

export interface DmTypingPayload {
  conversationId: string;
}
