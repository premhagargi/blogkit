import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import {
  FormConfig,
  StoredFormConfig,
  PageFormsConfig,
} from "@/types/form-config";
import { z } from "zod";

// Validation schema
const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    "Email",
    "ShortText",
    "LongText",
    "Phone",
    "Country",
    "Select",
    "MultiSelect",
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  isRequired: z.boolean(),
  options: z.array(z.string()).optional(),
  order: z.number(),
});

const FormConfigSchema = z.object({
  formName: z.string().min(1, "Form name is required"),
  heading: z.string().min(1, "Heading is required"),
  description: z.string(),
  formType: z.enum([
    "EndOfPost",
    "Sidebar",
    "InLine",
    "PopUp",
    "Floating",
    "Gated",
  ]),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  tags: z.array(z.string()).default([]),
  formTrigger: z.enum(["TimeDelay", "Scroll", "ExitIntent"]),
  timeDelay: z.number().min(0),
  scrollTrigger: z.number().min(0).max(100),
  isMandatory: z.boolean(),
  fields: z.array(FormFieldSchema).min(1, "At least one field is required"),
  buttonText: z.string().min(1, "Button text is required"),
  footnote: z.string(),
  isMultiStep: z.boolean(),
  confirmation: z.object({
    heading: z.string(),
    description: z.string(),
    buttonText: z.string(),
    buttonType: z.enum(["Close", "Link"]),
    url: z.string().optional(),
    openInNewTab: z.boolean().optional(),
  }),
  embedCode: z.object({
    isEnabled: z.boolean(),
    code: z.string(),
  }),
  customCode: z.object({
    isEnabled: z.boolean(),
    code: z.string(),
  }),
  formValues: z.record(z.string(), z.any()),
});

const CreateFormSchema = z.object({
  config: FormConfigSchema,
  values: z.record(z.string(), z.any()).optional(),
});

// GET - List all forms for a page
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const formsConfig = page.formsConfig as any | null;

    // Get submission counts for each form
    const formIds = formsConfig?.forms.map((f: any) => f.id) || [];
    const submissionCounts =
      formIds.length > 0
        ? await db.formSubmission.count({
            where: {
              formId: { in: formIds },
              pageId: params.pageId,
            },
          })
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        forms: formsConfig?.forms || [],
        categoryFormMapping: formsConfig?.categoryFormMapping || {},
        globalDefaultFormId: formsConfig?.globalDefaultFormId,
        totalSubmissions: submissionCounts,
        availableCategories: page.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })),
        availableTags: page.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new form
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = CreateFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { config } = validationResult.data;

    // Verify page access and category exists
    const page = await db.page.findFirst({
      where: {
        id: params.pageId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ["OWNER", "ADMIN", "EDITOR"] },
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
        { error: "Page not found or access denied" },
        { status: 403 }
      );
    }

    // Validate categories exist
    const invalidCategories = config.categories.filter(
      (catId) =>
        catId !== "global" && !page.categories.some((cat) => cat.id === catId)
    );
    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { error: "Invalid category IDs", details: invalidCategories },
        { status: 400 }
      );
    }

    // Validate tags exist
    const invalidTags = config.tags.filter(
      (tagId) => !page.tags.some((tag) => tag.id === tagId)
    );
    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: "Invalid tag IDs", details: invalidTags },
        { status: 400 }
      );
    }

    // Get current forms config
    const currentFormsConfig = (page.formsConfig as any) || {
      forms: [],
      categoryFormMapping: {},
    };

    // Create new form
    // Create new form
    const newForm: StoredFormConfig = {
      id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.formName,
      categoryIds: config.categories, // Changed to array
      tagIds: config.tags, // Added tags array
      config: config as FormConfig,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    // Add to forms array
    const updatedFormsConfig: PageFormsConfig = {
      ...currentFormsConfig,
      forms: [...currentFormsConfig.forms, newForm],
    };

    // Update page
    await db.page.update({
      where: { id: params.pageId },
      data: { formsConfig: updatedFormsConfig as any },
    });

    return NextResponse.json({
      success: true,
      data: {
        form: newForm,
        message: "Form created successfully",
      },
    });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update forms and category mappings
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  const params = await props.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      categoryFormMapping,
      globalDefaultFormId,
      formId,
      config: updatedConfig,
    }: {
      categoryFormMapping?: { [categoryId: string]: string };
      globalDefaultFormId?: string;
      formId?: string;
      config?: FormConfig;
    } = body;

    const page = await db.page.findFirst({
      where: {
        id: params.pageId,
        workspace: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ["OWNER", "ADMIN", "EDITOR"] },
            },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: "Page not found or access denied" },
        { status: 403 }
      );
    }

    const currentFormsConfig = (page.formsConfig as any) || {
      forms: [],
      categoryFormMapping: {},
    };

    let updatedFormsConfig = { ...currentFormsConfig };

    // Update specific form if provided
    if (formId && updatedConfig) {
      const formIndex = updatedFormsConfig.forms.findIndex(
        (f) => f.id === formId
      );
      if (formIndex === -1) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }

      // Validate updated config
      const validationResult = FormConfigSchema.safeParse(updatedConfig);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.issues,
          },
          { status: 400 }
        );
      }

      updatedFormsConfig.forms[formIndex] = {
        ...updatedFormsConfig.forms[formIndex],
        name: updatedConfig.formName,
        categoryIds: updatedConfig.categories,
        tagIds: updatedConfig.tags,
        config: updatedConfig,
        updatedAt: new Date().toISOString(),
        version: updatedFormsConfig.forms[formIndex].version + 1,
      };
    }

    // Update category mappings if provided
    if (categoryFormMapping) {
      updatedFormsConfig.categoryFormMapping = categoryFormMapping;
    }

    // Update global default if provided
    if (globalDefaultFormId !== undefined) {
      updatedFormsConfig.globalDefaultFormId = globalDefaultFormId;
    }

    await db.page.update({
      where: { id: params.pageId },
      data: { formsConfig: updatedFormsConfig },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Forms configuration updated successfully",
        config: updatedFormsConfig,
      },
    });
  } catch (error) {
    console.error("Error updating forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
