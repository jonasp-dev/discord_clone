import { create } from 'zustand';

interface UIState {
  // Sidebar toggles
  isMemberSidebarOpen: boolean;
  toggleMemberSidebar: () => void;
  setMemberSidebarOpen: (open: boolean) => void;

  // Modal states
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Active selections (derived from route, but useful for socket context)
  activeServerId: string | null;
  activeChannelId: string | null;
  activeConversationId: string | null;
  setActiveServer: (serverId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;
  setActiveConversation: (conversationId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMemberSidebarOpen: true,
  toggleMemberSidebar: () =>
    set((state) => ({ isMemberSidebarOpen: !state.isMemberSidebarOpen })),
  setMemberSidebarOpen: (open) => set({ isMemberSidebarOpen: open }),

  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  activeServerId: null,
  activeChannelId: null,
  activeConversationId: null,
  setActiveServer: (serverId) => set({ activeServerId: serverId }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),
}));
