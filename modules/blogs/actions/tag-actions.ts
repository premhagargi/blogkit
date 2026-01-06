// @ts-ignore
// @ts-nocheck
'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';

interface Tag {
  name: string;
  posts: number;
  traffic: number;
  leads: number;
}

// Get all tags for a workspace with usage stats
export async function getWorkspaceBlogTags(slug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user has access to workspace
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      config: true,
      pages: {
        where: {
          type: 'BLOG',
        },
        include: {
          blogPosts: {
            // Changed from blogPost to blogPosts (plural)
            select: {
              tags: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  // Get all tags from workspace config
  const configTags = workspace.config?.blogTags
    ? Array.isArray(workspace.config.blogTags)
      ? workspace.config.blogTags
      : []
    : [];

  // Count tag usage from blog posts
  const tagUsage = new Map<string, number>();
  workspace.pages.forEach((page) => {
    // Changed from blogPost to blogPosts and iterate through the array
    if (page.blogPosts && page.blogPosts.length > 0) {
      page.blogPosts.forEach((blogPost) => {
        if (blogPost.tags) {
          blogPost.tags.forEach((tag: any) => {
            tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
          });
        }
      });
    }
  });

  // Create tag stats
  const tagStats = configTags.map((tag: string) => {
    const posts = tagUsage.get(tag) || 0;
    const traffic = Math.floor(Math.random() * 1000); // Mock data for now
    const leads = Math.floor(Math.random() * 100); // Mock data for now

    return {
      name: tag,
      posts,
      traffic,
      leads,
    };
  });

  return {
    workspaceId: workspace.id,
    tags: tagStats,
  };
}

export async function addBlogTag(slug: string, tagName: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user has access to workspace with admin/owner role
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId: session.user.id,
          role: {
            in: ['OWNER', 'ADMIN', 'EDITOR'],
          },
        },
      },
    },
    include: {
      config: true,
    },
  });

  if (!workspace) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  // Get current tags
  const currentTags = workspace.config?.blogTags
    ? Array.isArray(workspace.config.blogTags)
      ? workspace.config.blogTags
      : []
    : [];

  // Check if tag already exists
  if (currentTags.includes(tagName)) {
    throw new Error('Tag already exists');
  }

  // Update or create workspace config
  if (workspace.config) {
    await db.workspaceConfig.update({
      where: {
        id: workspace.config.id,
      },
      data: {
        blogTags: [...currentTags, tagName],
      },
    });
  } else {
    await db.workspaceConfig.create({
      data: {
        workspaceId: workspace.id,
        blogTags: [tagName],
        enabledPageTypes: ['BLOG'],
        blogCategories: [],
        helpdeskCategories: [],
      },
    });
  }

  return { success: true };
}

export async function updateBlogTag(
  slug: string,
  oldName: string,
  newName: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user has access to workspace with admin/owner role
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId: session.user.id,
          role: {
            in: ['OWNER', 'ADMIN', 'EDITOR'],
          },
        },
      },
    },
    include: {
      config: true,
      pages: {
        where: {
          type: 'BLOG',
        },
        include: {
          blogPosts: true, // Changed from blogPost to blogPosts
        },
      },
    },
  });

  if (!workspace || !workspace.config) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  const currentTags = workspace.config.blogTags
    ? Array.isArray(workspace.config.blogTags)
      ? workspace.config.blogTags
      : []
    : [];

  if (!currentTags.includes(oldName)) {
    throw new Error('Tag not found');
  }

  if (currentTags.includes(newName) && oldName !== newName) {
    throw new Error('Tag already exists');
  }

  // Update tag name in config
  const updatedTags = currentTags.map((tag: string) =>
    tag === oldName ? newName : tag
  );

  await db.workspaceConfig.update({
    where: {
      id: workspace.config.id,
    },
    data: {
      blogTags: updatedTags,
    },
  });

  // Update all blog posts that use this tag
  const blogPostsToUpdate: string[] = [];
  workspace.pages.forEach((page) => {
    if (page.blogPosts && page.blogPosts.length > 0) {
      page.blogPosts.forEach((blogPost) => {
        if (blogPost.tags?.includes(oldName)) {
          blogPostsToUpdate.push(blogPost.id);
        }
      });
    }
  });

  // Update blog posts in batch
  for (const blogPostId of blogPostsToUpdate) {
    const blogPost = await db.blogPost.findUnique({
      where: { id: blogPostId },
      select: { tags: true },
    });

    if (blogPost) {
      const updatedPostTags = blogPost.tags.map((tag: any) =>
        tag === oldName ? newName : tag
      );

      await db.blogPost.update({
        where: { id: blogPostId },
        data: { tags: { set: updatedPostTags } },
      });
    }
  }

  return { success: true };
}

export async function deleteBlogTag(slug: string, tagName: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user has access to workspace with admin/owner role
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId: session.user.id,
          role: {
            in: ['OWNER', 'ADMIN', 'EDITOR'],
          },
        },
      },
    },
    include: {
      config: true,
      pages: {
        where: {
          type: 'BLOG',
        },
        include: {
          blogPosts: true, // Changed from blogPost to blogPosts
        },
      },
    },
  });

  if (!workspace || !workspace.config) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  const currentTags = workspace.config.blogTags
    ? Array.isArray(workspace.config.blogTags)
      ? workspace.config.blogTags
      : []
    : [];

  if (!currentTags.includes(tagName)) {
    throw new Error('Tag not found');
  }

  // Remove tag from config
  const updatedTags = currentTags.filter((tag: string) => tag !== tagName);

  await db.workspaceConfig.update({
    where: {
      id: workspace.config.id,
    },
    data: {
      blogTags: updatedTags,
    },
  });

  // Remove tag from all blog posts
  const blogPostsToUpdate: string[] = [];
  workspace.pages.forEach((page) => {
    if (page.blogPosts && page.blogPosts.length > 0) {
      page.blogPosts.forEach((blogPost) => {
        if (blogPost.tags?.includes(tagName)) {
          blogPostsToUpdate.push(blogPost.id);
        }
      });
    }
  });

  // Update blog posts in batch
  for (const blogPostId of blogPostsToUpdate) {
    const blogPost = await db.blogPost.findUnique({
      where: { id: blogPostId },
      select: { tags: true },
    });

    if (blogPost) {
      const updatedPostTags = blogPost.tags.filter((tag) => tag !== tagName);

      await db.blogPost.update({
        where: { id: blogPostId },
        data: { tags: updatedPostTags },
      });
    }
  }

  return { success: true };
}

export async function reorderBlogTags(slug: string, orderedTags: string[]) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user has access to workspace with admin/owner role
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
      members: {
        some: {
          userId: session.user.id,
          role: {
            in: ['OWNER', 'ADMIN', 'EDITOR'],
          },
        },
      },
    },
    include: {
      config: true,
    },
  });

  if (!workspace || !workspace.config) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  // Update the tag order
  await db.workspaceConfig.update({
    where: {
      id: workspace.config.id,
    },
    data: {
      blogTags: orderedTags,
    },
  });

  return { success: true };
}
