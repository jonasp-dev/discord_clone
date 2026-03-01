// Domain models — mirrors the backend Prisma schema

export type ChannelType = 'TEXT' | 'VOICE';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface Server {
  id: string;
  name: string;
  icon: string | null;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  memberCount?: number;
  channels?: Channel[];
  members?: ServerMember[];
}

export interface ServerMember {
  id: string;
  username: string;
  avatar: string | null;
  status: UserStatus;
  role?: MemberRole;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  serverId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  channelId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: DirectMessage | null;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    status: UserStatus;
  };
}

export interface DirectMessage {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
