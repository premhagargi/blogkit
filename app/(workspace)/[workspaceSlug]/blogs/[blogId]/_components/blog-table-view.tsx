"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { BlogTableHeader } from "./blog-table-header";
import { BlogTableFilters } from "./blog-table-filters";
import { BlogTableContent } from "./blog-table-content";
import { BlogPost } from "@/types/blog";
import {
  BlogTableProvider,
  useBlogTable,
} from "@/modules/blogs/contexts/BlogTableContext";
import { useBlogPostsTableInfinite } from "@/modules/blogs/hooks/use-blog-posts-table-infinite";
import {
  BlogPostFilters,
  BlogPostSort,
} from "@/modules/blogs/actions/blog-table-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogTableViewProps {
  workspaceSlug: string;
  currentPage: {
    id: string;
    title: string;
    type: string;
  };
}

const PAGE_SIZE = 20;

function BlogTable({ workspaceSlug, currentPage }: BlogTableViewProps) {
  const searchParams = useSearchParams();

  // Get initial filter values from URL query params
  const initialCategory = searchParams.get("category");
  const initialTag = searchParams.get("tag");
  const initialAuthor = searchParams.get("author");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [tagFilters, setTagFilters] = useState<string[]>(
    initialTag ? [initialTag] : []
  );
  const [authorFilters, setAuthorFilters] = useState<string[]>(
    initialAuthor ? [initialAuthor] : []
  );
  const [sortConfig, setSortConfig] = useState<BlogPostSort>({
    field: "createdAt",
    direction: "desc",
  });

  // Track refresh state for animation
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref for scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track if we've ever had successful data
  const hasEverLoadedData = useRef(false);

  // Debounce search - reduced to 300ms for snappier feel like Notion
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { pinnedIds } = useBlogTable();

  const filters: BlogPostFilters = useMemo(() => {
    const filterObj: BlogPostFilters = {};

    if (debouncedSearch) {
      filterObj.search = debouncedSearch;
    }

    if (statusFilters.length > 0) {
      filterObj.statuses = statusFilters as any[];
    }

    if (categoryFilters.length > 0) {
      filterObj.categories = categoryFilters;
    }

    if (tagFilters.length > 0) {
      filterObj.tags = tagFilters;
    }

    if (authorFilters.length > 0) {
      filterObj.authorIds = authorFilters;
    }

    return filterObj;
  }, [
    debouncedSearch,
    statusFilters,
    categoryFilters,
    tagFilters,
    authorFilters,
  ]);

  // Fetch data with infinite query hook
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    isPlaceholderData, // True when showing cached data during filter/sort transition
  } = useBlogPostsTableInfinite({
    workspaceSlug,
    blogId: currentPage.id,
    filters,
    sort: sortConfig,
    pageSize: PAGE_SIZE,
  });

  // Update the ref when we successfully get data
  useEffect(() => {
    if (data?.pages?.[0]?.success) {
      hasEverLoadedData.current = true;
    }
  }, [data]);

  // Flatten all pages of blog posts into a single array
  const blogPosts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.blogPosts || []);
  }, [data]);

  // OPTIMIZATION: Client-side filtering for instant response while server fetches
  // This gives Notion-like instant filtering on cached data
  const clientFilteredPosts = useMemo(() => {
    // Only apply client-side filtering when we're showing placeholder data (transitioning)
    // This gives instant feedback while the real query runs in background
    if (!isPlaceholderData || blogPosts.length === 0) {
      return blogPosts;
    }

    return blogPosts.filter((post) => {
      // Search filter (client-side)
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
          post.title?.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilters.length > 0) {
        if (!statusFilters.includes(post.status)) return false;
      }

      // Category filter  
      if (categoryFilters.length > 0) {
        const postCategoryIds = post.categories?.map(c => c.id) || [];
        const hasMatchingCategory = categoryFilters.some(catId => postCategoryIds.includes(catId));
        if (!hasMatchingCategory) return false;
      }

      // Tag filter
      if (tagFilters.length > 0) {
        const postTagIds = post.tags?.map(t => t.id) || [];
        const hasMatchingTag = tagFilters.some(tagId => postTagIds.includes(tagId));
        if (!hasMatchingTag) return false;
      }

      // Author filter
      if (authorFilters.length > 0) {
        const authorMatches = authorFilters.includes(post.authorId || '') ||
          (post.coAuthorIds || []).some(id => authorFilters.includes(id));
        if (!authorMatches) return false;
      }

      return true;
    });
  }, [blogPosts, isPlaceholderData, debouncedSearch, statusFilters, categoryFilters, tagFilters, authorFilters]);

  // Get total count - use client filtered count during transition
  const totalCount = isPlaceholderData
    ? clientFilteredPosts.length
    : (data?.pages?.[0]?.pagination?.totalCount || 0);

  // More robust loading state logic
  const isInitialLoading = isLoading && !hasEverLoadedData.current;
  const isRefetching = isFetching && !isFetchingNextPage && hasEverLoadedData.current;
  // Show subtle indicator when transitioning between filter states
  const isTransitioning = isPlaceholderData && isFetching;

  const processedPosts = useMemo(() => {
    // Use client-filtered posts during transition for instant response
    const postsToProcess = isPlaceholderData ? clientFilteredPosts : blogPosts;

    // Apply client-side sorting during transition for instant response
    let sortedPosts = [...postsToProcess];

    if (isPlaceholderData && sortConfig) {
      sortedPosts.sort((a, b) => {
        // Always keep pinned posts at top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        let aVal: any;
        let bVal: any;

        switch (sortConfig.field) {
          case 'title':
            aVal = a.title?.toLowerCase() || '';
            bVal = b.title?.toLowerCase() || '';
            break;
          case 'createdAt':
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case 'updatedAt':
            aVal = new Date(a.updatedAt).getTime();
            bVal = new Date(b.updatedAt).getTime();
            break;
          case 'publishedAt':
            aVal = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            bVal = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            break;
          case 'views':
            aVal = a.views || 0;
            bVal = b.views || 0;
            break;
          case 'status':
            aVal = a.status || '';
            bVal = b.status || '';
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sortedPosts.map((post) => ({
      ...post,
      pinned: pinnedIds.has(post.id) || post.pinned,
    }));
  }, [blogPosts, clientFilteredPosts, isPlaceholderData, pinnedIds, sortConfig]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollThreshold = 10;

    // Only load more if we have scrollable content and are near bottom
    if (
      scrollHeight > clientHeight &&
      scrollHeight - scrollTop - clientHeight < scrollThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleSort = (field: BlogPostSort["field"]) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (error && !hasEverLoadedData.current) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">
            Error loading blog posts
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <BlogTableHeader
        workspaceSlug={workspaceSlug}
        currentPageId={currentPage.id}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <BlogTableFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilters={statusFilters}
          setStatusFilters={setStatusFilters}
          categoryFilters={categoryFilters}
          setCategoryFilters={setCategoryFilters}
          tagFilters={tagFilters}
          setTagFilters={setTagFilters}
          authorFilters={authorFilters}
          setAuthorFilters={setAuthorFilters}
          postsCount={totalCount}
          loading={isInitialLoading}
          fetching={isRefetching}
          workspaceSlug={workspaceSlug}
          pageId={currentPage.id}
          sortConfig={sortConfig}
          onSort={handleSort}
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
        />

        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto relative transition-all duration-300 ease-out ${isTransitioning ? 'opacity-70' : ''
            } ${isRefreshing ? 'opacity-60' : ''
            }`}
        >
          {/* Subtle loading overlay during refresh - matches category view */}
          {isRefreshing && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-transparent animate-pulse" />
            </div>
          )}

          <BlogTableContent
            posts={processedPosts}
            workspaceSlug={workspaceSlug}
            currentPageId={currentPage.id}
            loading={isInitialLoading}
            onSort={handleSort}
            sortConfig={sortConfig}
          />

          {/* Manual Load More Button (for when content fits screen or explicit action) */}
          {hasNextPage && !isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Button
                variant="ghost"
                onClick={() => fetchNextPage()}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Load more posts
              </Button>
            </div>
          )}

          {/* Loading indicator for infinite scroll */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-6 border-t">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading more posts...
              </span>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNextPage && blogPosts.length > 0 && !isLoading && (
            <div className="flex items-center justify-center py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Showing all {totalCount} posts
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BlogTableView(props: BlogTableViewProps) {
  return (
    <BlogTableProvider>
      <BlogTable {...props} />
    </BlogTableProvider>
  );
}
