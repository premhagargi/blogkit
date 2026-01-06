import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

import db from "@/lib/db";
import { InvitationAcceptance } from "./_components/invitation-acceptance";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage(props: InvitePageProps) {
  const params = await props.params;
  const session = await auth();

  // Get invitation details
  const invitation = await db.workspaceInvitation.findFirst({
    where: {
      token: params.token,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invitation Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This invitation link is invalid or has expired.
          </p>
          <Link href="/auth/signin" className="text-primary hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // If user is signed in, check if they can accept the invitation
  if (session?.user) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    // If email doesn't match, redirect to sign out first
    if (user?.email !== invitation.email) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-[400px]">
            <h1 className="text-2xl font-bold mb-2">Email Mismatch</h1>
            <p className="text-muted-foreground mb-4">
              This invitation is for <strong>{invitation.email}</strong>, but
              you're signed in as <strong>{user?.email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign out and sign in with the correct email address.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Sign In with {invitation.email}
            </Link>
          </div>
        </div>
      );
    }
  }

  return (
    <InvitationAcceptance
      invitation={invitation}
      isAuthenticated={!!session?.user}
    />
  );
}
