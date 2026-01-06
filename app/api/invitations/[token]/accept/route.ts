import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the invitation
    const invitation = await db.workspaceInvitation.findFirst({
      where: {
        token: params.token,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
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

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    // Verify the authenticated user's email matches the invitation
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user || user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'This invitation is not for your email address' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: invitation.workspaceId,
      },
    });

    if (existingMember) {
      // Update invitation status and return success
      await db.workspaceInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: 'ACCEPTED',
        },
      });

      return NextResponse.json({
        message: 'You are already a member of this workspace',
        redirectTo: `/${invitation.workspace.slug}`,
      });
    }

    // Accept the invitation
    await db.$transaction([
      // Create workspace membership
      db.workspaceMember.create({
        data: {
          userId: session.user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      }),
      // Update invitation status
      db.workspaceInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: 'ACCEPTED',
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      workspace: invitation.workspace,
      redirectTo: `/${invitation.workspace.slug}`,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
