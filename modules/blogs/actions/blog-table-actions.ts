// lib/actions/blog-table-actions.ts
'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { PostStatus } from '@prisma/client';
import { BlogPost } from '@/types/blog';

export interface BlogPostFilters {
  search?: string;
  statuses?: PostStatus[];
  categories?: string[];
  tags?: string[];
  authorIds?: string[];
  featured?: boolean;
  pinned?: boolean;
}

export interface BlogPostSort {
  field:
  | 'title'
  | 'status'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'views';
  direction: 'asc' | 'desc';
}

export interface BlogPostPagination {
  page: number;
  pageSize: number;
}

export interface BlogPostTableResult {
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

/**
 * Fetch blog posts for a specific blog publication with comprehensive data
 * including authors, categories, tags, and analytics
 */
export async function getBlogPostsForTable(
  workspaceSlug: string,
  blogId: string,
  filters?: BlogPostFilters,
  sort?: BlogPostSort,
  pagination?: BlogPostPagination
): Promise<BlogPostTableResult> {
  try {
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
        slug: true,
        name: true,
      },
    });

    if (!workspace) {
      return {
        success: false,
        error: 'Workspace not found or access denied',
      };
    }

    const blogPage = await db.page.findFirst({
      where: {
        id: blogId,
        workspaceId: workspace.id,
        type: 'BLOG',
      },
    });

    if (!blogPage) {
      return {
        success: false,
        error: 'Blog publication not found',
      };
    }

    const whereClause: any = {
      pageId: blogId,
      workspaceId: workspace.id,
    };

    if (filters) {
      if (filters.statuses && filters.statuses.length > 0) {
        whereClause.status = {
          in: filters.statuses,
        };
      }

      if (filters.search) {
        whereClause.OR = [
          {
            title: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            excerpt: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      if (filters.categories && filters.categories.length > 0) {
        whereClause.categories = {
          some: {
            id: {
              in: filters.categories,
            },
          },
        };
      }

      if (filters.tags && filters.tags.length > 0) {
        whereClause.tags = {
          some: {
            id: {
              in: filters.tags, // Now expecting tag IDs
            },
          },
        };
      }

      if (filters.authorIds && filters.authorIds.length > 0) {
        whereClause.OR = [
          { authorId: { in: filters.authorIds } }, // Author is one of the selected
          {
            coAuthorIds: {
              hasSome: filters.authorIds, // Or co-author includes any of selected
            },
          },
        ];
      }

      if (filters.featured !== undefined) {
        whereClause.featured = filters.featured;
      }

      if (filters.pinned !== undefined) {
        whereClause.pinned = filters.pinned;
      }
    }

    // Build order by clause
    let orderBy: any = [{ pinned: 'desc' }];

    if (sort) {
      if (sort.field === 'publishedAt') {
        orderBy.push({ publishedAt: sort.direction });
      } else if (sort.field === 'createdAt') {
        orderBy.push({ createdAt: sort.direction });
      } else if (sort.field === 'updatedAt') {
        orderBy.push({ updatedAt: sort.direction });
      } else if (sort.field === 'title') {
        orderBy.push({ title: sort.direction });
      } else if (sort.field === 'views') {
        orderBy.push({ views: sort.direction });
      }
    } else {
      // Default sorting
      orderBy.push({ publishedAt: 'desc' });
      orderBy.push({ createdAt: 'desc' });
    }

    // Get total count for pagination
    const totalCount = await db.blogPost.count({
      where: whereClause,
    });

    // Calculate pagination parameters
    const pageSize = pagination?.pageSize || 10;
    const currentPage = Math.max(1, pagination?.page || 1);
    const skip = (currentPage - 1) * pageSize;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch blog posts with pagination
    const dbBlogPosts = await db.blogPost.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },

        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            description: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        workspace: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
      orderBy,
      take: pageSize,
      skip: skip,
    });

    // Transform the data to match our BlogPost interface
    const blogPosts: BlogPost[] = await Promise.all(
      dbBlogPosts.map(async (post) => {
        // Get co-authors information if they exist
        let coAuthors: Array<{ id: string; name: string; image?: string }> = [];

        if (post.coAuthorIds && post.coAuthorIds.length > 0) {
          coAuthors = await db.author.findMany({
            where: {
              id: {
                in: post.coAuthorIds,
              },
              workspaceId: workspace.id,
            },
            select: {
              id: true,
              name: true,
              image: true,
            },
          });
        }

        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          htmlContent: post.htmlContent || undefined,
          excerpt: post.excerpt || undefined,
          status: post.status as
            | 'DRAFT'
            | 'PUBLISHED'
            | 'SCHEDULED'
            | 'ARCHIVED'
            | 'DELETED',
          publishedAt: post.publishedAt || undefined,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,

          tags: post.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            color: tag.color || undefined,

            usageCount: 0,
          })),
          categories: post.categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            color: category.color || undefined,
            description: category.description || undefined,
          })),

          featured: post.featured,
          pinned: post.pinned,
          views: post.views,
          readTime: post.readTime || undefined,
          featuredImage: post.featuredImage || undefined,
          authorId: post.authorId || undefined,
          coAuthorIds: post.coAuthorIds,
          author: post.author
            ? {
              id: post.author.id,
              name: post.author.name,
              image: post.author.image || undefined,
            }
            : undefined,
          coAuthors: coAuthors,
          workspaceId: post.workspaceId,
          pageId: post.pageId,
        } as BlogPost & {
          coAuthors: Array<{ id: string; name: string; image?: string }>;
        };
      })
    );

    return {
      success: true,
      blogPosts,
      pagination: {
        totalCount,
        totalPages,
        currentPage,
        pageSize,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch blog posts',
    };
  }
}

