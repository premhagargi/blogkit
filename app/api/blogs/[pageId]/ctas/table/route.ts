import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageCtasConfig, StoredCtaConfig } from '@/types/cta-config';

interface CtaTableData {
  id: string;
  name: string;
  type: 'EndOfPost' | 'Sidebar' | 'InLine' | 'PopUp' | 'Floating';
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  categoryIds: string[];
  tagIds: string[];
  isGlobal: boolean;
  enabled: boolean;
  clickCount: number;
  conversionRate: number;
  lastModified: string;
  createdAt: string;
  version: number;
}

interface TableResponse {
  ctas: CtaTableData[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

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

    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    const sortField = searchParams.get('sortField') || 'lastModified';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Filter parameters
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const isGlobal = searchParams.get('isGlobal');

    // Get the page with CTAs config
    const pageData = await db.page.findFirst({
      where: {
        id: params.pageId,
        workspace: {
          members: {
            some: { userId: session.user.id },
          },
        },
      },
      include: {
        categories: true,
        tags: true,
      },
    });

    if (!pageData) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const ctasConfig = pageData.ctasConfig as any | null;
    if (!ctasConfig?.ctas || ctasConfig.ctas.length === 0) {
      return NextResponse.json({
        ctas: [],
        totalCount: 0,
        pageCount: 0,
        currentPage: page,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    }

    // Transform CTAs to table format
    let ctas: CtaTableData[] = ctasConfig.ctas.map((cta: StoredCtaConfig) => {
      const categoryIds = cta.config.categories || [];
      const tagIds = cta.config.tags || [];

      // Get category information
      const categories = categoryIds
        .filter((catId) => catId !== 'global')
        .map((catId) => {
          const categoryData = pageData.categories.find(
            (cat) => cat.id === catId
          );
          return categoryData
            ? {
                id: categoryData.id,
                name: categoryData.name,
                slug: categoryData.slug,
              }
            : null;
        })
        .filter(Boolean) as Array<{ id: string; name: string; slug: string }>;

      // Get tag information
      const tags = tagIds
        .map((tagId) => {
          const tagData = pageData.tags?.find((tag) => tag.id === tagId);
          return tagData
            ? {
                id: tagData.id,
                name: tagData.name,
                slug: tagData.slug,
              }
            : null;
        })
        .filter(Boolean) as Array<{ id: string; name: string; slug: string }>;

      return {
        id: cta.id,
        name: cta.config.ctaName,
        type: cta.config.type,
        categoryIds,
        tagIds,
        categories,
        tags,
        isGlobal: categoryIds.includes('global'),
        enabled: cta.isActive !== false,
        clickCount: 0,
        conversionRate: 0,
        lastModified: cta.updatedAt,
        createdAt: cta.createdAt,
        version: cta.version,
      };
    });

    // Apply filters
    if (search) {
      ctas = ctas.filter((cta) =>
        cta.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type && type !== 'all') {
      ctas = ctas.filter((cta) => cta.type === type);
    }

    if (category && category !== 'all') {
      if (category === 'global') {
        ctas = ctas.filter((cta) => cta.isGlobal);
      } else {
        ctas = ctas.filter((cta) => cta.categoryIds.includes(category));
      }
    }

    if (tag && tag !== 'all') {
      ctas = ctas.filter((cta) => cta.tagIds.includes(tag));
    }

    if (isGlobal !== null && isGlobal !== undefined) {
      const globalFilter = isGlobal === 'true';
      ctas = ctas.filter((cta) => cta.isGlobal === globalFilter);
    }

    // TODO: Get click/interaction counts when CtaInteraction model is implemented
    // For now, we'll generate some mock data
    ctas = ctas.map((cta, index) => ({
      ...cta,
      clickCount: Math.floor(Math.random() * 100) + 1, // Mock data
      conversionRate: Math.floor(Math.random() * 50) + 10,
    }));

    // Apply sorting
    ctas.sort((a, b) => {
      let aValue: any = a[sortField as keyof CtaTableData];
      let bValue: any = b[sortField as keyof CtaTableData];

      if (sortField === 'lastModified' || sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'name') {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Calculate pagination
    const totalCount = ctas.length;
    const pageCount = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < pageCount;
    const hasPreviousPage = page > 1;

    // Apply pagination
    const paginatedCtas = ctas.slice(skip, skip + pageSize);

    const response: TableResponse = {
      ctas: paginatedCtas,
      totalCount,
      pageCount,
      currentPage: page,
      hasNextPage,
      hasPreviousPage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching CTAs table data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
