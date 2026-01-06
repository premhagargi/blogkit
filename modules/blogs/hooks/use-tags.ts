'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getWorkspaceTagsWithStats,
  createTag,
  updateTag,
  deleteTag,
} from '../actions/tag-actions-new';

// Types
interface TagWithStats {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  workspaceId: string;
  pageId: string;
  posts: number;
  isPublic: boolean;
  traffic: number;
  leads: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTagData {
  name: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
}

interface UpdateTagData {
  name?: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
}

// Main hook for tags query
export function useTags(workspaceSlug: string, blogId: string) {
  const query = useQuery({
    queryKey: ['tags', workspaceSlug, blogId],
    queryFn: () => getWorkspaceTagsWithStats(workspaceSlug, blogId),
    enabled: !!(workspaceSlug && blogId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have cached data
  });
  return query;
}

// Hook for creating tags
export function useCreateTag(workspaceSlug: string, blogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagData) => createTag(workspaceSlug, blogId, data),

    onError: () => {
      toast.error('Failed to create tag');
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['tags', workspaceSlug, blogId],
      });
      toast.success('Tag created successfully!');
    },
  });
}

// Hook for updating tags
export function useUpdateTag(workspaceSlug: string, blogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, data }: { tagId: string; data: UpdateTagData }) =>
      updateTag(workspaceSlug, tagId, data),

    onError: () => {
      toast.error('Failed to update tag');
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['tags', workspaceSlug, blogId],
      });
      toast.success('Tag updated successfully!');
    },
  });
}

// Hook for deleting tags
export function useDeleteTag(workspaceSlug: string, blogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => deleteTag(workspaceSlug, tagId),

    onError: () => {
      toast.error('Failed to delete tag');
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['tags', workspaceSlug, blogId],
      });
      toast.success('Tag deleted successfully!');
    },
  });
}

