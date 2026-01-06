import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageCtasConfig } from '@/types/cta-config';

// GET - Get individual CTA by ID
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ pageId: string; ctaId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await db.page.findFirst({
      where: {
        id: params.pageId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'] },
            },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found or access denied' },
        { status: 403 }
      );
    }

    const ctasConfig = page.ctasConfig as any | null;

    if (!ctasConfig?.ctas) {
      return NextResponse.json({ error: 'No CTAs found' }, { status: 404 });
    }

    const cta = ctasConfig.ctas.find((c) => c.id === params.ctaId);

    if (!cta) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        cta,
      },
    });
  } catch (error) {
    console.error('Error fetching CTA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ pageId: string; ctaId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await db.page.findFirst({
      where: {
        id: params.pageId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
            },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found or access denied' },
        { status: 403 }
      );
    }

    const currentCtasConfig = (page.ctasConfig as any) || {
      ctas: [],
    };
    const ctaIndex = currentCtasConfig.ctas.findIndex(
      (c) => c.id === params.ctaId
    );

    if (ctaIndex === -1) {
      return NextResponse.json({ error: 'CTA not found' }, { status: 404 });
    }

    const deletedCta = currentCtasConfig.ctas[ctaIndex];

    // Remove CTA from array
    const updatedCtas = currentCtasConfig.ctas.filter(
      (c) => c.id !== params.ctaId
    );

    const updatedCtasConfig = {
      ...currentCtasConfig,
      ctas: updatedCtas,
      lastUpdated: new Date().toISOString(),
    };

    const updatedCategoryMapping = {
      ...((page.categoryCtaMapping as any) || {}),
    };
    const updatedTagMapping = { ...(currentCtasConfig.tagMapping || {}) };

    Object.keys(updatedCategoryMapping).forEach((categoryId) => {
      if (updatedCategoryMapping[categoryId] === params.ctaId) {
        delete updatedCategoryMapping[categoryId];
      }
    });

    Object.keys(updatedTagMapping).forEach((tagId) => {
      if (updatedTagMapping[tagId] === params.ctaId) {
        delete updatedTagMapping[tagId];
      }
    });

    const newGlobalDefaultCtaId =
      page.globalDefaultCtaId === params.ctaId ? null : page.globalDefaultCtaId;

    await db.page.update({
      where: { id: params.pageId },
      data: {
        ctasConfig: {
          ...updatedCtasConfig,
          tagMapping: updatedTagMapping,
        },
        categoryCtaMapping: updatedCategoryMapping,
        globalDefaultCtaId: newGlobalDefaultCtaId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'CTA deleted successfully',
        deletedCta,
      },
    });
  } catch (error) {
    console.error('Error deleting CTA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
