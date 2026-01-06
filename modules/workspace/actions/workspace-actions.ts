'use server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';

export async function getWorkspaceWithPages(slug: string) {
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
      members: {
        where: {
          userId: session.user.id,
        },
        select: {
          role: true,
        },
      },
      pages: {
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          //   blogPost: true,
          //   changelogEntry: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role: workspace.members[0].role,
    pages: workspace.pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      type: page.type,
      status: page.status,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      author: page.createdBy.name || page.createdBy.email,
      publishedAt: page.publishedAt,
    })),
  };
}

export async function getPageById(workspaceSlug: string, pageId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Cache the result for 5 minutes
  const getCachedPage = unstable_cache(
    async () => {
      // Check workspace access...
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
        },
      });

      if (!workspace) return null;

      const page = await db.page.findFirst({
        where: {
          id: pageId,
          workspaceId: workspace.id,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          updatedBy: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          // Temporarily removed until database is migrated:
          // blogPost: true,
          // authors: {
          //   include: {
          //     user: {
          //       select: {
          //         name: true,
          //         email: true,
          //         image: true,
          //       },
          //     },
          //   },
          // },
        },
      });
      return page ? {
        id: page.id,
        title: page.title,
        slug: page.slug,
        type: page.type,
        description: page.description,
        content: page.content,
        status: page.status,
        featuredImage: page.featuredImage,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        readTime: page.readTime,
        category: page.category,
        publishedAt: page.publishedAt,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        createdBy: page.createdBy,
        updatedBy: page.updatedBy,
        // Temporary mock data until database is migrated:
        blogPost: {
          tags: [],
          categories: [],
          authorBio: null,
        },
        authors: [],
      } : null;
    },
    [`page-${pageId}-${workspaceSlug}`], // Cache key
    {
      revalidate: 300, // 5 minutes in seconds
      tags: [`page-${pageId}`, `workspace-${workspaceSlug}`], // For tag-based revalidation
    }
  );

  return getCachedPage();
}

// Blog Category Management Functions
export async function getWorkspaceBlogCategories(slug: string) {
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
        select: {
          category: true,
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  // Get categories and their usage stats
  const categories = Array.isArray(workspace.config?.blogCategories)
    ? workspace.config.blogCategories
    : [];
  const categoryStats = categories.map((category) => {
    const posts = workspace.pages.filter(
      (page) => page.category === category
    ).length;
    const traffic = Math.floor(Math.random() * 1000); // Mock data for now
    const leads = Math.floor(Math.random() * 100); // Mock data for now

    return {
      name: category,
      posts,
      traffic,
      leads,
    };
  });

  return {
    workspaceId: workspace.id,
    categories: categoryStats,
  };
}

export async function addBlogCategory(slug: string, categoryName: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }
  console.log(categoryName, slug);
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

  // Get current categories
  const currentCategories = workspace.config?.blogCategories || [];

  // Check if category already exists
  if (
    Array.isArray(currentCategories) &&
    currentCategories.some(
      (cat) =>
        typeof cat === 'string' &&
        cat.trim().toLowerCase() === categoryName.trim().toLowerCase()
    )
  ) {
    throw new Error('Category already exists');
  }

  // Update or create workspace config
  if (workspace.config) {
    await db.workspaceConfig.update({
      where: {
        id: workspace.config.id,
      },
      data: {
        blogCategories: Array.isArray(currentCategories)
          ? [...currentCategories, categoryName]
          : [categoryName],
      },
    });
  } else {
    await db.workspaceConfig.create({
      data: {
        workspaceId: workspace.id,
        blogCategories: [categoryName],
        enabledPageTypes: ['BLOG'],
      },
    });
  }

  return { success: true };
}

export async function updateBlogCategory(
  slug: string,
  oldName: string,
  newName: string
) {
  const session = await auth();
  console.log(slug, oldName, newName);
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

  const currentCategories = workspace.config.blogCategories || [];

  if (
    !Array.isArray(currentCategories) ||
    !currentCategories.includes(oldName)
  ) {
    throw new Error('Category not found');
  }

  if (currentCategories.includes(newName) && oldName !== newName) {
    throw new Error('Category already exists');
  }

  // Update category name in config
  const updatedCategories = currentCategories.map((cat) =>
    cat === oldName ? newName : cat
  );

  await db.workspaceConfig.update({
    where: {
      id: workspace.config.id,
    },
    data: {
      blogCategories: updatedCategories,
    },
  });

  // Update all pages that use this category
  await db.page.updateMany({
    where: {
      workspaceId: workspace.id,
      category: oldName,
      type: 'BLOG',
    },
    data: {
      category: newName,
    },
  });

  return { success: true };
}

