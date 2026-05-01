import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';
import { detectPages } from '@/lib/git/page-detect';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    const site = await db.site.findUnique({
      where: { id: params.siteId },
      include: {
        gitConnection: true,
        pageDrafts: true,
      },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check workspace access
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: site.workspaceId,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (path) {
      // Get specific page content
      const draft = site.pageDrafts.find(d => d.path === path);

      if (draft && draft.content) {
        return NextResponse.json({ content: draft.content, lastSyncedCommitSha: draft.lastSyncedCommitSha });
      }

      // Fetch from repo
      const gitClient = new GitClient(
        site.gitConnection.provider.toLowerCase() as 'github' | 'gitlab',
        decrypt(site.gitConnection.accessToken)
      );

      const [owner, repo] = site.repoFullName.split('/');
      const fileContent = await gitClient.readFile(owner, repo, path, site.defaultBranch);

      return NextResponse.json({ content: fileContent, lastSyncedCommitSha: null });
    } else {
      // List all pages
      const gitClient = new GitClient(
        site.gitConnection.provider.toLowerCase() as 'github' | 'gitlab',
        decrypt(site.gitConnection.accessToken)
      );

      const [owner, repo] = site.repoFullName.split('/');
      const repoPages = await detectPages(gitClient, owner, repo, site.defaultBranch);

      // Merge with drafts
      const pages = repoPages.map(repoPage => {
        const draft = site.pageDrafts.find(d => d.path === repoPage.path);
        return {
          path: repoPage.path,
          title: repoPage.title,
          type: repoPage.type,
          hasDraft: !!draft,
          lastModified: draft ? draft.updatedAt : new Date(),
        };
      });

      return NextResponse.json({ pages });
    }
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path, content } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    const site = await db.site.findUnique({
      where: { id: params.siteId },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check workspace access
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: site.workspaceId,
        },
      },
    });

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Save edits in DB
    const draft = await db.pageDraft.upsert({
      where: {
        siteId_path: {
          siteId: params.siteId,
          path,
        },
      },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        siteId: params.siteId,
        path,
        content,
        lastSyncedCommitSha: null,
      },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error saving page draft:', error);
    return NextResponse.json(
      { error: 'Failed to save page draft' },
      { status: 500 }
    );
  }
}