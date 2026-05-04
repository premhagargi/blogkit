import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await params;

    const { message = 'Update pages' } = await request.json();

    const site = await db.site.findUnique({
      where: { id: siteId },
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
      if (!draft.content) continue;

      // Get the identifier required to update this file
      let updateId: string | undefined = draft.lastSyncedCommitSha || undefined;

      if (!updateId) {
        try {
          updateId = await gitClient.getFileUpdateId(owner, repo, draft.path, site.defaultBranch);
        } catch (error) {
          console.log(`[commit] File ${draft.path} not in repo yet, will create: ${error}`);
        }
      }

      const commit = await gitClient.commitFile(
        owner,
        repo,
        draft.path,
        draft.content,
        message,
        site.defaultBranch,
        updateId
      );

      commits.push(commit);

      // Save identifier for next update
      const nextUpdateId = commit.blobSha || commit.sha;
      await db.pageDraft.update({
        where: { id: draft.id },
        data: { lastSyncedCommitSha: nextUpdateId },
      });
    }

    console.log(`[commit] Committed ${commits.length} files for site ${siteId}`);
        } catch (error) {
          // File doesn't exist in repo yet - will create new
          console.log(`File ${draft.path} not found in repo, creating new`);
        }
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

    // Update lastSyncedCommitSha with file's blob SHA for future updates
    await db.pageDraft.update({
      where: { id: draft.id },
      data: { lastSyncedCommitSha: commit.blobSha || commit.sha },
    });
    }

    console.log(`[commit] Site ${siteId}: processing ${site.pageDrafts.length} drafts, ${commits.length} committed`);

    return NextResponse.json({ commits });
  } catch (error) {
    console.error('Error committing changes:', error);
    return NextResponse.json(
      { error: 'Failed to commit changes' },
      { status: 500 }
    );
  }
}