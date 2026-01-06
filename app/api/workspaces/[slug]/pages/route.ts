import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Optional filter by page type

    // Check if user has access to workspace
    const workspace = await db.workspace.findFirst({
      where: {
        slug: params.slug,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        pages: {
          where: type ? { type: type as PageType } : {},
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pages: workspace.pages,
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, type } = body;

    // Validate required fields
    if (!title || !slug || !type) {
      return NextResponse.json(
        { error: 'Title, slug, and type are required' },
        { status: 400 }
      );
    }

    // Check if user has access to workspace
    const workspace = await db.workspace.findFirst({
      where: {
        slug: params.slug,
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
      return NextResponse.json(
        { error: 'Workspace not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Check if slug already exists in this workspace
    const existingPage = await db.page.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: slug,
      },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this URL already exists' },
        { status: 409 }
      );
    }

    // Create the page
    const page = await db.page.create({
      data: {
        title,
        slug,
        type: type as PageType,
        content: {}, // Empty JSON content initially
        status: 'DRAFT',
        workspaceId: workspace.id,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Page created successfully',
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        type: page.type,
        status: page.status,
        createdAt: page.createdAt,
        author: page.createdBy.name || page.createdBy.email,
      },
    });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
