import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { sendEmail, createTeamInviteEmailTemplate } from '@/lib/email';
import { createTeamInvitationNotification } from '@/modules/notifications/actions/notification-actions';
import crypto from 'crypto';

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if user has permission to invite
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
          include: {
            user: {
              select: {
                name: true,
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

    const inviterRole = workspace.members[0].role;
    const inviterName = workspace.members[0].user.name || workspace.members[0].user.email;

    // Only OWNER can invite ADMIN
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

    // Check for any existing invitation (regardless of status)
    const existingInvitation = await db.workspaceInvitation.findFirst({
      where: {
        email: email,
        workspaceId: workspace.id,
      },
    });

    // If there's an active (pending and not expired) invitation, return error
    if (existingInvitation && 
        existingInvitation.status === 'PENDING' && 
        existingInvitation.expiresAt > new Date()) {
      return NextResponse.json(
        { error: 'Active invitation already exists for this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let invitation;

    if (existingInvitation) {
      // Update existing invitation
      invitation = await db.workspaceInvitation.update({
        where: {
          id: existingInvitation.id,
        },
        data: {
          role: role,
          token: token,
          status: 'PENDING',
          expiresAt: expiresAt,
          invitedById: session.user.id,
          updatedAt: new Date(),
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
    } else {
      // Create new invitation
      invitation = await db.workspaceInvitation.create({
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
    }

    // Create notification for the invitee (if they're an existing user)
    await createTeamInvitationNotification(
      email,
      workspace.name,
      workspace.slug,
      role,
      inviterName,
      workspace.id,
      token // Pass the invitation token
    );

    // Send invitation email
    const { html, text } = createTeamInviteEmailTemplate(
      workspace.name,
      workspace.slug,
      role,
      inviterName
    );

    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;
    const enhancedHtml = html.replace(
      `${process.env.NEXTAUTH_URL}/${workspace.slug}`,
      inviteUrl
    );
    const enhancedText = text.replace(
      `${process.env.NEXTAUTH_URL}/${workspace.slug}`,
      inviteUrl
    );

    await sendEmail(
      email,
      `You've been invited to join ${workspace.name}`,
      enhancedHtml,
      enhancedText
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
