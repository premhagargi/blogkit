import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { encrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const workspace = await db.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Find workspace
    const workspace = await db.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check workspace membership
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

    const { provider, code, token } = await request.json();

    console.log('[POST /connections] received:', { 
      provider, 
      hasCode: !!code, 
      hasToken: !!token, 
      tokenPrefix: token ? token.substring(0, 10) : 'none',
      session: !!session 
    });

    const tokenData = token ? await getTokenData(provider, token, true) : await getTokenData(provider, code, false);

    console.log('[POST /connections] tokenData received:', { hasAccessToken: !!tokenData.access_token, providerId: tokenData.providerId });

    const gitClient = new GitClient(provider.toLowerCase(), tokenData.access_token);

    console.log('[POST /connections] listing repos...');
    const repos = await gitClient.listRepos();

    console.log('[POST /connections] repos found:', repos.length, repos.map(r => r.fullName).slice(0, 5));

    if (repos.length === 0) {
      return NextResponse.json(
        { error: 'No repositories found. Please check your permissions.' },
        { status: 400 }
      );
    }

    console.log('[POST /connections] encrypting access token...');
    const encryptedToken = encrypt(tokenData.access_token);
    console.log('[POST /connections] encryption successful, length:', encryptedToken.length);

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

    console.log('[POST /connections] connection saved:', { id: connection.id, provider: connection.provider });

    // Return connection + formatted repos for immediate UI update
    const formattedRepos = repos.map(repo => ({
      fullName: repo.fullName,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
      id: repo.fullName, // Use fullName as ID for selection
    }));

    return NextResponse.json({
      connection: {
        id: connection.id,
        provider: connection.provider,
        providerId: connection.providerId,
      },
      repos: formattedRepos,
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

async function getTokenData(provider: string, codeOrToken: string, isToken = false) {
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  const providerLower = provider.toLowerCase();

  console.log('[getTokenData] provider:', providerLower, 'isToken:', isToken, 'clientIdPresent:', !!clientId);

  let access_token = codeOrToken;
  let data: any = null;

  if (!isToken) {
    if (!clientId || !clientSecret) {
      throw new Error(`Missing ${provider} OAuth credentials`);
    }

    const tokenUrl = providerLower === 'github'
      ? 'https://github.com/login/oauth/access_token'
      : 'https://gitlab.com/oauth/token';

    console.log('[getTokenData] exchanging code at:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: codeOrToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getTokenData] Token exchange failed:', {
        status: response.status,
        body: errorText,
      });
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    data = await response.json();

    if (data.error) {
      console.error('[getTokenData] OAuth error:', data);
      throw new Error(`OAuth error: ${data.error_description || data.error}`);
    }

    access_token = data.access_token;
    console.log('[getTokenData] token exchange success, token prefix:', access_token?.substring(0, 10));
  } else {
    console.log('[getTokenData] using provided token directly');
  }

  const userUrl = providerLower === 'github'
    ? 'https://api.github.com/user'
    : 'https://gitlab.com/api/v4/user';

  console.log('[getTokenData] fetching user from:', userUrl, 'token prefix:', access_token?.substring(0, 10));

  const userResponse = await fetch(userUrl, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'User-Agent': 'BlogKit-Sites',
      'Accept': 'application/json',
    },
  });

  if (!userResponse.ok) {
    const errorText = await userResponse.text();
    console.error('[getTokenData] User fetch failed:', {
      status: userResponse.status,
      statusText: userResponse.statusText,
      body: errorText,
    });
    throw new Error(`Failed to get user info: ${userResponse.status} ${userResponse.statusText}`);
  }

  const userData = await userResponse.json();

  return {
    access_token,
    refresh_token: isToken ? null : data?.refresh_token,
    expires_at: isToken ? null : data?.expires_at,
    providerId: userData.id.toString(),
  };
}
