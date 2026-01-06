import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  createdAt: string;
}

interface WorkspaceStore {
  // Current workspace (from URL)
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;

  // User's workspaces list
  userWorkspaces: Workspace[];
  setUserWorkspaces: (workspaces: Workspace[]) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

      userWorkspaces: [],
      setUserWorkspaces: (workspaces) => set({ userWorkspaces: workspaces }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        userWorkspaces: state.userWorkspaces,
        // Don't persist currentWorkspace as it comes from URL
      }),
    }
  )
);
