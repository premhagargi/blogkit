import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format (only letters and numbers)
    if (!/^[a-zA-Z0-9]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain letters and numbers' },
        { status: 400 }
      );
    }

    // Convert slug to lowercase
    const normalizedSlug = slug.toLowerCase();

    // Check if slug already exists
    const existingWorkspace = await db.workspace.findUnique({
      where: { slug: normalizedSlug },
    });

    if (existingWorkspace) {
      return NextResponse.json(
        {
          error: 'This name is already taken. Only letters and numbers allowed',
        },
        { status: 409 }
      );
    }

    // Create workspace with user as owner
    const workspace = await db.workspace.create({
      data: {
        name,
        slug: normalizedSlug,
        members: {
          create: {
            userId: session.user.id,
            role: Role.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Workspace created successfully',
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          createdAt: workspace.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-zA-Z0-9]+$/.test(slug)) {
      return NextResponse.json(
        {
          available: false,
          error: 'Slug can only contain letters and numbers',
        },
        { status: 200 }
      );
    }

    // Convert to lowercase for checking
    const normalizedSlug = slug.toLowerCase();

    // Check if slug exists
    const existingWorkspace = await db.workspace.findUnique({
      where: { slug: normalizedSlug },
    });

    return NextResponse.json({
      available: !existingWorkspace,
      slug: normalizedSlug,
    });
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
