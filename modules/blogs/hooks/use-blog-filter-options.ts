'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getWorkspaceAuthors } from '../actions/blog-actions';
import { getWorkspaceCategoriesWithStats } from '../actions/category-actions';
import { getWorkspaceTagsWithStats } from '../actions/tag-actions-new';

export function useBlogFilterOptions(workspaceSlug: string, pageId: string) {
  const queryClient = useQueryClient();

  // Prefetch all filter options in parallel on mount
  useEffect(() => {
    if (workspaceSlug && pageId) {
      // Prefetch categories
      queryClient.prefetchQuery({
        queryKey: ['workspace-categories', workspaceSlug, pageId],
        queryFn: () => getWorkspaceCategoriesWithStats(workspaceSlug, pageId),
        staleTime: 10 * 60 * 1000,
      });

      // Prefetch tags
      queryClient.prefetchQuery({
        queryKey: ['workspace-tags', workspaceSlug, pageId],
        queryFn: () => getWorkspaceTagsWithStats(workspaceSlug, pageId),
        staleTime: 10 * 60 * 1000,
      });

      // Prefetch authors
      queryClient.prefetchQuery({
        queryKey: ['workspace-authors', workspaceSlug],
        queryFn: () => getWorkspaceAuthors(workspaceSlug),
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [workspaceSlug, pageId, queryClient]);

  // Categories for specific page
  const categoriesQuery = useQuery({
    queryKey: ['workspace-categories', workspaceSlug, pageId],
    queryFn: () => getWorkspaceCategoriesWithStats(workspaceSlug, pageId),
    enabled: !!workspaceSlug && !!pageId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have data
  });

  // Tags for specific page
  const tagsQuery = useQuery({
    queryKey: ['workspace-tags', workspaceSlug, pageId],
    queryFn: () => getWorkspaceTagsWithStats(workspaceSlug, pageId),
    enabled: !!workspaceSlug && !!pageId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Authors remain workspace-wide
  const authorsQuery = useQuery({
    queryKey: ['workspace-authors', workspaceSlug],
    queryFn: () => getWorkspaceAuthors(workspaceSlug),
    enabled: !!workspaceSlug,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    categories: categoriesQuery.data?.categories || [],
    tags: tagsQuery.data?.tags || [],
    authors: authorsQuery.data || [],
    isLoading:
      categoriesQuery.isLoading ||
      tagsQuery.isLoading ||
      authorsQuery.isLoading,
  };
}
