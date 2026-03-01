import { create } from 'zustand';
import type { UserStatus } from '@/types/models';

interface PresenceState {
  /** Map of userId → their current status */
  statuses: Record<string, UserStatus>;

  setStatus: (userId: string, status: UserStatus) => void;
  setBulkStatuses: (statuses: Record<string, UserStatus>) => void;
  getStatus: (userId: string) => UserStatus;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  statuses: {},

  setStatus: (userId, status) =>
    set((state) => ({
      statuses: { ...state.statuses, [userId]: status },
    })),

  setBulkStatuses: (statuses) =>
    set((state) => ({
      statuses: { ...state.statuses, ...statuses },
    })),

  getStatus: (userId) => get().statuses[userId] ?? 'offline',
}));
