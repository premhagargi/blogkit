'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getWorkspaceAuthors,
  addAuthor,
  updateAuthor,
  deleteAuthor,
} from '@/modules/workspace/actions/workspace-actions';

// Types
interface Author {
  id: string;
  name: string;
  bio?: string;
  image?: string;
  email?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  posts: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAuthorData {
  name: string;
  bio?: string;
  email?: string;
  website?: string;
  image?: string;
  socialLinks?: Record<string, string>;
}

interface UpdateAuthorData {
  name: string;
  bio?: string;
  email?: string;
  website?: string;
  image?: string;
  socialLinks?: Record<string, string>;
}

// Main hook for authors query
export function useAuthors(workspaceSlug: string) {
  return useQuery({
    queryKey: ['authors', workspaceSlug],
    queryFn: () => getWorkspaceAuthors(workspaceSlug),
    enabled: !!workspaceSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    gcTime: 30 * 60 * 1000, // 30 minutes - keep authors in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have cached data
  });
}

// Hook for creating authors
export function useCreateAuthor(workspaceSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAuthorData) => addAuthor(workspaceSlug, data),

    // REMOVED: onMutate with optimistic update

    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create author';
      toast.error(errorMessage);
    },

    // Wait for DB update, then refetch and update UI
    onSuccess: async () => {
      // Refetch and wait for the query to complete before updating UI
      await queryClient.refetchQueries({
        queryKey: ['authors', workspaceSlug],
      });
      toast.success('Author created successfully!');
    },
  });
}

// Hook for updating authors
export function useUpdateAuthor(workspaceSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      authorId,
      data,
    }: {
      authorId: string;
      data: UpdateAuthorData;
    }) => updateAuthor(workspaceSlug, authorId, data),

    // REMOVED: onMutate with optimistic update

    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update author';
      toast.error(errorMessage);
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['authors', workspaceSlug],
      });
      toast.success('Author updated successfully!');
    },
  });
}

// Hook for deleting authors
export function useDeleteAuthor(workspaceSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (authorId: string) => deleteAuthor(workspaceSlug, authorId),

    // REMOVED: onMutate with optimistic update

    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete author';
      toast.error(errorMessage);
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['authors', workspaceSlug],
      });
      toast.success('Author deleted successfully!');
    },
  });
}
