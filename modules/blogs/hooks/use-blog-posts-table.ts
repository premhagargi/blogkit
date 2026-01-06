'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BlogPostFilters,
  BlogPostSort,
  BlogPostPagination,
  getBlogPostsForTable,
} from '../actions/blog-table-actions';

interface UseBlogPostsTableParams {
  workspaceSlug: string;
  blogId: string;
  filters?: BlogPostFilters;
  sort?: BlogPostSort;
  pagination?: BlogPostPagination;
}

export function useBlogPostsTable({
  workspaceSlug,
  blogId,
  filters,
  sort,
  pagination,
}: UseBlogPostsTableParams) {
  return useQuery({
    queryKey: [
      'blog-posts-table',
      workspaceSlug,
      blogId,
      filters,
      sort,
      pagination,
    ],
    queryFn: () =>
      getBlogPostsForTable(workspaceSlug, blogId, filters, sort, pagination),
    enabled: !!(workspaceSlug && blogId),
    staleTime: 30 * 1000, // 30 seconds - shorter than workspace queries since blog posts change more frequently
    refetchOnWindowFocus: false,
  });
}

// Hook for invalidating blog posts cache when posts are updated
export function useBlogPostsTableMutations(
  workspaceSlug: string,
  blogId: string
) {
  const queryClient = useQueryClient();

  const invalidateBlogPosts = () => {
    queryClient.invalidateQueries({
      queryKey: ['blog-posts-table', workspaceSlug, blogId],
    });
  };

  const optimisticTogglePin = useMutation({
    mutationFn: async ({
      postId,
      pinned,
    }: {
      postId: string;
      pinned: boolean;
    }) => {
      // This would be your actual API call to toggle pin
      const response = await fetch(`/api/blogs/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      if (!response.ok) throw new Error('Failed to toggle pin');
      return response.json();
    },
    onMutate: async ({ postId, pinned }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['blog-posts-table', workspaceSlug, blogId],
      });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({
        queryKey: ['blog-posts-table', workspaceSlug, blogId],
      });

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: ['blog-posts-table', workspaceSlug, blogId] },
        (old: any) => {
          if (!old?.blogPosts) return old;

          return {
            ...old,
            blogPosts: old.blogPosts.map((post: any) =>
              post.id === postId ? { ...post, pinned } : post
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      invalidateBlogPosts();
    },
  });

  return {
    invalidateBlogPosts,
    optimisticTogglePin,
  };
}