/**
 * Get blog post statistics for a blog publication
 */
export async function getBlogPostStats(
  workspaceSlug: string,
  blogId: string
): Promise<{
  success: boolean;
  stats?: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    totalViews: number;
    averageReadTime: number;
  };
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    // Get workspace
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
      return {
        success: false,
        error: 'Workspace not found or access denied',
      };
    }

    // Get statistics
    const [total, published, draft, scheduled, viewsAndReadTime] =
      await Promise.all([
        db.blogPost.count({
          where: {
            pageId: blogId,
            workspaceId: workspace.id,
          },
        }),
        db.blogPost.count({
          where: {
            pageId: blogId,
            workspaceId: workspace.id,
            status: PostStatus.PUBLISHED,
          },
        }),
        db.blogPost.count({
          where: {
            pageId: blogId,
            workspaceId: workspace.id,
            status: PostStatus.DRAFT,
          },
        }),
        db.blogPost.count({
          where: {
            pageId: blogId,
            workspaceId: workspace.id,
            status: PostStatus.SCHEDULED,
          },
        }),
        db.blogPost.aggregate({
          where: {
            pageId: blogId,
            workspaceId: workspace.id,
          },
          _sum: {
            views: true,
            readTime: true,
          },
          _avg: {
            readTime: true,
          },
        }),
      ]);

    return {
      success: true,
      stats: {
        total,
        published,
        draft,
        scheduled,
        totalViews: viewsAndReadTime._sum.views || 0,
        averageReadTime: Math.round(viewsAndReadTime._avg.readTime || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching blog post stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

/**
 * Toggle pin status for a blog post
 */
export async function toggleBlogPostPin(
  workspaceSlug: string,
  postId: string,
  pinned: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    // Verify access
    const workspace = await db.workspace.findFirst({
      where: {
        slug: workspaceSlug,
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
      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Update the post
    await db.blogPost.update({
      where: {
        id: postId,
        workspaceId: workspace.id,
      },
      data: {
        pinned,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error toggling pin status:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to toggle pin status',
    };
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(
  workspaceSlug: string,
  postId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    // Verify access
    const workspace = await db.workspace.findFirst({
      where: {
        slug: workspaceSlug,
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
      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Delete the post
    await db.blogPost.delete({
      where: {
        id: postId,
        workspaceId: workspace.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete blog post',
    };
  }
}

/**
 * Get unique categories from blog posts
 */
export async function getBlogPostCategories(
  workspaceSlug: string,
  blogId: string
): Promise<Array<{ id: string; name: string; slug: string; color?: string }>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return [];
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
    });

    if (!workspace) {
      return [];
    }

    const categories = await db.category.findMany({
      where: {
        pageId: blogId,
        workspaceId: workspace.id,
        blogPosts: { some: {} },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get unique tags from blog posts
 */
export async function getBlogPostTags(
  workspaceSlug: string,
  blogId: string
): Promise<Array<{ id: string; name: string; slug: string; color?: string }>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return [];
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
    });

    if (!workspace) {
      return [];
    }

    const tags = await db.tag.findMany({
      where: {
        pageId: blogId,
        workspaceId: workspace.id,
        blogPosts: { some: {} },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
      },
      orderBy: { name: 'asc' },
    });

    return tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}
