import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageFormsConfig } from '@/types/form-config';

// GET - Get specific form
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ pageId: string; formId: string }> }
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
            some: { userId: session.user.id },
          },
        },
      },
      include: {
        categories: true,
        tags: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const formsConfig = page.formsConfig as unknown as PageFormsConfig | null;
    const form = formsConfig?.forms.find((f) => f.id === params.formId);

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Get submission count for this form
    const submissionCount = await db.formSubmission.count({
      where: {
        formId: params.formId,
        pageId: params.pageId,
      },
    });

    // Get category and tag names
    const categoryNames =
      form.categoryIds?.map((catId) => {
        const category = page.categories.find((cat) => cat.id === catId);
        return category?.name || 'Unknown';
      }) || [];

    const tagNames =
      form.tagIds?.map((tagId) => {
        const tag = page.tags.find((tag) => tag.id === tagId);
        return tag?.name || 'Unknown';
      }) || [];

    return NextResponse.json({
      success: true,
      data: {
        form: {
          ...form,
          categoryNames,
          tagNames,
        },
        submissionCount,
        isDefaultForCategory:
          form.categoryIds?.some(
            (catId) => formsConfig?.categoryFormMapping[catId] === form.id
          ) || false,
        isGlobalDefault: formsConfig?.globalDefaultFormId === form.id,
      },
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete form
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ pageId: string; formId: string }> }
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

    const currentFormsConfig =
      (page.formsConfig as unknown as PageFormsConfig) || {
        forms: [],
        categoryFormMapping: {},
      };

    const formIndex = currentFormsConfig.forms.findIndex(
      (f) => f.id === params.formId
    );
    if (formIndex === -1) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const formToDelete = currentFormsConfig.forms[formIndex];

    // Remove form
    currentFormsConfig.forms.splice(formIndex, 1);

    // Clean up category mappings
    Object.keys(currentFormsConfig.categoryFormMapping).forEach(
      (categoryId) => {
        if (
          currentFormsConfig.categoryFormMapping[categoryId] === params.formId
        ) {
          delete currentFormsConfig.categoryFormMapping[categoryId];
        }
      }
    );

    // Clean up global default
    if (currentFormsConfig.globalDefaultFormId === params.formId) {
      currentFormsConfig.globalDefaultFormId = undefined;
    }

    await db.page.update({
      where: { id: params.pageId },
      data: { formsConfig: currentFormsConfig as any },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Form deleted successfully',
        deletedForm: formToDelete,
      },
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
