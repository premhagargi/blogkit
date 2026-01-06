"use server";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";

// Get all tags for a specific page with usage stats
export async function getWorkspaceTagsWithStats(
  workspaceSlug: string,
  pageId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    include: {
      tags: {
        where: { pageId: pageId }, // ✅ Filter by specific page
        include: {
          _count: {
            select: { blogPosts: true },
          },
        },
        orderBy: { name: "asc" }, // ✅ Changed from usageCount to name
      },
    },
  });

  if (!workspace) return null;

  const tagsWithStats = workspace.tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    color: tag.color,
    workspaceId: tag.workspaceId,
    pageId: tag.pageId, // ✅ Add pageId
    posts: tag._count.blogPosts,
    isPublic: tag.isPublic ?? true,
    traffic: Math.floor(Math.random() * 1000), // TODO: Replace with real analytics
    leads: Math.floor(Math.random() * 100), // TODO: Replace with real analytics
    usageCount: tag._count.blogPosts, // ✅ Calculate from _count
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }));
  console.log(tagsWithStats);
  return {
    workspaceId: workspace.id,
    tags: tagsWithStats,
  };
}

// Create new tag
export async function createTag(
  workspaceSlug: string,
  pageId: string, // ✅ Add pageId parameter
  data: {
    name: string;
    description?: string;
    color?: string;
    isPublic?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
          role: { in: ["OWNER", "ADMIN", "EDITOR"] },
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("Access denied");
  }

  // Verify page exists and belongs to workspace
  const page = await db.page.findFirst({
    where: { id: pageId, workspaceId: workspace.id },
  });

  if (!page) {
    throw new Error("Page not found");
  }

  // Check if tag name already exists for this page
  const existingTag = await db.tag.findFirst({
    where: { name: data.name, pageId: pageId },
  });

  if (existingTag) {
    throw new Error("A tag with this name already exists for this blog");
  }

  // Generate unique slug for this page
  const baseSlug = generateSlug(data.name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await db.tag.findFirst({
      where: { slug, pageId: pageId }, // ✅ Unique per page
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const tag = await db.tag.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      color: data.color || generateRandomColor(),
      workspaceId: workspace.id,
      pageId: pageId, // ✅ Add pageId
      isPublic: data.isPublic || true,
    },
  });

  return { success: true, tag };
}

// Update tag
export async function updateTag(
  workspaceSlug: string,
  tagId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    isPublic?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
          role: { in: ["OWNER", "ADMIN", "EDITOR"] },
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("Access denied");
  }

  // Get the tag to find its pageId
  const existingTag = await db.tag.findFirst({
    where: { id: tagId, workspaceId: workspace.id },
  });

  if (!existingTag) {
    throw new Error("Tag not found");
  }

  const updateData: any = { ...data };

  // Check if name already exists for this page (excluding current tag)
  if (data.name) {
    const existingNameTag = await db.tag.findFirst({
      where: {
        name: data.name,
        pageId: existingTag.pageId,
        id: { not: tagId },
      },
    });

    if (existingNameTag) {
      throw new Error("A tag with this name already exists for this blog");
    }

    // Generate new slug if name changed
    const baseSlug = generateSlug(data.name);
    let slug = baseSlug;
    let counter = 1;

    while (
      await db.tag.findFirst({
        where: {
          slug,
          pageId: existingTag.pageId,
          id: { not: tagId },
        },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    updateData.slug = slug;
  }

  const tag = await db.tag.update({
    where: { id: tagId, workspaceId: workspace.id },
    data: updateData,
  });

  return { success: true, tag };
}

// Delete tag
export async function deleteTag(workspaceSlug: string, tagId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: {
        some: {
          userId: session.user.id,
          role: { in: ["OWNER", "ADMIN", "EDITOR"] },
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("Access denied");
  }

  // Note: Deleting tag will automatically remove it from associated posts due to many-to-many relation
  await db.tag.delete({
    where: { id: tagId, workspaceId: workspace.id },
  });

  return { success: true };
}

// Helper functions
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateRandomColor(): string {
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
