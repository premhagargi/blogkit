import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { sendEmail, createTeamInviteEmailTemplate } from '@/lib/email';
import crypto from 'crypto';

// GET team members and pending invitations
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        invitations: {
          where: {
            status: 'PENDING',
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            invitedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      members: workspace.members.map((member) => ({
        id: member.id,
        role: member.role,
        joinedAt: member.createdAt,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
          createdAt: member.user.createdAt,
        },
      })),
      invitations: workspace.invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy,
      })),
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST invite team member
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

    const { email, role } = await request.json();

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user has permission to invite (OWNER or ADMIN)
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
            userId: session.user.id,
          },
          select: {
            role: true,
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

    const inviterRole = workspace.members[0].role;

    // Only OWNER can invite ADMIN, ADMIN can't invite another ADMIN
    if (role === 'ADMIN' && inviterRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can invite admins' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findFirst({
      where: {
        workspace: {
          slug: params.slug,
        },
        user: {
          email: email,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await db.workspaceInvitation.findFirst({
      where: {
        email: email,
        workspaceId: workspace.id,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await db.workspaceInvitation.create({
      data: {
        email: email,
        role: role,
        token: token,
        workspaceId: workspace.id,
        invitedById: session.user.id,
        expiresAt: expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Send invitation email
    const { html, text } = createTeamInviteEmailTemplate(
      workspace.name,
      workspace.slug,
      role,
      invitation.invitedBy.name || invitation.invitedBy.email
    );

    await sendEmail(
      email,
      `You've been invited to join ${workspace.name}`,
      html,
      text
    );

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy,
      },
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
