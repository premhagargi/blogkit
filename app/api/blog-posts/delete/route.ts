import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blogPostId, workspaceId } = body;

    if (!blogPostId || !workspaceId) {
      return NextResponse.json(
        { error: 'Blog post ID and workspace ID are required' },
        { status: 400 }
      );
    }

    // Verify the blog post exists and user has access
    const blogPost = await db.blogPost.findFirst({
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
        page: {
          include: {
            workspace: {
              select: { slug: true },
            },
          },
        },
      },
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found or access denied' },
        { status: 403 }
      );
    }

    // Delete the blog post (cascade will handle related records)
    await db.blogPost.delete({
      where: { id: blogPostId },
    });

    // Revalidate cache
    revalidatePath(`/${blogPost.page.workspace.slug}/blogs/${blogPost.page.slug}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Post deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete blog post',
      },
      { status: 500 }
    );
  }
}

