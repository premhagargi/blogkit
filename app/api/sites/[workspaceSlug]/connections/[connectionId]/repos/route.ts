import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import db from '@/lib/db';
import { GitClient } from '@/lib/git';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceSlug: string; connectionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceSlug, connectionId } = params;

    // Find workspace by slug
    const workspace = await db.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
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

    // Get git connection
    const connection = await db.gitConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || connection.workspaceId !== workspace.id) {
      return NextResponse.json({ error: 'Invalid git connection' }, { status: 400 });
    }

    // Fetch repos using stored token
    const gitClient = new GitClient(
      connection.provider.toLowerCase() as 'github' | 'gitlab',
      decrypt(connection.accessToken)
    );

    const repos = await gitClient.listRepos();

    // Return repo name + default branch
    const formattedRepos = repos.map(repo => ({
      fullName: repo.full_name,
      name: repo.name,
      defaultBranch: repo.default_branch,
    }));

    return NextResponse.json({ repos: formattedRepos });
  } catch (error) {
    console.error('Error fetching repos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}