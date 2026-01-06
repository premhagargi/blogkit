'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { PageType, PageStatus } from '@prisma/client';

export interface BlogPostData {
  title: string;
  content: any;
  description?: string;
  category?: string;
  tags: string[];
  authorIds: string[];
  featuredImage?: string;
  publishDate?: Date;
  relatedArticleIds: string[];
}

export async function getBlogCategories(
  workspaceSlug: string
): Promise<string[]> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      config: true,
    },
  });

  if (!workspace?.config) {
    return [];
  }

  const blogCategories = workspace.config.blogCategories;

  // Type guard to ensure we return string[]
  if (
    Array.isArray(blogCategories) &&
    blogCategories.every((item) => typeof item === 'string')
  ) {
    return blogCategories;
  }

  // If the data is not in the expected format, return empty array
  return [];
}

export async function getWorkspaceAuthors(workspaceSlug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      authors: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!workspace) {
    return [];
  }

  // Return actual authors, not workspace members
  return workspace.authors;
}

// NEW: Get blog posts for a specific blog ID
export async function getBlogPostsByBlogId(
  workspaceSlug: string,
  blogId: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // First verify the user has access to this workspace and blog
  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!workspace) {
    return [];
  }

  // Get blog posts that belong to this specific blog
  const pages = await db.page.findMany({
    where: {
      type: PageType.BLOG,
      workspaceId: workspace.id,
      // Add your blog filtering logic here - this depends on your schema
      // If you have a blogId field, use it. If blogs are categorized differently, adjust accordingly
      category: blogId, // or however you're linking pages to specific blogs
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return pages;
}

// Keep the original function for general workspace blog posts
export async function getBlogPosts(workspaceSlug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const pages = await db.page.findMany({
    where: {
      type: PageType.BLOG,
      workspace: {
        slug: workspaceSlug,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return pages;
}

export async function getBlogTags(workspaceSlug: string): Promise<string[]> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      config: true,
    },
  });

  if (!workspace?.config) {
    return [];
  }

  const blogTags = workspace.config.blogTags;

  // Type guard to ensure we return string[]
  if (
    Array.isArray(blogTags) &&
    blogTags.every((item) => typeof item === 'string')
  ) {
    return blogTags;
  }

  // If the data is not in the expected format, return empty array
  return [];
}

export async function getWorkspaceInfo(workspaceSlug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!workspace) {
    throw new Error('Workspace not found or access denied');
  }

  return workspace;
}

export async function getBlogPage(workspaceSlug: string, blogId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const blogPage = await db.page.findFirst({
    where: {
      id: blogId,
      type: PageType.BLOG,
      workspace: {
        slug: workspaceSlug,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    include: {
      workspace: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!blogPage) {
    throw new Error('Blog not found or access denied');
  }

  return blogPage;
}
