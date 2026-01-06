import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { PostStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSlug = searchParams.get('pageSlug');
    const postSlug = searchParams.get('postSlug');

    if (!pageSlug || !postSlug) {
      return NextResponse.json(
        { error: 'pageSlug and postSlug are required' },
        { status: 400 }
      );
    }

    // Normalize page slug (ensure it starts with /)
    const normalizedPageSlug = pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`;

    // Find the page
    const page = await db.page.findFirst({
      where: {
        slug: normalizedPageSlug,
        type: 'BLOG',
        status: 'PUBLISHED',
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Blog page not found' },
        { status: 404 }
      );
    }

    // Find the blog post
    const blogPost = await db.blogPost.findFirst({
      where: {
        slug: postSlug,
        pageId: page.id,
        status: PostStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
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
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
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
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found or not published' },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget)
    db.blogPost
      .update({
        where: { id: blogPost.id },
        data: { views: { increment: 1 } },
      })
      .catch(console.error);

    // Build public URL
    const pageSlugForUrl = page.slug.startsWith('/')
      ? page.slug.slice(1)
      : page.slug;
    const publicUrl = `/${pageSlugForUrl}/${blogPost.slug}`;

    // Return JSON response with HTML content and metadata
    return NextResponse.json(
      {
        success: true,
        data: {
          id: blogPost.id,
          title: blogPost.title,
          slug: blogPost.slug,
          htmlContent: blogPost.htmlContent || '',
          content: blogPost.content, // Include JSON content for advanced use cases
          excerpt: blogPost.excerpt,
          featuredImage: blogPost.featuredImage,
          featuredImageAlt: blogPost.featuredImageAlt,
          publishedAt: blogPost.publishedAt,
          readTime: blogPost.readTime,
          views: blogPost.views,
          author: blogPost.author
            ? {
                id: blogPost.author.id,
                name: blogPost.author.name,
                image: blogPost.author.image,
                bio: blogPost.author.bio,
              }
            : null,
          categories: blogPost.categories,
          tags: blogPost.tags,
          metaTitle: blogPost.metaTitle,
          metaDescription: blogPost.metaDescription,
          canonicalUrl: blogPost.canonicalUrl,
          publicUrl,
          page: {
            id: blogPost.page.id,
            title: blogPost.page.title,
            slug: blogPost.page.slug,
            description: blogPost.page.description,
          },
          workspace: {
            id: blogPost.workspace.id,
            slug: blogPost.workspace.slug,
            name: blogPost.workspace.name,
          },
        },
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // Allow CORS for embedding
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching public blog post by slug:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

