'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';

export interface FeaturedPostsData {
  categoryId: string;
  categoryName: string;
  featuredPosts: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
  }>;
  maxFeatured: number;
}

// Get featured posts for a category (or global)
export async function getFeaturedPosts(
  workspaceSlug: string,
  pageId: string,
  categoryId: string = 'global'
): Promise<FeaturedPostsData> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  let featuredPosts: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
  }> = [];
  let categoryName = 'Global';

  if (categoryId === 'global') {
    // Get globally featured posts WITH ORDER
    const posts = await db.blogPost.findMany({
      where: {
        pageId: pageId,
        workspaceId: workspace.id,
        featured: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredOrder: true,
      },
      orderBy: { featuredOrder: 'asc' }, 
      take: 5,
    });

    featuredPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      order: post.featuredOrder || 0, 
    }));
  } else {
   
    const posts = await db.blogPost.findMany({
      where: {
        pageId: pageId,
        workspaceId: workspace.id,
        featuredInCategories: { has: categoryId },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredCategoryOrders: true, 
      },
      take: 5,
    });

   
    featuredPosts = posts
      .map((post) => {
        const orders = post.featuredCategoryOrders as any;
        const order = orders?.[categoryId] || 0;
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          order: order,
        };
      })
      .sort((a, b) => a.order - b.order); 
  }

  return {
    categoryId,
    categoryName,
    featuredPosts,
    maxFeatured: 5,
  };
}


export async function updateFeaturedPosts(
  workspaceSlug: string,
  pageId: string,
  categoryId: string,
  postIds: string[] 
): Promise<{ success: boolean; error?: string }> {
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
          role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
        },
      },
    },
  });

  if (!workspace) {
    return { success: false, error: 'Access denied' };
  }

  
  const validPosts = await db.blogPost.findMany({
    where: {
      id: { in: postIds },
      pageId: pageId,
      workspaceId: workspace.id,
    },
  });

  if (validPosts.length !== postIds.length) {
    return { success: false, error: 'Invalid posts selected' };
  }

  try {
    if (categoryId === 'global') {
 
      await db.$transaction([
      
        db.blogPost.updateMany({
          where: {
            pageId: pageId,
            workspaceId: workspace.id,
            featured: true,
          },
          data: { featured: false },
        }),

        ...postIds.map((postId, index) =>
          db.blogPost.update({
            where: { id: postId },
            data: {
              featured: true,
              featuredOrder: index, 
            },
          })
        ),
      ]);
    } else {
 
      const postsWithThisCategory = await db.blogPost.findMany({
        where: {
          pageId: pageId,
          workspaceId: workspace.id,
          featuredInCategories: { has: categoryId },
        },
      });

      await Promise.all(
        postsWithThisCategory.map((post) =>
          db.blogPost.update({
            where: { id: post.id },
            data: {
              featuredInCategories: post.featuredInCategories.filter(
                (catId) => catId !== categoryId
              ),
            },
          })
        )
      );

   
      await Promise.all(
        postIds.map((postId, index) => {
          const post = validPosts.find((p) => p.id === postId);
          if (post) {
            const updatedCategories = [...post.featuredInCategories];
            if (!updatedCategories.includes(categoryId)) {
              updatedCategories.push(categoryId);
            }

            return db.blogPost.update({
              where: { id: postId },
              data: {
                featuredInCategories: updatedCategories,
            
                featuredCategoryOrders: {
                  ...(post.featuredCategoryOrders as any),
                  [categoryId]: index,
                },
              },
            });
          }
        })
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating featured posts:', error);
    return { success: false, error: 'Failed to update featured posts' };
  }
}

// Get featured posts for display (public API)
export async function getPublicFeaturedPosts(
  workspaceSlug: string,
  pageId: string,
  categoryId?: string
) {
  const workspace = await db.workspace.findFirst({
    where: { slug: workspaceSlug },
  });

  if (!workspace) return [];

  if (categoryId && categoryId !== 'global') {
    // Get category-specific featured posts
    return db.blogPost.findMany({
      where: {
        pageId: pageId,
        workspaceId: workspace.id,
        status: 'PUBLISHED',
        featuredInCategories: { has: categoryId },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        author: {
          select: { name: true, image: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
  } else {
    // Get globally featured posts
    return db.blogPost.findMany({
      where: {
        pageId: pageId,
        workspaceId: workspace.id,
        status: 'PUBLISHED',
        featured: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        author: {
          select: { name: true, image: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
  }
}
