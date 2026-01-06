'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Edit, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import LogoWithText from '@/components/icons/icons';

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  token?: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  invitedBy: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface InvitationAcceptanceProps {
  invitation: Invitation;
  isAuthenticated: boolean;
}

export function InvitationAcceptance({
  invitation,
  isAuthenticated,
}: InvitationAcceptanceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const roleIcons = {
    OWNER: <Crown className="h-4 w-4" />,
    ADMIN: <Shield className="h-4 w-4" />,
    EDITOR: <Edit className="h-4 w-4" />,
    VIEWER: <Eye className="h-4 w-4" />,
  };

  const roleDescriptions = {
    OWNER: 'Full access to everything',
    ADMIN: 'Can manage members and settings',
    EDITOR: 'Can create and edit content',
    VIEWER: 'Can view content only',
  };

  const acceptInvitationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/invitations/${invitation.token}/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept invitation');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Welcome to the team!');
      router.push(data.redirectTo || `/${invitation.workspace.slug}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to accept invitation');
    },
  });

  const declineInvitationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/invitations/${invitation.token}/decline`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decline invitation');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Invitation declined');
      router.push('/auth/signin');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to decline invitation');
    },
  });

  const handleAccept = () => {
    if (!isAuthenticated) {
      // Redirect to sign in with the invitation email
      signIn(undefined, {
        callbackUrl: `/invite/${invitation.token}`,
        email: invitation.email,
      });
      return;
    }

    acceptInvitationMutation.mutate();
  };

  const handleDecline = () => {
    declineInvitationMutation.mutate();
  };

  const handleSignIn = () => {
    signIn(undefined, {
      callbackUrl: `/invite/${invitation.token}`,
      email: invitation.email,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <LogoWithText />
        </div>

        <Card className="max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">You're Invited!</CardTitle>
            <CardDescription>
              {invitation.invitedBy.name || invitation.invitedBy.email} invited
              you to join their workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inviter Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Avatar>
                <AvatarImage src={invitation.invitedBy.image || ''} />
                <AvatarFallback>
                  {(
                    invitation.invitedBy.name?.[0] ||
                    invitation.invitedBy.email[0]
                  ).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">
                  {invitation.invitedBy.name || 'Team Member'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {invitation.invitedBy.email}
                </div>
              </div>
            </div>

            {/* Workspace Info */}
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold">
                {invitation.workspace.name}
              </div>
              <Badge
                variant="secondary"
                className="flex items-center gap-1 w-fit mx-auto"
              >
                {roleIcons[invitation.role as keyof typeof roleIcons]}
                {invitation.role.toLowerCase()}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {
                  roleDescriptions[
                    invitation.role as keyof typeof roleDescriptions
                  ]
                }
              </p>
            </div>

            {/* Expiry Warning */}
            <div className="text-center text-xs text-muted-foreground">
              This invitation expires on{' '}
              {new Date(invitation.expiresAt).toLocaleDateString()}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isAuthenticated && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign in or create an account to accept this invitation
                  </p>
                  <Button
                    onClick={handleSignIn}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Sign In to Accept
                  </Button>
                </div>
              )}

              {isAuthenticated && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleAccept}
                    disabled={acceptInvitationMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {acceptInvitationMutation.isPending
                      ? 'Joining...'
                      : 'Accept Invitation'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDecline}
                    disabled={declineInvitationMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Invited to {invitation.email}
          </p>
        </div>
      </div>
    </div>
  );
}
