import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { PostStatus } from '@prisma/client';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Helper function to find Page by slug path
async function findPageBySlugPath(slugPath: string[]): Promise<{
  page: any;
  postSlug?: string;
} | null> {
  // Try to match the slug path to a Page slug
  // Page slugs are like "/blog/demo" or "/blog"
  // So we need to check if the path matches a Page slug

  // Build possible slug paths to check
  const possiblePaths: string[] = [];
  for (let i = 1; i <= slugPath.length; i++) {
    const path = '/' + slugPath.slice(0, i).join('/');
    possiblePaths.push(path);
  }

  // Try each possible path (longest first)
  for (const path of possiblePaths.reverse()) {
    const page = await db.page.findFirst({
      where: {
        slug: path,
        type: 'BLOG',
        // Note: We don't check Page status here - we only require BlogPost to be PUBLISHED
        // This allows published posts to be accessible even if the Page itself is DRAFT
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

    if (page) {
      // If we found a page, check if there's a remaining slug for the post
      const pageSlugParts = path.split('/').filter(Boolean);
      const remainingSlug = slugPath.slice(pageSlugParts.length);

      console.log('[Public Route] Found page:', {
        pageId: page.id,
        pageSlug: page.slug,
        path,
        remainingSlug: remainingSlug.length > 0 ? remainingSlug.join('/') : undefined,
      });

      return {
        page,
        postSlug: remainingSlug.length > 0 ? remainingSlug.join('/') : undefined,
      };
    }
  }

  // Debug: Log all BLOG pages to help diagnose
  const allBlogPages = await db.page.findMany({
    where: { type: 'BLOG' },
    select: { id: true, slug: true, status: true },
  });
  console.log('[Public Route] All BLOG pages in database:', allBlogPages);
  console.log('[Public Route] Looking for slug path:', slugPath);

  return null;
}

// Generate metadata for SEO
async function generateMetadata(
  post: any,
  page: any
): Promise<Metadata> {
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || '';
  const image = post.featuredImage || page.featuredImage || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author ? [post.author.name] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PublicBlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    notFound();
  }

  // Skip if this looks like a workspace route (e.g., /workspace-slug/blogs/...)
  // Let Next.js handle workspace routes through the (workspace) route group
  if (slug.length >= 2 && slug[1] === 'blogs') {
    notFound();
  }

  // Skip if this looks like an API route
  if (slug[0] === 'api') {
    notFound();
  }

  // Skip if this looks like an auth route
  if (slug[0] === 'auth' || slug[0] === 'signin' || slug[0] === 'invite') {
    notFound();
  }

  // Find the Page by matching the slug path
  const pageMatch = await findPageBySlugPath(slug);

  if (!pageMatch) {
    // Debug: Log what we're looking for
    console.log('[Public Route] No page match found for slug:', slug);
    notFound();
  }

  const { page, postSlug } = pageMatch;

  // If there's a post slug, try to find the blog post
  if (postSlug) {
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
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
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
      },
    });

    if (!blogPost) {
      // Debug: Log what we're looking for
      console.log('[Public Route] Blog post not found:', {
        postSlug,
        pageId: page.id,
        pageSlug: page.slug,
      });
      notFound();
    }

    // Increment view count (fire and forget)
    db.blogPost
      .update({
        where: { id: blogPost.id },
        data: { views: { increment: 1 } },
      })
      .catch(console.error);

    // Generate metadata
    const metadata = await generateMetadata(blogPost, page);

    return (
      <html lang="en">
        <head>
          <title>{metadata.title?.toString()}</title>
          <meta name="description" content={metadata.description?.toString()} />
          {metadata.openGraph?.images && Array.isArray(metadata.openGraph.images) && metadata.openGraph.images.length > 0 && (
            <meta property="og:image" content={String(metadata.openGraph.images[0])} />
          )}
          {blogPost.canonicalUrl && (
            <link rel="canonical" href={blogPost.canonicalUrl} />
          )}
        </head>
        <body>
          <article className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4">{blogPost.title}</h1>

              {blogPost.excerpt && (
                <p className="text-xl text-gray-600 mb-6">{blogPost.excerpt}</p>
              )}

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                {blogPost.author && (
                  <div className="flex items-center gap-2">
                    {blogPost.author.image && (
                      <img
                        src={blogPost.author.image}
                        alt={blogPost.author.name || 'Author'}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{blogPost.author.name}</span>
                  </div>
                )}
                {blogPost.publishedAt && (
                  <time dateTime={blogPost.publishedAt.toISOString()}>
                    {blogPost.publishedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                )}
                {blogPost.readTime && (
                  <span>{blogPost.readTime} min read</span>
                )}
              </div>

              {/* Featured image */}
              {blogPost.featuredImage && (
                <img
                  src={blogPost.featuredImage}
                  alt={blogPost.featuredImageAlt || blogPost.title}
                  className="w-full h-auto rounded-lg mb-6"
                />
              )}

              {/* Categories and Tags */}
              {(blogPost.categories.length > 0 || blogPost.tags.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {blogPost.categories.map((category: any) => (
                    <span
                      key={category.id}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: category.color
                          ? `${category.color}20`
                          : '#f3f4f6',
                        color: category.color || '#374151',
                      }}
                    >
                      {category.name}
                    </span>
                  ))}
                  {blogPost.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                        color: tag.color || '#374151',
                      }}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: blogPost.htmlContent || '',
              }}
            />

            {/* Footer */}
            {blogPost.author && blogPost.author.bio && (
              <footer className="mt-12 pt-8 border-t">
                <div className="flex items-start gap-4">
                  {blogPost.author.image && (
                    <img
                      src={blogPost.author.image}
                      alt={blogPost.author.name || 'Author'}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {blogPost.author.name}
                    </h3>
                    <p className="text-gray-600">{blogPost.author.bio}</p>
                  </div>
                </div>
              </footer>
            )}
          </article>
        </body>
      </html>
    );
  }

  // If no post slug, show the blog page (list of posts)
  // For now, just show a 404 - we can implement blog listing later
  notFound();
}

// Generate static params for better performance (optional)
export async function generateStaticParams() {
  // This would pre-generate pages for published posts
  // For now, we'll use dynamic rendering
  return [];
}

