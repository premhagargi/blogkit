import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PostStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
// import { convertContent } from '@/lib/content-transforms';
import { createSlateEditor, createStaticEditor, serializeHtml } from 'platejs';
import { BaseEditorKit } from '@/components/platejs/editor/editor-base-kit';
import { EditorStatic } from '@/components/platejs/ui/editor-static';

export interface BlogPostData {
  title: string;
  slug?: string;
  content: any; // PlateJS content
  excerpt?: string;
  featuredImage?: string;
  tagIds: string[]; // CHANGED from tags: string[]
  categoryIds: string[]; // CHANGED from category?: string
  metaTitle?: string;
  metaDescription?: string;
  featured?: boolean;
  pinned?: boolean;
  scheduledFor?: Date;
  publishedAt?: Date;
  authorIds?: string[];
}
// Convert content to HTML using PlateJS's built-in serializer

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
    const editor = createStaticEditor({
      plugins: BaseEditorKit,
      value: postData.content,
    });
    const htmlContent = await serializeHtml(editor, {
      editorComponent: EditorStatic, // You'll need to import this
      props: { style: { padding: '0' } }, // Minimal styling for API use
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

    // // Convert content to multiple formats
    // const contentFormats = await convertContent(
    //   Array.isArray(postData.content) ? postData.content : [postData.content],
    //   ['html', 'mdx']
    // );

    // console.log('Generated content formats:', {
    //   json: contentFormats.json.length + ' nodes',
    //   html: contentFormats.html?.substring(0, 100) + '...',
    //   mdx: contentFormats.mdx?.substring(0, 100) + '...',
    //   readTime: contentFormats.readTime,
    // });

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
            // ✅ UPDATE relationships
            categories: {
              set: postData.categoryIds?.map((id) => ({ id })) || [],
            },
            tags: {
              set: postData.tagIds?.map((id) => ({ id })) || [],
            },
            featured: postData.featured || false,
            pinned: postData.pinned || false,
            readTime: 2,
            scheduledFor: postData.scheduledFor,
            estimatedReadTime: 2,
            // Handle authors
            authorId: postData.authorIds?.[0] || null, // First author as primary
            coAuthorIds: postData.authorIds?.slice(1) || [], // Rest as co-authors
          },
        })
      : await db.blogPost.create({
          data: {
            title: postData.title,
            slug,
            content: postData.content,
            htmlContent: '',
            mdx: '',
            excerpt: postData.excerpt,
            status: PostStatus.DRAFT,
            featuredImage: postData.featuredImage,
            // ✅ CREATE relationships
            categories: {
              connect: postData.categoryIds?.map((id) => ({ id })) || [],
            },
            tags: {
              connect: postData.tagIds?.map((id) => ({ id })) || [],
            },
            featured: postData.featured || false,
            pinned: postData.pinned || false,
            readTime: 2,
            scheduledFor: postData.scheduledFor,
            workspaceId,
            pageId,
            estimatedReadTime: 2,
            // Handle authors
            authorId: postData.authorIds?.[0] || null, // First author as primary
            coAuthorIds: postData.authorIds?.slice(1) || [], // Rest as co-authors
          },
        });

    // Revalidate cache
    revalidatePath(`/${blogPage.workspace.slug}/blogs/${blogPage.slug}`);

    return NextResponse.json(
      {
        success: true,
        blogPostId: blogPost.id,
        message: 'Draft saved successfully!',
        data: {
          blogPost,
          generatedSlug: slug,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving blog draft:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save draft',
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

// ✅ NEW: Generate unique slug by handling conflicts automatically
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
