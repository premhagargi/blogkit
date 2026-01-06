'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  BlogPostFilters,
  BlogPostSort,
  BlogPostPagination,
} from '../actions/blog-table-actions';
import { BlogPost } from '@/types/blog';

interface UseBlogPostsTableParams {
  workspaceSlug: string;
  blogId: string;
  filters?: BlogPostFilters;
  sort?: BlogPostSort;
  pagination?: BlogPostPagination;
}

interface BlogPostsTableResult {
  success: boolean;
  blogPosts?: BlogPost[];
  error?: string;
  pagination?: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function useBlogPostsTable({
  workspaceSlug,
  blogId,
  filters = {},
  sort = { field: 'createdAt', direction: 'desc' },
  pagination = { page: 1, pageSize: 10 },
}: UseBlogPostsTableParams): {
  data: BlogPostsTableResult | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
} {
  return useQuery({
    queryKey: [
      'blog-posts-table',
      workspaceSlug,
      blogId,
      filters,
      sort,
      pagination,
    ],
    queryFn: async (): Promise<BlogPostsTableResult> => {
      // Build query parameters
      const params = new URLSearchParams({
        sortField: sort.field,
        sortDirection: sort.direction,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      // Add filters to params
      if (filters.search) params.set('search', filters.search);
      if (filters.statuses?.length)
        params.set('statuses', filters.statuses.join(','));
      if (filters.categories?.length)
        params.set('categories', filters.categories.join(','));
      if (filters.tags?.length) params.set('tags', filters.tags.join(','));
      if (filters.authorIds?.length)
        params.set('authorIds', filters.authorIds.join(','));
      if (filters.featured !== undefined)
        params.set('featured', filters.featured.toString());
      if (filters.pinned !== undefined)
        params.set('pinned', filters.pinned.toString());

      const response = await fetch(`/api/blogs/${blogId}/posts?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!(workspaceSlug && blogId),
    staleTime: 5 * 60 * 1000, // 5 minutes (increased)
    gcTime: 10 * 60 * 1000, // Keep in cache longer
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching new
    // Or use keepPreviousData: true (deprecated but still works)
  });
}

// Keep the legacy client-side processing hook for backward compatibility or specific use cases
export function useBlogPostsTableClientSide({
  workspaceSlug,
  blogId,
  filters = {},
  sort = { field: 'createdAt', direction: 'desc' },
  pagination = { page: 1, pageSize: 10 },
}: UseBlogPostsTableParams): {
  data: BlogPostsTableResult | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
} {
  // This is the old implementation that fetches all posts and processes client-side
  // Keep it for cases where you need client-side processing

  // Fetch base data only once
  const {
    data: baseData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['blog-posts-base', workspaceSlug, blogId],
    queryFn: async () => {
      const response = await fetch(
        `/api/blogs/${blogId}/posts?page=1&pageSize=1000`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!(workspaceSlug && blogId),
    staleTime: 5 * 60 * 1000, // 5 minutes - longer since we do client-side operations
    refetchOnWindowFocus: false,
  });

  // Process data client-side
  const processedData = useMemo((): BlogPostsTableResult | undefined => {
    if (!baseData?.success || !baseData.blogPosts) {
      return baseData as BlogPostsTableResult;
    }

    // Apply filters
    const filteredPosts = filterPosts(baseData.blogPosts, filters);

    // Apply sorting
    const sortedPosts = sortPosts(filteredPosts, sort);

    // Apply pagination
    const { posts: paginatedPosts, pagination: paginationInfo } = paginatePosts(
      sortedPosts,
      pagination
    );

    return {
      success: true,
      blogPosts: paginatedPosts,
      pagination: paginationInfo,
    };
  }, [baseData, filters, sort, pagination]);

  return {
    data: processedData,
    isLoading,
    isFetching,
    error,
  };
}

// Helper functions for client-side processing (moved from previous implementation)
function filterPosts(posts: BlogPost[], filters: BlogPostFilters): BlogPost[] {
  return posts.filter((post) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = post.title.toLowerCase().includes(searchLower);
      const matchesExcerpt = post.excerpt?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesExcerpt) {
        return false;
      }
    }

    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(post.status as any)) {
        return false;
      }
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      const hasMatchingCategory = post.categories?.some((cat) =>
        filters.categories!.includes(cat.id)
      );
      if (!hasMatchingCategory) {
        return false;
      }
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = post.tags?.some((tag) =>
        filters.tags!.includes(tag.id)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Author filter
    if (filters.authorIds && filters.authorIds.length > 0) {
      const isAuthor =
        post.authorId && filters.authorIds.includes(post.authorId);
      const isCoAuthor = post.coAuthorIds?.some((id) =>
        filters.authorIds!.includes(id)
      );
      if (!isAuthor && !isCoAuthor) {
        return false;
      }
    }

    // Featured filter
    if (filters.featured !== undefined) {
      if (post.featured !== filters.featured) {
        return false;
      }
    }

    // Pinned filter
    if (filters.pinned !== undefined) {
      if (post.pinned !== filters.pinned) {
        return false;
      }
    }

    return true;
  });
}

function sortPosts(posts: BlogPost[], sort: BlogPostSort): BlogPost[] {
  return [...posts].sort((a, b) => {
    // Always sort pinned posts first
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    let aValue: any;
    let bValue: any;

    switch (sort.field) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'publishedAt':
        aValue = a.publishedAt || new Date(0);
        bValue = b.publishedAt || new Date(0);
        break;
      case 'createdAt':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'updatedAt':
        aValue = a.updatedAt;
        bValue = b.updatedAt;
        break;
      case 'views':
        aValue = a.views || 0;
        bValue = b.views || 0;
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }

    if (aValue < bValue) {
      return sort.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sort.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

function paginatePosts(posts: BlogPost[], pagination: BlogPostPagination) {
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedPosts = posts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(posts.length / pagination.pageSize);

  return {
    posts: paginatedPosts,
    pagination: {
      totalCount: posts.length,
      totalPages,
      currentPage: pagination.page,
      pageSize: pagination.pageSize,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    },
  };
}
