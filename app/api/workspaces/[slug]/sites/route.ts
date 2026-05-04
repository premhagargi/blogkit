import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';
import { detectPages } from '@/lib/git/page-detect';
import { decrypt, encrypt } from '@/lib/crypto';

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

    const sites = await db.site.findMany({
      where: { workspaceId: workspace.id },
      include: {
        gitConnection: {
          select: {
            provider: true,
            providerId: true,
          },
        },
        _count: {
          select: {
            pageDrafts: true,
            deployments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Error fetching sites:', error);
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

    const workspace = await db.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const {
      name,
      repoFullName,
      gitConnectionId,
      cloudflareAccountId,
      cloudflareApiToken,
      defaultBranch,
    } = await request.json();

    if (!name || !repoFullName || !gitConnectionId || !cloudflareAccountId || !cloudflareApiToken || !defaultBranch) {
      return NextResponse.json(
        { error: 'name, repoFullName, gitConnectionId, cloudflareAccountId, and cloudflareApiToken are required' },
        { status: 400 }
      );
    }

    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspace.id,
        },
      },
    });

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const connection = await db.gitConnection.findUnique({
      where: { id: gitConnectionId },
    });

    if (!connection || connection.workspaceId !== workspace.id) {
      return NextResponse.json({ error: 'Invalid git connection' }, { status: 400 });
    }

    const [owner, repo] = repoFullName.split('/');

    const gitClient = new GitClient(
      connection.provider.toLowerCase() as 'github' | 'gitlab',
      decrypt(connection.accessToken)
    );

    const pages = await detectPages(gitClient, owner, repo, defaultBranch);

    const site = await db.site.create({
      data: {
        name,
        workspaceId: workspace.id,
        repoFullName,
        repoId: `${owner}/${repo}`,
        defaultBranch,
        gitProvider: connection.provider,
        cloudflareAccountId: encrypt(cloudflareAccountId),
        cloudflareApiToken: encrypt(cloudflareApiToken),
        gitConnectionId,
      },
    });

    console.log(`[site/create] Created site ${site.id} for repo ${repoFullName} on branch ${defaultBranch}`);

    if (pages.length > 0) {
      await db.pageDraft.createMany({
        data: pages.map(page => ({
          path: page.path,
          content: '',
          lastSyncedCommitSha: null,
          siteId: site.id,
        })),
      });
      console.log(`[site/create] Created ${pages.length} page drafts`);
    } else {
      console.log(`[site/create] No pages detected in repository`);
    }

    return NextResponse.json({
      site: {
        ...site,
        pagesDetected: pages.length,
      },
    });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
