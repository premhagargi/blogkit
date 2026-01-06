'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  workspaceId?: string;
  data?: any;
}

export async function createNotification(
  notificationData: CreateNotificationData
) {
  try {
    const notification = await db.notification.create({
      data: notificationData,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

export async function createTeamInvitationNotification(
  inviteeEmail: string,
  workspaceName: string,
  workspaceSlug: string,
  role: string,
  inviterName: string,
  workspaceId: string,
  invitationToken?: string
) {
  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: inviteeEmail },
    });

    if (user) {
      // Create notification for existing user
      await createNotification({
        type: 'TEAM_INVITATION',
        title: `You've been invited to join ${workspaceName}`,
        message: `${inviterName} invited you to join ${workspaceName} as a ${role.toLowerCase()}.`,
        userId: user.id,
        workspaceId,
        data: {
          workspaceName,
          workspaceSlug,
          role,
          inviterName,
          invitationToken, // Store the token here
        },
      });
    }
    // For non-users, we'll create the notification when they sign up and accept the invitation
  } catch (error) {
    console.error('Error creating team invitation notification:', error);
  }
}

export async function createNotificationForNewUser(
  userId: string,
  invitationToken: string
) {
  try {
    // Find the invitation
    const invitation = await db.workspaceInvitation.findUnique({
      where: { token: invitationToken },
      include: {
        workspace: true,
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (invitation && invitation.status === 'PENDING') {
      const inviterName =
        invitation.invitedBy.name || invitation.invitedBy.email;

      await createNotification({
        type: 'TEAM_INVITATION',
        title: `Welcome! You've been invited to join ${invitation.workspace.name}`,
        message: `${inviterName} invited you to join ${
          invitation.workspace.name
        } as a ${invitation.role.toLowerCase()}.`,
        userId,
        workspaceId: invitation.workspaceId,
        data: {
          workspaceName: invitation.workspace.name,
          workspaceSlug: invitation.workspace.slug,
          role: invitation.role,
          inviterName,
          invitationToken,
        },
      });
    }
  } catch (error) {
    console.error('Error creating notification for new user:', error);
  }
}

export async function getUserNotifications(limit: number = 10) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await db.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

export async function getUnreadNotificationCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return 0;
    }

    const count = await db.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}
