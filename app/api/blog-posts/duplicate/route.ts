import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PostStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createStaticEditor, serializeHtml } from 'platejs';
import { BaseEditorKit } from '@/components/platejs/editor/editor-base-kit';
import { EditorStatic } from '@/components/platejs/ui/editor-static';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blogPostId, workspaceId, pageId } = body;

    if (!blogPostId || !workspaceId || !pageId) {
      return NextResponse.json(
        { error: 'Blog post ID, workspace ID, and page ID are required' },
        { status: 400 }
      );
    }

    // Verify the blog post exists and user has access
    const originalPost = await db.blogPost.findFirst({
      where: {
        id: blogPostId,
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
        categories: true,
        tags: true,
        page: {
          include: {
            workspace: {
              select: { slug: true },
            },
          },
        },
      },
    });

    if (!originalPost) {
      return NextResponse.json(
        { error: 'Blog post not found or access denied' },
        { status: 403 }
      );
    }

    // Generate new title with "copy" suffix
    const newTitle = `${originalPost.title} copy`;
    const baseSlug = `${originalPost.slug}-copy`;

    // Generate unique slug
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingPost = await db.blogPost.findFirst({
        where: {
          slug,
          workspaceId,
        },
      });

      if (!existingPost) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;

      if (counter > 100) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    // Convert content to HTML if needed
    let htmlContent = originalPost.htmlContent || '';
    if (!htmlContent && originalPost.content) {
      try {
        const editor = createStaticEditor({
          plugins: BaseEditorKit,
          value: originalPost.content as any,
        });
        htmlContent = await serializeHtml(editor, {
          editorComponent: EditorStatic,
          props: { style: { padding: '0' } },
        });
      } catch (error) {
        console.error('Error converting content to HTML:', error);
      }
    }

    // Create duplicate post
    const duplicatedPost = await db.blogPost.create({
      data: {
        title: newTitle,
        slug,
        content: originalPost.content,
        htmlContent: htmlContent,
        mdx: originalPost.mdx || '',
        excerpt: originalPost.excerpt,
        status: PostStatus.DRAFT, // Always create as draft
        featuredImage: originalPost.featuredImage,
        featuredImageAlt: originalPost.featuredImageAlt,
        gallery: originalPost.gallery || [],
        metaTitle: originalPost.metaTitle,
        metaDescription: originalPost.metaDescription,
        canonicalUrl: originalPost.canonicalUrl,
        featured: false, // Reset featured status
        pinned: false, // Reset pinned status
        readTime: originalPost.readTime,
        estimatedReadTime: originalPost.estimatedReadTime,
        workspaceId,
        pageId,
        authorId: originalPost.authorId,
        coAuthorIds: originalPost.coAuthorIds || [],
        featuredInCategories: [],
        featuredOrder: null,
        featuredCategoryOrders: null,
        views: 0, // Reset views
        // Connect categories and tags
        categories: {
          connect: originalPost.categories.map((cat) => ({ id: cat.id })),
        },
        tags: {
          connect: originalPost.tags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    // Revalidate cache
    revalidatePath(`/${originalPost.page.workspace.slug}/blogs/${originalPost.page.slug}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Post duplicated successfully',
        data: {
          blogPostId: duplicatedPost.id,
          blogPost: duplicatedPost,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error duplicating blog post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to duplicate blog post',
      },
      { status: 500 }
    );
  }
}

