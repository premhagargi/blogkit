// lib/hooks/use-blogs.ts
'use client';

import { useQuery } from '@tanstack/react-query';

type Blog = {
  id: string;
  title: string;
  status?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export function useUserBlogs(workspaceSlug: string) {
  return useQuery({
    queryKey: ['user-blogs', workspaceSlug],
    queryFn: async (): Promise<Blog[]> => {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/pages?type=BLOG`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }
      const data = await response.json();
      return data.pages || [];
    },
    enabled: !!workspaceSlug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCurrentBlog(blogId: string, workspaceSlug: string) {
  // Get all blogs and find the current one
  const { data: userBlogs, isLoading, error } = useUserBlogs(workspaceSlug);

  return useQuery({
    queryKey: ['current-blog', blogId, workspaceSlug],
    queryFn: async (): Promise<Blog | null> => {
      if (!userBlogs) return null;
      return userBlogs.find((blog) => blog.id === blogId) || null;
    },
    enabled: !!blogId && !!workspaceSlug && !!userBlogs,
    staleTime: 1000 * 60 * 5,
    // Return loading state from userBlogs query
    meta: { isLoadingBlogs: isLoading },
  });
}
