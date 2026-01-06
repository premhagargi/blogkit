import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageFormsConfig, StoredFormConfig } from '@/types/form-config';

interface FormTableData {
  id: string;
  name: string;
  type: 'EndOfPost' | 'Sidebar' | 'InLine' | 'PopUp' | 'Floating' | 'Gated';
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
  submissionCount: number;
  lastModified: string;
  createdAt: string;
  version: number;
}

interface TableResponse {
  forms: FormTableData[];
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

    // Sorting parameters
    const sortField = searchParams.get('sortField') || 'lastModified';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Filter parameters
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isGlobal = searchParams.get('isGlobal');

    // Get the page with forms config - INCLUDE TAGS
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
        tags: true, // Add tags here
      },
    });

    if (!pageData) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const formsConfig = pageData.formsConfig as any | null;
    if (!formsConfig?.forms || formsConfig.forms.length === 0) {
      return NextResponse.json({
        forms: [],
        totalCount: 0,
        pageCount: 0,
        currentPage: page,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    }

    // Transform forms to table format - UPDATED TO USE ARRAYS
    let forms: FormTableData[] = formsConfig.forms.map(
      (form: StoredFormConfig) => {
        const categoryIds =
          form.categoryIds ||
          ((form as any).categoryId ? [(form as any).categoryId] : []);
        const tagIds = form.tagIds || [];

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
          id: form.id,
          name: form.name,
          type: form.config.formType,
          categoryIds,
          tagIds,
          categories,
          tags,
          isGlobal: categoryIds.includes('global'),
          enabled: form.enabled !== false,
          submissionCount: 0, // Will be populated below
          lastModified: form.updatedAt,
          createdAt: form.createdAt,
          version: form.version,
        };
      }
    );

    // Apply filters - UPDATED TO USE ARRAYS
    if (search) {
      forms = forms.filter((form) =>
        form.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type && type !== 'all') {
      forms = forms.filter((form) => form.type === type);
    }

    if (category && category !== 'all') {
      if (category === 'global') {
        forms = forms.filter((form) => form.isGlobal);
      } else {
        forms = forms.filter((form) => form.categoryIds.includes(category));
      }
    }

    if (isGlobal !== null && isGlobal !== undefined) {
      const globalFilter = isGlobal === 'true';
      forms = forms.filter((form) => form.isGlobal === globalFilter);
    }

    // Get submission counts for all forms in batch
    const formIds = forms.map((form) => form.id);
    const submissionCounts =
      formIds.length > 0
        ? await db.formSubmission.groupBy({
            by: ['formId'],
            where: {
              formId: { in: formIds },
              pageId: params.pageId,
            },
            _count: {
              id: true,
            },
          })
        : [];

    // Create submission count map
    const submissionCountMap = submissionCounts.reduce((acc, item) => {
      acc[item.formId] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Update submission counts
    forms = forms.map((form) => ({
      ...form,
      submissionCount: submissionCountMap[form.id] || 0,
    }));

    // Apply sorting
    forms.sort((a, b) => {
      let aValue: any = a[sortField as keyof FormTableData];
      let bValue: any = b[sortField as keyof FormTableData];

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
    const totalCount = forms.length;
    const pageCount = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < pageCount;
    const hasPreviousPage = page > 1;

    // Apply pagination
    const paginatedForms = forms.slice(skip, skip + pageSize);

    const response: TableResponse = {
      forms: paginatedForms,
      totalCount,
      pageCount,
      currentPage: page,
      hasNextPage,
      hasPreviousPage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching forms table data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
