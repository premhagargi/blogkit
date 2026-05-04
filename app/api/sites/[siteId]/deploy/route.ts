import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';
import { CloudflarePagesClient } from '@/lib/cloudflare/pages';

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

    const cfClient = new CloudflarePagesClient(
      decrypt(site.cloudflareAccountId),
      decrypt(site.cloudflareApiToken)
    );

    const projectName = `${site.workspaceId}-${site.id}`.replace(/[^a-z0-9-]/g, '-');

    const gitClient = new GitClient(
      site.gitConnection.provider.toLowerCase() as 'github' | 'gitlab',
      decrypt(site.gitConnection.accessToken)
    );

    const [owner, repo] = site.repoFullName.split('/');

    // Ensure Cloudflare project exists
    try {
      await cfClient.getProject(projectName);
      console.log(`[deploy] Cloudflare project ${projectName} already exists`);
    } catch (error: any) {
      const errorMsg = error?.message || '';
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.log(`[deploy] Creating Cloudflare project: ${projectName}`);
        await cfClient.createProject(projectName, {
          type: site.gitConnection.provider.toLowerCase() as 'github' | 'gitlab',
          config: {
            owner,
            repo,
            branch: site.defaultBranch,
          },
        });
        console.log(`[deploy] Cloudflare project created`);
      } else {
        throw error;
      }
    }

    console.log(`[deploy] Fetching repo files from ${owner}/${repo}@${site.defaultBranch}...`);
    const files = await gitClient.listFiles(owner, repo, '', site.defaultBranch);
    const fileContents: { [path: string]: Buffer } = {};
    const manifest: { [path: string]: string } = {};

    for (const file of files) {
      if (file.type === 'file') {
        try {
          const content = await gitClient.readFile(owner, repo, file.path, site.defaultBranch);
          fileContents[file.path] = Buffer.from(content);
          manifest[file.path] = file.sha;
        } catch (error) {
          console.warn(`Could not read file ${file.path}:`, error);
        }
      }
    }

    // Apply drafts
    for (const draft of site.pageDrafts) {
      if (draft.content) {
        fileContents[draft.path] = Buffer.from(draft.content);
        manifest[draft.path] = draft.lastSyncedCommitSha || '';
      }
    }

    console.log(`[deploy] Uploading ${Object.keys(fileContents).length} files to Cloudflare...`);
    // Upload deployment
    const cfDeployment = await cfClient.uploadDeployment(projectName, fileContents, manifest);

    console.log(`[deploy] Deployment created:`, cfDeployment.id, cfDeployment.status, cfDeployment.url);

    // Store Deployment record
    const deployment = await db.deployment.create({
      data: {
        siteId: site.id,
        status: cfDeployment.status === 'success' ? 'SUCCESS' : cfDeployment.status === 'failure' ? 'FAILED' : 'PENDING',
        url: cfDeployment.url,
      },
    });

    return NextResponse.json({ deployment });
  } catch (error) {
    console.error('Error deploying site:', error);

    // Store failed deployment
    await db.deployment.create({
      data: {
        siteId: siteId,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      { error: 'Failed to deploy site' },
      { status: 500 }
    );
  }
}