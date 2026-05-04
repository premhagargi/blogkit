import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await params;

    const site = await db.site.findUnique({
      where: { id: siteId },
      include: {
        gitConnection: true,
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

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'path query parameter required' }, { status: 400 });
    }

    // Check PageDraft for this file (draft content overrides repo)
    const draft = site.pageDrafts?.find(d => d.path === path);
    if (draft?.content) {
      return new NextResponse(draft.content, {
        headers: {
          'Content-Type': getContentType(path),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Fetch from repo
    const gitClient = new GitClient(
      site.gitConnection.provider.toLowerCase() as 'github' | 'gitlab',
      decrypt(site.gitConnection.accessToken)
    );

    const [owner, repo] = site.repoFullName.split('/');
    const content = await gitClient.readFile(owner, repo, path, site.defaultBranch);

    return new NextResponse(content, {
      headers: {
        'Content-Type': getContentType(path),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}

function getContentType(path: string): string {
  if (path.endsWith('.html') || path.endsWith('.htm')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.md')) return 'text/markdown';
  if (path.endsWith('.txt')) return 'text/plain';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}