export async function deleteBlogCategory(slug: string, categoryName: string) {
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

  const currentCategories = workspace.config.blogCategories || [];

  if (
    !Array.isArray(currentCategories) ||
    !currentCategories.includes(categoryName)
  ) {
    throw new Error('Category not found');
  }

  // Remove category from config
  const updatedCategories = currentCategories.filter(
    (cat) => cat !== categoryName
  );

  await db.workspaceConfig.update({
    where: {
      id: workspace.config.id,
    },
    data: {
      blogCategories: updatedCategories,
    },
  });

  // Remove category from all pages (set to null)
  await db.page.updateMany({
    where: {
      workspaceId: workspace.id,
      category: categoryName,
      type: 'BLOG',
    },
    data: {
      category: null,
    },
  });

  return { success: true };
}

export async function reorderBlogCategories(
  slug: string,
  orderedCategories: string[]
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
    },
  });

  if (!workspace || !workspace.config) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  // Update the category order
  await db.workspaceConfig.update({
    where: {
      id: workspace.config.id,
    },
    data: {
      blogCategories: orderedCategories,
    },
  });

  return { success: true };
}

export async function getUserRedirectDestination(
  userId: string
): Promise<string> {
  try {
    // Get user's workspaces ordered by most recently updated
    const userWorkspaces = await db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 1, // Only need the most recent one
    });

    // If user has workspaces, redirect to the most recently updated one
    if (userWorkspaces.length > 0) {
      return `/${userWorkspaces[0].slug}`;
    }

    // If no workspaces, redirect to onboarding
    return '/onboarding';
  } catch (error) {
    console.error('Error determining redirect destination:', error);
    // Fallback to onboarding
    return '/onboarding';
  }
}

export async function checkIfUserHasWorkspaces(
  userId: string
): Promise<boolean> {
  try {
    const workspaceCount = await db.workspace.count({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    return workspaceCount > 0;
  } catch (error) {
    console.error('Error checking user workspaces:', error);
    return false;
  }
}
// ... existing code ...

// Author Management Functions
export async function getWorkspaceAuthors(slug: string) {
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
      authors: {
        include: {
          pages: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  // Calculate stats for each author
  const authorStats = workspace.authors.map((author) => ({
    id: author.id,
    name: author.name,
    bio: author.bio,
    image: author.image,
    email: author.email,
    website: author.website,
    socialLinks: author.socialLinks,
    posts: author.pages.length,
    createdAt: author.createdAt,
    updatedAt: author.updatedAt,
  }));

  return {
    workspaceId: workspace.id,
    authors: authorStats,
  };
}

export async function addAuthor(
  slug: string,
  authorData: {
    name: string;
    bio?: string;
    email?: string;
    website?: string;
    image?: string;
    socialLinks?: Record<string, string>;
  }
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
  });

  if (!workspace) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  // Check if author with same name already exists in this workspace
  const existingAuthor = await db.author.findFirst({
    where: {
      name: authorData.name,
      workspaceId: workspace.id,
    },
  });

  if (existingAuthor) {
    throw new Error('Author with this name already exists');
  }

  // Create the author
  const author = await db.author.create({
    data: {
      name: authorData.name,
      bio: authorData.bio,
      email: authorData.email,
      website: authorData.website,
      image: authorData.image,
      socialLinks: authorData.socialLinks,
      workspaceId: workspace.id,
    },
  });

  return { success: true, author };
}

export async function updateAuthor(
  slug: string,
  authorId: string,
  authorData: {
    name: string;
    bio?: string;
    email?: string;
    website?: string;
    image?: string;
    socialLinks?: Record<string, string>;
  }
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
  });

  if (!workspace) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  // Check if the author exists and belongs to this workspace
  const existingAuthor = await db.author.findFirst({
    where: {
      id: authorId,
      workspaceId: workspace.id,
    },
  });

  if (!existingAuthor) {
    throw new Error('Author not found');
  }

  // Check if another author with same name already exists (excluding current author)
  const nameConflict = await db.author.findFirst({
    where: {
      name: authorData.name,
      workspaceId: workspace.id,
      id: {
        not: authorId,
      },
    },
  });

  if (nameConflict) {
    throw new Error('Author with this name already exists');
  }

  // Update the author
  const updatedAuthor = await db.author.update({
    where: {
      id: authorId,
    },
    data: {
      name: authorData.name,
      bio: authorData.bio,
      email: authorData.email,
      website: authorData.website,
      image: authorData.image,
      socialLinks: authorData.socialLinks,
    },
  });

  return { success: true, author: updatedAuthor };
}

export async function deleteAuthor(slug: string, authorId: string) {
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
  });

  if (!workspace) {
    throw new Error('Workspace not found or insufficient permissions');
  }

  // Check if the author exists and belongs to this workspace
  const existingAuthor = await db.author.findFirst({
    where: {
      id: authorId,
      workspaceId: workspace.id,
    },
    include: {
      pages: true,
    },
  });

  if (!existingAuthor) {
    throw new Error('Author not found');
  }

  // Remove author from all associated pages first
  await db.author.update({
    where: {
      id: authorId,
    },
    data: {
      pages: {
        set: [], // Remove all page associations
      },
    },
  });

  // Delete the author
  await db.author.delete({
    where: {
      id: authorId,
    },
  });

  return { success: true };
}

// ... existing code ...
