'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { BlogEditor } from '@/modules/blogs/components/blog-editor';
import { useEditorMetadata } from '@/modules/blogs/hooks/use-editor-metadata';
import { Skeleton } from '@/components/ui/skeleton';

interface EditPostPageProps {
  params: Promise<{
    workspaceSlug: string;
    blogId: string;
    postid: string;
  }>;
}

export default function EditPostPage(props: EditPostPageProps) {
  const params = use(props.params);
  const { workspaceSlug, blogId, postid } = params;

  const { data, isLoading, isError, error } = useEditorMetadata({
    blogId,
    postId: postid
  });

  // Show loading skeleton while fetching metadata
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex flex-1 overflow-hidden">
          {/* Editor skeleton */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="space-y-4 mt-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </div>
          {/* Sidebar skeleton */}
          <div className="w-80 border-l border-gray-200 shrink-0 p-4">
            <div className="space-y-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load editor</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
        </div>
      </div>
    );
  }

  // Post not found
  if (!data?.initialPost) {
    notFound();
  }

  return (
    <BlogEditor
      workspaceSlug={workspaceSlug}
      blogId={blogId}
      workspaceId={data.workspaceId}
      initialPost={data.initialPost}
      categories={data.categories || []}
      authors={data.authors || []}
      allPosts={[]} // Related posts can be loaded lazily in sidebar if needed
      tags={data.tags || []}
      isNewPost={false}
    />
  );
}
