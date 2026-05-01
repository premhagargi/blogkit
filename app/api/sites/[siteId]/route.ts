import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const site = await db.site.findUnique({
      where: { id: params.siteId },
      include: {
        gitConnection: {
          select: {
            provider: true,
            providerId: true,
          },
        },
        pageDrafts: {
          orderBy: { updatedAt: 'desc' },
        },
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check workspace access
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: site.workspaceId,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ site });
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    const site = await db.site.findUnique({
      where: { id: params.siteId },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check workspace access
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: site.workspaceId,
        },
      },
    });

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update site
    const updatedSite = await db.site.update({
      where: { id: params.siteId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ site: updatedSite });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json(
      { error: 'Failed to update site' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const site = await db.site.findUnique({
      where: { id: params.siteId },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check workspace access
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: site.workspaceId,
        },
      },
    });

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete site (cascade will handle related records)
    await db.site.delete({
      where: { id: params.siteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}