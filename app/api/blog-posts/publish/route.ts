import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PostStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createStaticEditor, serializeHtml } from 'platejs';
import { BaseEditorKit } from '@/components/platejs/editor/editor-base-kit';
import { EditorStatic } from '@/components/platejs/ui/editor-static';

export interface BlogPostData {
  title: string;
  slug?: string;
  content: any; // PlateJS content
  excerpt?: string;
  featuredImage?: string;
  tagIds: string[];
  categoryIds: string[];
  metaTitle?: string;
  metaDescription?: string;
  featured?: boolean;
  pinned?: boolean;
  scheduledFor?: Date;
  publishedAt?: Date;
  authorIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspaceId,
      pageId,
      blogPostId,
      ...postData
    }: BlogPostData & {
      workspaceId: string;
      pageId: string;
      blogPostId?: string;
    } = body;

    // Validate required fields
    if (!workspaceId || !pageId || !postData.title) {
      return NextResponse.json(
        { error: 'WorkspaceId, pageId, and title are required' },
        { status: 400 }
      );
    }

    // Validate content exists
    if (!postData.content || (Array.isArray(postData.content) && postData.content.length === 0)) {
      return NextResponse.json(
        { error: 'Content is required to publish' },
        { status: 400 }
      );
    }

    // Convert PlateJS JSON content to HTML
    const editor = createStaticEditor({
      plugins: BaseEditorKit,
      value: postData.content,
    });
    const htmlContent = await serializeHtml(editor, {
      editorComponent: EditorStatic,
      props: { style: { padding: '0' } },
    });

    // Verify the blog publication exists and user has access
    const blogPage = await db.page.findFirst({
      where: {
        id: pageId,
        type: 'BLOG',
        workspaceId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
            },
          },
        },
      },
      include: {
        workspace: {
          select: { slug: true },
        },
      },
    });

    if (!blogPage) {
      return NextResponse.json(
        { error: 'Blog not found or access denied' },
        { status: 403 }
      );
    }

    // Generate unique slug
    const baseSlug = postData.slug || generateSlug(postData.title);
    const slug = await generateUniqueSlug(baseSlug, workspaceId, blogPostId);

    // Validate categories exist
    if (postData.categoryIds && postData.categoryIds.length > 0) {
      const validCategories = await db.category.findMany({
        where: {
          id: { in: postData.categoryIds },
          workspaceId,
        },
      });

      if (validCategories.length !== postData.categoryIds.length) {
        return NextResponse.json(
          { error: 'One or more categories not found' },
          { status: 400 }
        );
      }
    }

    // Validate tags exist
    if (postData.tagIds && postData.tagIds.length > 0) {
      const validTags = await db.tag.findMany({
        where: {
          id: { in: postData.tagIds },
          workspaceId,
        },
      });

      if (validTags.length !== postData.tagIds.length) {
        return NextResponse.json(
          { error: 'One or more tags not found' },
          { status: 400 }
        );
      }
    }

    // Validate authors
    if (postData.authorIds && postData.authorIds.length > 0) {
      const validAuthors = await db.author.findMany({
        where: {
          id: { in: postData.authorIds },
          workspaceId,
        },
      });

      if (validAuthors.length !== postData.authorIds.length) {
        return NextResponse.json(
          { error: 'One or more authors not found in this workspace' },
          { status: 400 }
        );
      }
    }

    // Calculate read time (simple estimation: ~200 words per minute)
    const readTime = calculateReadTime(postData.content);

    // Set publishedAt date (use provided date or current date)
    const publishedAt = postData.publishedAt || new Date();

    // Update or create blog post with PUBLISHED status
    const blogPost = blogPostId
      ? await db.blogPost.update({
          where: { id: blogPostId },
          data: {
            title: postData.title,
            slug,
            content: postData.content,
            htmlContent: htmlContent,
            mdx: '',
            excerpt: postData.excerpt,
            featuredImage: postData.featuredImage,
            status: PostStatus.PUBLISHED,
            publishedAt: publishedAt,
            metaTitle: postData.metaTitle || postData.title,
            metaDescription: postData.metaDescription || postData.excerpt,
            categories: {
              set: postData.categoryIds?.map((id) => ({ id })) || [],
            },
            tags: {
              set: postData.tagIds?.map((id) => ({ id })) || [],
            },
            featured: postData.featured || false,
            pinned: postData.pinned || false,
            readTime: readTime,
            estimatedReadTime: readTime,
            scheduledFor: null, // Clear scheduled date when publishing
            // Handle authors
            authorId: postData.authorIds?.[0] || null,
            coAuthorIds: postData.authorIds?.slice(1) || [],
          },
        })
      : await db.blogPost.create({
          data: {
            title: postData.title,
            slug,
            content: postData.content,
            htmlContent: htmlContent,
            mdx: '',
            excerpt: postData.excerpt,
            status: PostStatus.PUBLISHED,
            publishedAt: publishedAt,
            metaTitle: postData.metaTitle || postData.title,
            metaDescription: postData.metaDescription || postData.excerpt,
            featuredImage: postData.featuredImage,
            categories: {
              connect: postData.categoryIds?.map((id) => ({ id })) || [],
            },
            tags: {
              connect: postData.tagIds?.map((id) => ({ id })) || [],
            },
            featured: postData.featured || false,
            pinned: postData.pinned || false,
            readTime: readTime,
            estimatedReadTime: readTime,
            workspaceId,
            pageId,
            // Handle authors
            authorId: postData.authorIds?.[0] || null,
            coAuthorIds: postData.authorIds?.slice(1) || [],
          },
        });

    // Revalidate cache for the blog page
    revalidatePath(`/${blogPage.workspace.slug}/blogs/${blogPage.slug}`);
    
    // Also revalidate the public route (if it exists)
    const pageSlug = blogPage.slug.startsWith('/') ? blogPage.slug.slice(1) : blogPage.slug;
    revalidatePath(`/${pageSlug}/${slug}`);

    return NextResponse.json(
      {
        success: true,
        blogPostId: blogPost.id,
        message: 'Blog post published successfully!',
        data: {
          blogPost,
          generatedSlug: slug,
          publicUrl: `/${pageSlug}/${slug}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error publishing blog post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish blog post',
      },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(
  baseSlug: string,
  workspaceId: string,
  excludePostId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingPost = await db.blogPost.findFirst({
      where: {
        slug,
        workspaceId,
        ...(excludePostId && { id: { not: excludePostId } }),
      },
    });

    if (!existingPost) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety limit to prevent infinite loops
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

function calculateReadTime(content: any): number {
  try {
    const extractText = (nodes: any[]): string => {
      return nodes
        .map((node) => {
          if (typeof node === 'string') return node;
          if (node.text) return node.text;
          if (node.children) return extractText(node.children);
          return '';
        })
        .join(' ');
    };

    const text = extractText(Array.isArray(content) ? content : [content]);
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    
    // 200 words per minute reading speed
    return Math.max(1, Math.ceil(words / 200));
  } catch (error) {
    // Default to 5 minutes if calculation fails
    return 5;
  }
}

