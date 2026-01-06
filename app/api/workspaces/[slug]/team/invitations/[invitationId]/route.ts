import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

// DELETE cancel invitation
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ slug: string; invitationId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to cancel invitations
    const workspace = await db.workspace.findFirst({
      where: {
        slug: params.slug,
        members: {
          some: {
            userId: session.user.id,
            role: {
              in: ['OWNER', 'ADMIN'],
            },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or insufficient permissions' },
        { status: 403 }
      );
    }

    // Find and cancel the invitation
    const invitation = await db.workspaceInvitation.findFirst({
      where: {
        id: params.invitationId,
        workspaceId: workspace.id,
        status: 'PENDING',
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    await db.workspaceInvitation.update({
      where: {
        id: params.invitationId,
      },
      data: {
        status: 'DECLINED',
      },
    });

    return NextResponse.json({
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
