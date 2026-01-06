import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserRedirectDestination } from '@/modules/workspace/actions/workspace-actions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redirectTo = await getUserRedirectDestination(session.user.id);

    return NextResponse.json({
      redirectTo,
    });
  } catch (error) {
    console.error('Error getting redirect destination:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
