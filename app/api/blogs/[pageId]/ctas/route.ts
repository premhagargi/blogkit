import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { z } from 'zod';

// Validation schema for CTA configuration
const CtaConfigSchema = z
  .object({
    ctaName: z.string().min(1, 'CTA name is required'),
    type: z.enum(['EndOfPost', 'Sidebar', 'InLine', 'PopUp', 'Floating']),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    trigger: z.enum(['TimeDelay', 'Scroll', 'ExitIntent']),
    timeDelay: z.number().min(0),
    scrollTrigger: z.number().min(0).max(100),
    content: z.object({
      heading: z.string().min(1, 'Heading is required'),
      description: z.string(),
      primaryButton: z.object({
        text: z.string().min(1, 'Primary button text is required'),
        url: z.string().min(1, 'Primary button URL is required'),
      }),
      secondaryButton: z.object({
        text: z.string(),
        url: z.string(),
      }),
      footnote: z.string(),
    }),
    customCode: z.object({
      isEnabled: z.boolean(),
      code: z.string(),
    }),
  })
  .refine(
    (data) => {
      return data.categories.length > 0 || data.tags.length > 0;
    },
    {
      message: 'At least one category or tag is required',
      path: ['categories'],
    }
  );

const CreateCtaSchema = z.object({
  config: CtaConfigSchema,
});

// GET - List all CTAs for a page
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify page access
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
      include: {
        categories: true,
        tags: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found or access denied' },
        { status: 403 }
      );
    }

    const ctasConfig = page.ctasConfig as any;

    return NextResponse.json({
      success: true,
      data: {
        ctas: ctasConfig?.ctas || [],
        categoryMapping: page.categoryCtaMapping || {},
        globalDefaultCtaId: page.globalDefaultCtaId,
        availableCategories: page.categories,
        availableTags: page.tags,
      },
    });
  } catch (error) {
    console.error('Error fetching CTAs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new CTA
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = CreateCtaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { config } = validationResult.data;

    // Verify page access and categories/tags exist
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
      include: {
        categories: true,
        tags: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page not found or access denied',
        },
        { status: 403 }
      );
    }

    // ✅ Validate categories exist (only if categories are provided)
    if (config.categories.length > 0) {
      const invalidCategories = config.categories.filter(
        (catId) =>
          catId !== 'global' && !page.categories.some((cat) => cat.id === catId)
      );

      if (invalidCategories.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid category IDs',
            details: invalidCategories,
          },
          { status: 400 }
        );
      }
    }

    if (config.tags.length > 0) {
      const invalidTags = config.tags.filter(
        (tagId) => !page.tags.some((tag) => tag.id === tagId)
      );

      if (invalidTags.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid tag IDs',
            details: invalidTags,
          },
          { status: 400 }
        );
      }
    }

    // Create new CTA
    const ctaId = crypto.randomUUID();
    const newCta = {
      id: ctaId,
      config,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    // Get current CTAs configuration
    const currentCtasConfig = (page.ctasConfig as any) || {
      ctas: [],
      lastUpdated: new Date().toISOString(),
    };

    // Add new CTA to the list
    const updatedCtasConfig = {
      ...currentCtasConfig,
      ctas: [...currentCtasConfig.ctas, newCta],
      lastUpdated: new Date().toISOString(),
    };

    // Update category mapping (only if categories exist)
    const updatedCategoryMapping = {
      ...((page.categoryCtaMapping as any) || {}),
    };
    if (config.categories.length > 0) {
      config.categories.forEach((categoryId) => {
        if (categoryId !== 'global') {
          updatedCategoryMapping[categoryId] = ctaId;
        }
      });
    }

    // Update tag mapping (only if tags exist)
    const updatedTagMapping = { ...(currentCtasConfig.tagMapping || {}) };
    if (config.tags.length > 0) {
      config.tags.forEach((tagId) => {
        updatedTagMapping[tagId] = ctaId;
      });
    }

    // Update page in database
    await db.page.update({
      where: { id: params.pageId },
      data: {
        ctasConfig: {
          ...updatedCtasConfig,
          tagMapping: updatedTagMapping,
        },
        categoryCtaMapping: updatedCategoryMapping,
        // Set as global default if 'global' category is selected
        globalDefaultCtaId: config.categories.includes('global')
          ? ctaId
          : page.globalDefaultCtaId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          cta: newCta,
          message: 'CTA created successfully!',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating CTA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing CTA
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ctaId, config } = body;

    if (!ctaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'CTA ID is required for updates',
        },
        { status: 400 }
      );
    }

    // Validate config
    const validationResult = CtaConfigSchema.safeParse(config);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify page access
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
      include: {
        categories: true,
        tags: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page not found or access denied',
        },
        { status: 403 }
      );
    }

    const currentCtasConfig = (page.ctasConfig as any) || { ctas: [] };
    const ctaIndex = currentCtasConfig.ctas.findIndex(
      (cta: any) => cta.id === ctaId
    );

    if (ctaIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'CTA not found',
        },
        { status: 404 }
      );
    }

    // Update the CTA
    const updatedCta = {
      ...currentCtasConfig.ctas[ctaIndex],
      config: validationResult.data,
      updatedAt: new Date().toISOString(),
      version: (currentCtasConfig.ctas[ctaIndex].version || 1) + 1,
    };

    currentCtasConfig.ctas[ctaIndex] = updatedCta;
    currentCtasConfig.lastUpdated = new Date().toISOString();

    // Update category and tag mappings
    const updatedCategoryMapping = {
      ...((page.categoryCtaMapping as any) || {}),
    };
    const updatedTagMapping = { ...(currentCtasConfig.tagMapping || {}) };

    // Remove old mappings for this CTA
    Object.keys(updatedCategoryMapping).forEach((categoryId) => {
      if (updatedCategoryMapping[categoryId] === ctaId) {
        delete updatedCategoryMapping[categoryId];
      }
    });
    Object.keys(updatedTagMapping).forEach((tagId) => {
      if (updatedTagMapping[tagId] === ctaId) {
        delete updatedTagMapping[tagId];
      }
    });

    // Add new mappings (only if they exist)
    if (validationResult.data.categories.length > 0) {
      validationResult.data.categories.forEach((categoryId) => {
        if (categoryId !== 'global') {
          updatedCategoryMapping[categoryId] = ctaId;
        }
      });
    }

    if (validationResult.data.tags.length > 0) {
      validationResult.data.tags.forEach((tagId) => {
        updatedTagMapping[tagId] = ctaId;
      });
    }

    // Update page in database
    await db.page.update({
      where: { id: params.pageId },
      data: {
        ctasConfig: {
          ...currentCtasConfig,
          tagMapping: updatedTagMapping,
        },
        categoryCtaMapping: updatedCategoryMapping,
        globalDefaultCtaId: validationResult.data.categories.includes('global')
          ? ctaId
          : page.globalDefaultCtaId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        cta: updatedCta,
        message: 'CTA updated successfully!',
      },
    });
  } catch (error) {
    console.error('Error updating CTA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
