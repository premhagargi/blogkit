'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { sendEmail, createTeamInviteEmailTemplate } from '@/lib/email';
import crypto from 'crypto';
import { Role } from '@prisma/client';

export async function getWorkspaceTeam(slug: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug,
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
        orderBy: [
          { role: 'desc' }, // OWNER first, then ADMIN, etc.
          { createdAt: 'asc' },
        ],
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
    return null;
  }

  const currentUserMember = workspace.members.find(
    (member) => member.user.id === session.user.id
  );

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    currentUserRole: currentUserMember?.role,
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
  };
}

export async function inviteTeamMember(
  slug: string,
  email: string,
  role: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Input validation
  if (!email || !role) {
    throw new Error('Email and role are required');
  }

  if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
    throw new Error('Invalid role');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  // Check permissions
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
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
    throw new Error('Workspace not found or insufficient permissions');
  }

  const inviterRole = workspace.members[0].role;

  if (role === 'ADMIN' && inviterRole !== 'OWNER') {
    throw new Error('Only workspace owners can invite admins');
  }

  // Check for existing member
  const existingMember = await db.workspaceMember.findFirst({
    where: {
      workspace: {
        slug,
      },
      user: {
        email: email,
      },
    },
  });

  if (existingMember) {
    throw new Error('User is already a member of this workspace');
  }

  // Check for existing invitation
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
    throw new Error('Active invitation already exists for this email');
  }

  // Create invitation
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await db.workspaceInvitation.create({
    data: {
      email: email,
      role: role as Role,
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
  const inviterName = invitation.invitedBy.name || invitation.invitedBy.email;
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;

  // Update email template to use the invite URL instead of workspace URL
  const { html, text } = createTeamInviteEmailTemplate(
    workspace.name,
    workspace.slug,
    role,
    inviterName
  );

  const enhancedHtml = html.replace(
    new RegExp(`${process.env.NEXTAUTH_URL}/${workspace.slug}`, 'g'),
    inviteUrl
  );
  const enhancedText = text.replace(
    new RegExp(`${process.env.NEXTAUTH_URL}/${workspace.slug}`, 'g'),
    inviteUrl
  );

  await sendEmail(
    email,
    `You've been invited to join ${workspace.name}`,
    enhancedHtml,
    enhancedText
  );

  return { success: true, invitation };
}

export async function removeTeamMember(slug: string, memberId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check permissions
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
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
          OR: [{ userId: session.user.id }, { id: memberId }],
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
    throw new Error('Workspace not found or insufficient permissions');
  }

  const currentUserMember = workspace.members.find(
    (m) => m.userId === session.user.id
  );
  const targetMember = workspace.members.find((m) => m.id === memberId);

  if (!targetMember) {
    throw new Error('Member not found');
  }

  // Validation rules
  if (targetMember.role === 'OWNER') {
    throw new Error('Cannot remove workspace owner');
  }

  if (currentUserMember?.role === 'ADMIN' && targetMember.role === 'ADMIN') {
    throw new Error('Admins cannot remove other admins');
  }

  if (targetMember.user.id === session.user.id) {
    throw new Error('Cannot remove yourself from workspace');
  }

  await db.workspaceMember.delete({
    where: {
      id: memberId,
    },
  });

  return { success: true };
}

export async function updateMemberRole(
  slug: string,
  memberId: string,
  newRole: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if (!['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'].includes(newRole)) {
    throw new Error('Invalid role');
  }

  // Check permissions
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
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
          OR: [{ userId: session.user.id }, { id: memberId }],
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
    throw new Error('Workspace not found or insufficient permissions');
  }

  const currentUserMember = workspace.members.find(
    (m) => m.userId === session.user.id
  );
  const targetMember = workspace.members.find((m) => m.id === memberId);

  if (!targetMember) {
    throw new Error('Member not found');
  }

  // Permission checks
  if (currentUserMember?.role === 'ADMIN') {
    if (targetMember.role === 'OWNER' || ['OWNER', 'ADMIN'].includes(newRole)) {
      throw new Error('Insufficient permissions');
    }
  }

  if (targetMember.user.id === session.user.id && newRole !== 'OWNER') {
    throw new Error('Cannot change your own role');
  }

  // Handle ownership transfer
  if (newRole === 'OWNER') {
    if (currentUserMember?.role !== 'OWNER') {
      throw new Error('Only owners can transfer ownership');
    }

    await db.$transaction([
      db.workspaceMember.update({
        where: {
          id: memberId,
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
    await db.workspaceMember.update({
      where: {
        id: memberId,
      },
      data: {
        role: newRole as Role,
      },
    });
  }

  return { success: true };
}

export async function cancelInvitation(slug: string, invitationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check permissions
  const workspace = await db.workspace.findFirst({
    where: {
      slug,
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
    throw new Error('Workspace not found or insufficient permissions');
  }

  const invitation = await db.workspaceInvitation.findFirst({
    where: {
      id: invitationId,
      workspaceId: workspace.id,
      status: 'PENDING',
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  await db.workspaceInvitation.update({
    where: {
      id: invitationId,
    },
    data: {
      status: 'DECLINED',
    },
  });

  return { success: true };
}
