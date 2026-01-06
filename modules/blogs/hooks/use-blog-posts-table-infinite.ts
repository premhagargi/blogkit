'use client';

import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import {
    BlogPostFilters,
    BlogPostSort,
} from '../actions/blog-table-actions';
import { BlogPost } from '@/types/blog';

interface UseBlogPostsTableInfiniteParams {
    workspaceSlug: string;
    blogId: string;
    filters?: BlogPostFilters;
    sort?: BlogPostSort;
    pageSize?: number;
}

interface BlogPostsPageResult {
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

export function useBlogPostsTableInfinite({
    workspaceSlug,
    blogId,
    filters = {},
    sort = { field: 'createdAt', direction: 'desc' },
    pageSize = 20,
}: UseBlogPostsTableInfiniteParams) {
    return useInfiniteQuery({
        queryKey: [
            'blog-posts-table-infinite',
            workspaceSlug,
            blogId,
            filters,
            sort,
            pageSize,
        ],
        queryFn: async ({ pageParam = 1 }): Promise<BlogPostsPageResult> => {
            // Build query parameters
            const params = new URLSearchParams({
                sortField: sort.field,
                sortDirection: sort.direction,
                page: pageParam.toString(),
                pageSize: pageSize.toString(),
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
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (!lastPage.pagination?.hasNextPage) {
                return undefined;
            }
            return lastPage.pagination.currentPage + 1;
        },
        getPreviousPageParam: (firstPage) => {
            if (!firstPage.pagination?.hasPreviousPage) {
                return undefined;
            }
            return firstPage.pagination.currentPage - 1;
        },
        enabled: !!(workspaceSlug && blogId),
        // Keep previous data while fetching new data for instant filter/sort response
        placeholderData: keepPreviousData,
        // Reduced stale time for fresher data on filter changes
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes cache
        refetchOnWindowFocus: false,
        // Retry configuration
        retry: 1,
        retryDelay: 500,
    });
}

