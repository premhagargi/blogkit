import { notFound } from 'next/navigation';
import {
  getPageById,
  getWorkspaceWithPages,
} from '@/modules/workspace/actions/workspace-actions';
import { BlogTableView } from './_components/blog-table-view';
import { getBlogPostsForTable } from '@/modules/blogs/actions/blog-table-actions';
import { getWorkspaceCategoriesWithStats } from '@/modules/blogs/actions/category-actions';
import { getWorkspaceTagsWithStats } from '@/modules/blogs/actions/tag-actions-new';
import { getWorkspaceAuthors } from '@/modules/blogs/actions/blog-actions';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

interface PageProps {
  params: Promise<{
    workspaceSlug: string;
    blogId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { workspaceSlug, blogId } = await params;

  // Create a query client for SSR prefetching
  const queryClient = new QueryClient();

  // Fetch page data and prefetch React Query data in parallel
  const [page, workspace] = await Promise.all([
    getPageById(workspaceSlug, blogId),
    getWorkspaceWithPages(workspaceSlug),
    // Prefetch initial blog posts
    queryClient.prefetchInfiniteQuery({
      queryKey: [
        'blog-posts-table-infinite',
        workspaceSlug,
        blogId,
        {}, // empty filters
        { field: 'createdAt', direction: 'desc' }, // default sort
        20, // page size
      ],
      queryFn: async () => {
        const result = await getBlogPostsForTable(
          workspaceSlug,
          blogId,
          {},
          { field: 'createdAt', direction: 'desc' },
          { page: 1, pageSize: 20 }
        );
        return result;
      },
      initialPageParam: 1,
    }),
    // Prefetch filter options in parallel
    queryClient.prefetchQuery({
      queryKey: ['workspace-categories', workspaceSlug, blogId],
      queryFn: () => getWorkspaceCategoriesWithStats(workspaceSlug, blogId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['workspace-tags', workspaceSlug, blogId],
      queryFn: () => getWorkspaceTagsWithStats(workspaceSlug, blogId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['workspace-authors', workspaceSlug],
      queryFn: () => getWorkspaceAuthors(workspaceSlug),
    }),
  ]);

  if (!page || !workspace || !workspaceSlug) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <BlogTableView
          workspaceSlug={workspaceSlug}
          currentPage={page}
        />
      </div>
    </HydrationBoundary>
  );
}

// Add revalidation
export const revalidate = 300; // Revalidate every 5 minutes

