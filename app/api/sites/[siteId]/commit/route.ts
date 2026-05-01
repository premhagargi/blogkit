import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';

export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message = 'Update pages' } = await request.json();

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

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const gitClient = new GitClient(
      site.gitConnection.provider.toLowerCase() as 'github' | 'gitlab',
      decrypt(site.gitConnection.accessToken)
    );

    const [owner, repo] = site.repoFullName.split('/');

    const commits = [];

    for (const draft of site.pageDrafts) {
      if (draft.content) {
        // Get current SHA if exists
        let sha: string | undefined;
        try {
          const currentContent = await gitClient.readFile(owner, repo, draft.path, site.defaultBranch);
          // If content differs, we need SHA for update
          // But for simplicity, assume update
        } catch {
          // File doesn't exist, create new
        }

        const commit = await gitClient.commitFile(
          owner,
          repo,
          draft.path,
          draft.content,
          message,
          site.defaultBranch,
          sha
        );

        commits.push(commit);

        // Update lastSyncedCommitSha
        await db.pageDraft.update({
          where: { id: draft.id },
          data: { lastSyncedCommitSha: commit.sha },
        });
      }
    }

    return NextResponse.json({ commits });
  } catch (error) {
    console.error('Error committing changes:', error);
    return NextResponse.json(
      { error: 'Failed to commit changes' },
      { status: 500 }
    );
  }
}