import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/modules/workspace/stores/workspace-store';

export function useUserWorkspaces() {
  const setUserWorkspaces = useWorkspaceStore(
    (state) => state.setUserWorkspaces
  );

  return useQuery({
    queryKey: ['user-workspaces'],
    queryFn: async () => {
      const response = await fetch('/api/workspaces');
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      const data = await response.json();

      // Update Zustand store
      setUserWorkspaces(data.workspaces);

      return data.workspaces;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCurrentWorkspace(slug: string) {
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace
  );

  return useQuery({
    queryKey: ['workspace', slug],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data = await response.json();

      // Update Zustand store
      setCurrentWorkspace(data.workspace);

      return data.workspace;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      description?: string;
    }) => {
      const response = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create workspace');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user workspaces to refetch
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] });
    },
  });
}
