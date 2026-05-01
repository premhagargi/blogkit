import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { encrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';

export async function GET(request: NextRequest, { params }: { params: { workspaceSlug: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceSlug } = params;

    // Find workspace by slug
    const workspace = await db.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if user has access to workspace
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspace.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all connections for this workspace
    const connections = await db.gitConnection.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        provider: true,
        providerId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { workspaceSlug: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceSlug } = params;

    // Find workspace by slug
    const workspace = await db.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { provider, code } = await request.json();

    if (!provider || !code) {
      return NextResponse.json(
        { error: 'provider and code are required' },
        { status: 400 }
      );
    }

    // Check workspace access
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspace.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(provider, code);

    // Test the token
    const gitClient = new GitClient(provider, tokenData.access_token);
    const repos = await gitClient.listRepos();

    if (repos.length === 0) {
      return NextResponse.json(
        { error: 'No repositories found. Please check your permissions.' },
        { status: 400 }
      );
    }

    // Encrypt the token
    const encryptedToken = encrypt(tokenData.access_token);

    // Create or update connection
    const connection = await db.gitConnection.upsert({
      where: {
        provider_providerId_workspaceId: {
          provider: provider.toUpperCase(),
          providerId: tokenData.providerId,
          workspaceId: workspace.id,
        },
      },
      update: {
        accessToken: encryptedToken,
        refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : null,
        updatedAt: new Date(),
      },
      create: {
        provider: provider.toUpperCase(),
        providerId: tokenData.providerId,
        accessToken: encryptedToken,
        refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : null,
        userId: session.user.id,
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({
      connection: {
        id: connection.id,
        provider: connection.provider,
        providerId: connection.providerId,
      },
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

async function exchangeCodeForToken(provider: string, code: string) {
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(`Missing ${provider} OAuth credentials`);
  }

  const tokenUrl = provider === 'github'
    ? 'https://github.com/login/oauth/access_token'
    : 'https://gitlab.com/oauth/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`);
  }

  // Get user info to get providerId
  const userUrl = provider === 'github'
    ? 'https://api.github.com/user'
    : 'https://gitlab.com/api/v4/user';

  const userResponse = await fetch(userUrl, {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
      'User-Agent': 'BlogKit-Sites',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to get user info');
  }

  const userData = await userResponse.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    providerId: userData.id.toString(),
  };
}