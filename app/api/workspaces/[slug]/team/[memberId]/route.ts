import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';

// PUT update member role
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ slug: string; memberId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    if (!role || !['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user has permission to update roles
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
      include: {
        members: {
          where: {
            OR: [{ userId: session.user.id }, { id: params.memberId }],
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
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

    const currentUserRole = workspace.members.find(
      (m) => m.userId === session.user.id
    )?.role;
    const targetMember = workspace.members.find(
      (m) => m.id === params.memberId
    );

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Permission checks
    if (currentUserRole === 'ADMIN') {
      // ADMIN can't change OWNER roles or promote to OWNER/ADMIN
      if (targetMember.role === 'OWNER' || ['OWNER', 'ADMIN'].includes(role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Can't change own role unless transferring ownership
    if (targetMember.user.id === session.user.id && role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Handle ownership transfer
    if (role === 'OWNER') {
      if (currentUserRole !== 'OWNER') {
        return NextResponse.json(
          { error: 'Only owners can transfer ownership' },
          { status: 403 }
        );
      }

      // Transfer ownership: current owner becomes admin, target becomes owner
      await db.$transaction([
        db.workspaceMember.update({
          where: {
            id: params.memberId,
          },
          data: {
            role: 'OWNER',
          },
        }),
        db.workspaceMember.update({
          where: {
            userId_workspaceId: {
              userId: session.user.id,
              workspaceId: workspace.id,
            },
          },
          data: {
            role: 'ADMIN',
          },
        }),
      ]);
    } else {
      // Regular role update
      await db.workspaceMember.update({
        where: {
          id: params.memberId,
        },
        data: {
          role: role,
        },
      });
    }

    return NextResponse.json({
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

// DELETE remove member
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ slug: string; memberId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to remove members
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
      include: {
        members: {
          where: {
            OR: [{ userId: session.user.id }, { id: params.memberId }],
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
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

    const currentUserMember = workspace.members.find(
      (m) => m.userId === session.user.id
    );
    const targetMember = workspace.members.find(
      (m) => m.id === params.memberId
    );

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't remove workspace owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      );
    }

    // ADMIN can't remove other ADMINs
    if (currentUserMember?.role === 'ADMIN' && targetMember.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Admins cannot remove other admins' },
        { status: 403 }
      );
    }

    // Can't remove yourself unless you're not the owner
    if (targetMember.user.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from workspace' },
        { status: 400 }
      );
    }

    // Remove the member
    await db.workspaceMember.delete({
      where: {
        id: params.memberId,
      },
    });

    return NextResponse.json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
