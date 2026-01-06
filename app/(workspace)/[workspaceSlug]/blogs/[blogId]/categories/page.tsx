import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPageById } from '@/modules/workspace/actions/workspace-actions';
import { CategoriesAndTagsView } from './_components/categories-and-tags-view';
import {
  CategoryTableSkeleton,
  TagTableSkeleton,
} from '@/components/skeleton/table-skeleton';
import { getWorkspaceCategoriesWithStats } from '@/modules/blogs/actions/category-actions';
import { getWorkspaceTagsWithStats } from '@/modules/blogs/actions/tag-actions-new';
import { BlogCategoriesView } from './_components/blog-categories-view';
import { BlogTagsView } from './_components/tags-view';

interface PageProps {
  params: Promise<{
    workspaceSlug: string;
    blogId: string;
  }>;
}

// Data fetching component for Categories
async function CategoriesData({
  workspaceSlug,
  blogId,
}: {
  workspaceSlug: string;
  blogId: string;
}) {
  const categoriesData = await getWorkspaceCategoriesWithStats(
    workspaceSlug,
    blogId
  );
  if (!categoriesData) notFound();
  return (
    <BlogCategoriesView
      workspaceSlug={workspaceSlug}
      blogId={blogId}
    // categories={categoriesData.categories as any}
    />
  );
}

// Data fetching component for Tags
async function TagsData({
  workspaceSlug,
  blogId,
}: {
  workspaceSlug: string;
  blogId: string;
}) {
  const tagsData = await getWorkspaceTagsWithStats(workspaceSlug, blogId);
  console.log(tagsData);
  if (!tagsData) notFound();
  return (
    <BlogTagsView
      workspaceSlug={workspaceSlug}
      blogId={blogId}
    // tags={tagsData.tags}
    />
  );
}

export default async function CategoriesPage({ params }: PageProps) {
  const { workspaceSlug, blogId } = await params;

  const page = await getPageById(workspaceSlug, blogId);
  if (!page) notFound();

  return (
    <CategoriesAndTagsView
      workspaceSlug={workspaceSlug}
      blogId={blogId}
      categoriesView={
        <Suspense fallback={<CategoryTableSkeleton row={5} />}>
          <CategoriesData workspaceSlug={workspaceSlug} blogId={blogId} />
        </Suspense>
      }
      tagsView={
        <Suspense fallback={<TagTableSkeleton row={5} />}>
          <TagsData workspaceSlug={workspaceSlug} blogId={blogId} />
        </Suspense>
      }
    />
  );
}
