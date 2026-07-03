import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      // Active run context
      activeRunId: null,
      setActiveRunId: (id) => set({ activeRunId: id }),

      // Active browser tab in results view
      activeBrowser: 'chromium',
      setActiveBrowser: (browser) => set({ activeBrowser: browser }),

      // Selected issue in results view
      activeIssueId: null,
      setActiveIssueId: (id) => set({ activeIssueId: id }),

      // Sidebar collapse state
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // Mobile sidebar state
      mobileSidebarOpen: false,
      setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),

      // Theme state
      theme: 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'testpilot-app-store',
      // Only persist these keys
      partialize: (state) => ({
        user: state.user,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

export default useAppStore;
