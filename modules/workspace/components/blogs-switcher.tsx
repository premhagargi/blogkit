'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Replace these with your real hooks later
import { useUserBlogs, useCurrentBlog } from '@/modules/blogs/hooks/use-blogs';
import { useBlogStore } from '@/modules/blogs/stores/blogs-store';

export function BlogSwitcher() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;
  const blogId = params.blogId as string;

  // Fetch blogs for user in current workspace
  const { data: userBlogs, isLoading: blogsLoading } =
    useUserBlogs(workspaceSlug);
  const { data: currentBlog, isLoading: currentBlogLoading } = useCurrentBlog(
    blogId,
    workspaceSlug
  );
  const { currentBlog: storeCurrentBlog } = useBlogStore();

  const handleBlogSwitch = (id: string) => {
    if (id !== blogId) {
      router.push(`/${workspaceSlug}/blogs/${id}`);
    }
  };

  const handleCreateBlog = () => {
    router.push(`/${workspaceSlug}/blogs/new`);
  };

  const displayBlog = currentBlog || storeCurrentBlog;
  const isLoading = blogsLoading || currentBlogLoading;

  if (isLoading) {
    return (
      <div className="flex h-8 w-20 mx-2 items-center rounded-md bg-muted animate-pulse" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto text-normal hover:bg-transparent hover:cursor-pointer focus-visible:ring-0"
        >
          <span>{displayBlog?.title || 'Select Blog'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
        align="start"
      >
        {userBlogs?.map((blog) => (
          <DropdownMenuItem
            key={blog.id}
            onSelect={() => handleBlogSwitch(blog.id)}
            className="cursor-pointer"
          >
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                {blog.title.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-normal ">{blog.title}</span>
                <span className="text-small ">{blog.status || 'draft'}</span>
              </div>
            </div>
            {blog.id === blogId && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          // onSelect={handleCreateBlog}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-normal">Create new page</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
