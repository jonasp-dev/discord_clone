export const API_BASE_URL = '/api/v1';
export const WS_URL = window.location.origin;

export const QUERY_KEYS = {
  currentUser: ['currentUser'] as const,
  user: (userId: string) => ['user', userId] as const,
  servers: ['servers'] as const,
  server: (serverId: string) => ['server', serverId] as const,
  channels: (serverId: string) => ['channels', serverId] as const,
  channel: (channelId: string) => ['channel', channelId] as const,
  messages: (channelId: string) => ['messages', channelId] as const,
  conversations: ['conversations'] as const,
  conversation: (conversationId: string) => ['conversation', conversationId] as const,
  dmMessages: (conversationId: string) => ['dmMessages', conversationId] as const,
} as const;

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  APP: '/channels',
  DMS: '/channels/@me',
  DM_CONVERSATION: (conversationId: string) => `/channels/@me/${conversationId}`,
  SERVER_CHANNEL: (serverId: string, channelId: string) => `/channels/${serverId}/${channelId}`,
  INVITE: (inviteCode: string) => `/invite/${inviteCode}`,
} as const;

export const PRESENCE_STATUSES = ['online', 'idle', 'dnd', 'offline'] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export const MESSAGE_MAX_LENGTH = 2000;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 6;
export const SERVER_NAME_MAX_LENGTH = 100;
export const CHANNEL_NAME_MAX_LENGTH = 100;

export const TYPING_DEBOUNCE_MS = 2000;
export const TYPING_TIMEOUT_MS = 3000;

export const DEFAULT_PAGE_SIZE = 50;
